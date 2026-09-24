import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(import.meta.filename), '..');
const frontend = join(root, 'frontend');
const bundle = join(root, 'bundle');
const frontendOutput = join(frontend, 'dist', 'snip-frontend', 'browser');
const push = process.argv.includes('--push');
const useShell = process.platform === 'win32';

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    shell: useShell && (command === 'npm' || command === 'npx'),
    stdio: 'inherit',
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with code ${result.status}`);
  }
}

function hasStagedChanges(cwd) {
  const result = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd, stdio: 'ignore' });
  if (result.status === 0) return false;
  if (result.status === 1) return true;
  throw new Error(`Unable to inspect staged changes in ${cwd}`);
}

function writeGeneratedFiles() {
  const publicDirectory = join(bundle, 'public');
  rmSync(publicDirectory, { recursive: true, force: true });
  mkdirSync(publicDirectory, { recursive: true });
  cpSync(frontendOutput, publicDirectory, { recursive: true });
  cpSync(join(root, 'backend', 'server.js'), join(bundle, 'server.js'));
  cpSync(join(root, 'cli', 'cli.js'), join(bundle, 'cli.js'));
  writeFileSync(join(bundle, '.env'), 'PUBLIC_DIR=./public\n');
  writeFileSync(join(bundle, 'package.json'), `${JSON.stringify({
    name: 'snip-bundle',
    private: true,
    scripts: { start: 'bun server.js' },
  }, null, 2)}\n`);
  writeFileSync(join(bundle, 'Dockerfile'), [
    'FROM oven/bun:1-alpine',
    'COPY . .',
    'ENV PORT=3000',
    'EXPOSE 3000',
    'CMD bun server.js',
    '',
  ].join('\n'));
  writeFileSync(join(bundle, '.dockerignore'), [
    'node_modules',
    '.git',
    '*.log',
    '',
  ].join('\n'));
  writeFileSync(join(bundle, 'railway.json'), `${JSON.stringify({
    build: { builder: 'DOCKERFILE' },
  }, null, 2)}\n`);
}

console.log('Updating source submodules...');
run('git', ['submodule', 'update', '--init', '--remote', 'backend', 'frontend', 'cli']);
console.log('Installing frontend dependencies...');
run('npm', ['install'], frontend);
console.log('Building frontend...');
run('npx', ['ng', 'build'], frontend);
if (!existsSync(join(frontendOutput, 'index.html'))) {
  throw new Error(`Expected frontend build output at ${join(frontendOutput, 'index.html')}`);
}

console.log('Assembling bundle...');
writeGeneratedFiles();
run('git', ['add', '-A'], bundle);
if (hasStagedChanges(bundle)) {
  run('git', ['commit', '-m', 'Build generated bundle'], bundle);
  console.log('Committed bundle output.');
  if (push) {
    run('git', ['push', 'origin', 'HEAD:bundle'], bundle);
    console.log('Pushed bundle branch.');
  }
} else {
  console.log('Bundle unchanged; nothing to commit.');
  if (push) {
    run('git', ['push', 'origin', 'HEAD:bundle'], bundle);
    console.log('Pushed bundle branch.');
  }
}

run('git', ['add', 'bundle']);
if (hasStagedChanges(root)) {
  run('git', ['commit', '-m', 'Bump bundle submodule']);
  console.log('Committed bundle pointer bump.');
  if (push) {
    run('git', ['push', 'origin', 'HEAD:main']);
    console.log('Pushed main branch.');
  }
} else {
  console.log('Main unchanged; nothing to commit.');
  if (push) {
    run('git', ['push', 'origin', 'HEAD:main']);
    console.log('Pushed main branch.');
  }
}

if (!push) {
  console.log('Dry run complete. Re-run with --push to publish bundle and main.');
}
