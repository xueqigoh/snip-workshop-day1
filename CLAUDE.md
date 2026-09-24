# Snip Repository Rules

Keep this file and its counterpart instruction file identical and update both together.

Snip is a Git superproject with one branch and submodule per layer: `backend`, `frontend`, `cli`, and generated `bundle`. `main` pins exact commits from those branches.

## Layout

| Path | Branch | Stack |
| --- | --- | --- |
| `backend/` | `backend` | Bun 1.x, zero dependencies, in-memory `Map` |
| `frontend/` | `frontend` | Angular 19 standalone, signals, HttpClient |
| `cli/` | `cli` | Node 18+, CommonJS, global `fetch` |
| `bundle/` | `bundle` | Generated Bun release, built UI, CLI, Docker |
| `scripts/build-bundle.mjs` | `main` | Node ESM, zero dependencies |

## API Contract

Served on port 3000. Change the contract everywhere or nowhere.

| Method | Path | Response |
| --- | --- | --- |
| POST | `/api/links` with `{ "url": "https://..." }` | `201 { code, url, shortUrl, hits, createdAt }`, or `400` |
| GET | `/api/links` | `200` array of links |
| GET | `/:code` | `302` redirect with incremented hits, or `404` |

## Commands

```sh
git submodule update --init --recursive
cd backend && bun start
cd frontend && npm install && npx ng serve
cd cli && node cli.js ls
cd bundle && bun start
node scripts/build-bundle.mjs [--push]
```

## Workflow

Edit inside a submodule, commit and push its branch, then from `main` run `git submodule update --remote <path>`, `git add <path>`, commit the pointer bump, and push. Use `node scripts/build-bundle.mjs --push` to publish generated bundle output and its pointer.

## Do / Don't

- Do treat `bundle/` as generated output; never hand-edit its generated files.
- Do keep the Angular build output at `frontend/dist/snip-frontend/browser/index.html`.
- Do keep storage in memory; resets on restart are intentional.
- Do keep `cli.js` CommonJS; never add `"type": "module"` near it.
- Do preserve bundle CI as schedule/dispatch-only; it intentionally has no `push` trigger.
- Do preserve Docker CI's `paths: [bundle, .github/workflows/docker.yml]`: `bundle` is the submodule gitlink, not a file tree.
- Don't commit secrets or add unnecessary dependencies to the backend or CLI.
