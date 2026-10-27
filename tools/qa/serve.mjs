/**
 * Tiny static server that mimics Firebase Hosting (cleanUrls + rewrites) for local QA.
 *   node serve.mjs <dir> <port> [rewritesJson]
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const [dir, port = "4100", rewritesArg = "[]"] = process.argv.slice(2);
const rewrites = JSON.parse(rewritesArg);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".json": "application/json", ".woff2": "font/woff2", ".txt": "text/plain" };

async function tryFile(p) {
  try {
    const s = await stat(p);
    return s.isFile() ? p : null;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  let path = decodeURIComponent(url.pathname);
  for (const r of rewrites) if (new RegExp(r.source).test(path)) path = r.destination;
  const base = normalize(join(dir, path));
  const file = (await tryFile(base)) ?? (await tryFile(`${base}.html`)) ?? (await tryFile(join(base, "index.html"))) ?? (await tryFile(join(dir, "404.html")));
  if (!file) {
    res.writeHead(404).end("Not found");
    return;
  }
  res.writeHead(file.endsWith("404.html") && !base.endsWith("404.html") ? 404 : 200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(await readFile(file));
}).listen(Number(port), () => console.log(`serving ${dir} on http://localhost:${port}`));
