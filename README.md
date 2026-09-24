# Snip

Snip is a tiny URL shortener built as one backend with two clients: an Angular web UI and a Node CLI. The `main` branch is the superproject; each layer is an independent branch of this repository mounted as a Git submodule.

## Layout

```text
main
├── backend/   Bun API, branch: backend
├── frontend/  Angular 19 UI, branch: frontend
└── cli/       Node CommonJS CLI, branch: cli
```

The backend stores links in an in-memory `Map`, so data resets when the server restarts.

## API

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| POST | `/api/links` | `{ "url": "https://..." }` | `201 { code, url, shortUrl, hits, createdAt }`, or `400` |
| GET | `/api/links` | None | `200` array of links |
| GET | `/:code` | None | `302` redirect and incremented hit count, or `404` |

## Clone

Submodules are separate repositories mounted into this checkout. Always clone recursively:

```sh
git clone --recurse-submodules https://github.com/xueqigoh/snip-workshop-day1.git
```

A plain clone leaves the submodule folders empty. Populate them afterward with:

```sh
git submodule update --init --recursive
```

## Run

Use three terminals from a populated `main` checkout:

```sh
cd backend && bun start
cd frontend && npm install && npx ng serve
cd cli && node cli.js ls
```

The API runs at `http://localhost:3000`, the Angular UI at `http://localhost:4200`, and the CLI uses `http://localhost:3000` by default. Set `SNIP_API` to use another backend URL.

## Update Workflow

1. Edit and test inside the relevant submodule folder.
2. Commit and push the change from inside that submodule. This advances its branch.
3. From the superproject, update the pinned gitlink:

   ```sh
   git submodule update --remote backend
   git add backend
   git commit -m "Bump backend submodule"
   git push
   ```

Replace `backend` with `frontend` or `cli` as needed. The submodule commit and the superproject pointer commit are separate records; both are required to publish an update through `main`.
