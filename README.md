# Snip CLI

A zero-dependency CommonJS CLI for the Snip URL shortener backend. Node 18 or newer is required for the built-in `fetch` API.

```sh
node cli.js add https://example.com
node cli.js ls
node cli.js open ABC123
```

Set `SNIP_API` to use a backend other than `http://localhost:3000`. The `snip`, `snip.cmd`, and `snip.ps1` wrappers forward their arguments to `cli.js`.
