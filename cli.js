#!/usr/bin/env node

const { spawn } = require('node:child_process');

const apiBase = (process.env.SNIP_API || 'http://localhost:3000').replace(/\/+$/, '');
const usage = `Usage:
  snip add <url>    Shorten a URL
  snip ls           List shortened URLs
  snip open <code>  Open a shortened URL in the browser
  snip help         Show this help`;

function fail(message) {
  throw new Error(message);
}

async function readResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${apiBase}${path}`, options);
  } catch {
    fail(`Could not reach the backend at ${apiBase}`);
  }

  const body = await readResponse(response);
  if (!response.ok) {
    fail(typeof body === 'object' && body?.error ? body.error : `Backend returned HTTP ${response.status}`);
  }

  return { body, response };
}

async function add(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    fail('Please provide a valid http:// or https:// URL.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    fail('Please provide a valid http:// or https:// URL.');
  }

  const { body } = await request('/api/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  console.log(body.shortUrl);
}

async function list() {
  const { body: links } = await request('/api/links');
  if (!links.length) {
    console.log('No links yet.');
    return;
  }

  const rows = links.map((link) => [link.code, String(link.hits), link.url]);
  const widths = rows[0].map((_, index) => Math.max(...rows.map((row) => row[index].length), ['CODE', 'HITS', 'URL'][index].length));
  console.log(['CODE', 'HITS', 'URL'].map((value, index) => value.padEnd(widths[index])).join('  '));
  console.log(widths.map((width) => '-'.repeat(width)).join('  '));
  for (const row of rows) {
    console.log(row.map((value, index) => value.padEnd(widths[index])).join('  '));
  }
}

function openBrowser(target) {
  if (process.platform === 'win32') {
    spawn('cmd.exe', ['/c', 'start', '', target], { detached: true, stdio: 'ignore' }).unref();
  } else {
    const command = process.platform === 'darwin' ? 'open' : 'xdg-open';
    spawn(command, [target], { detached: true, stdio: 'ignore' }).unref();
  }
}

async function open(code) {
  if (!/^[A-Za-z0-9]{6}$/.test(code)) {
    fail('Please provide a six-character short code.');
  }

  const { response } = await request(`/${encodeURIComponent(code)}`, { redirect: 'manual' });
  const target = response.headers.get('location');
  if (!target) {
    fail('The backend returned no redirect target.');
  }

  openBrowser(target);
  console.log(`Opened ${target}`);
}

async function main() {
  const [command, value] = process.argv.slice(2);
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log(usage);
    return;
  }

  if (command === 'add') {
    if (!value) fail('Usage: snip add <url>');
    await add(value);
    return;
  }

  if (command === 'ls') {
    await list();
    return;
  }

  if (command === 'open') {
    if (!value) fail('Usage: snip open <code>');
    await open(value);
    return;
  }

  fail(`Unknown command: ${command}\n\n${usage}`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
