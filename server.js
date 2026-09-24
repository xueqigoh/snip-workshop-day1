import { join, relative, resolve } from "node:path";

const links = new Map();
const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const port = Number.parseInt(process.env.PORT || "3000", 10);
const configuredBaseUrl = process.env.BASE_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : `http://localhost:${port}`);
const baseUrl = configuredBaseUrl.replace(/\/+$/, "");
const publicDirectory = process.env.PUBLIC_DIR ? resolve(process.env.PUBLIC_DIR) : null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

function createCode() {
  const values = new Uint32Array(6);
  let code = "";

  do {
    crypto.getRandomValues(values);
    code = Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
  } while (links.has(code));

  return code;
}

async function servePublicFile(pathname, method) {
  if (!publicDirectory || (method !== "GET" && method !== "HEAD")) {
    return null;
  }

  let relativePath;
  try {
    relativePath = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
  } catch {
    return null;
  }

  const filePath = resolve(publicDirectory, `.${relativePath}`);
  const relativePathFromRoot = relative(publicDirectory, filePath);
  if (relativePathFromRoot.startsWith("..") || relativePathFromRoot.includes(".." + "/")) {
    return null;
  }

  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    return null;
  }

  return new Response(method === "HEAD" ? null : file, { headers: corsHeaders });
}

const server = Bun.serve({
  port,
  async fetch(request) {
    const requestUrl = new URL(request.url);
    const { pathname } = requestUrl;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method === "POST" && pathname === "/api/links") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      let url;
      try {
        url = new URL(body?.url);
      } catch {
        return json({ error: "URL must use http or https" }, 400);
      }

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return json({ error: "URL must use http or https" }, 400);
      }

      const code = createCode();
      const link = {
        code,
        url: url.toString(),
        shortUrl: `${baseUrl}/${code}`,
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      links.set(code, link);
      return json(link, 201);
    }

    if (request.method === "GET" && pathname === "/api/links") {
      return json(Array.from(links.values()));
    }

    const publicFile = await servePublicFile(pathname, request.method);
    if (publicFile) {
      return publicFile;
    }

    if (request.method === "GET" && /^\/[A-Za-z0-9]{6}$/.test(pathname)) {
      const code = pathname.slice(1);
      const link = links.get(code);
      if (!link) {
        return json({ error: "Link not found" }, 404);
      }

      link.hits += 1;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: link.url,
        },
      });
    }

    return json({ error: "Not found" }, 404);
  },
});

console.log(`Snip backend listening on ${server.url}`);
