// Static server for the demo and the tests, with a strict Content-Security-Policy (no inline scripts or styles).
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.env.PORT) || 8794;
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json'};
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'";

createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  let file = decodeURIComponent(url.pathname);
  if (file.endsWith('/')) file += 'index.html';
  const full = path.join(root, path.normalize(file));
  if (!full.startsWith(root) || full.includes(`${path.sep}node_modules${path.sep}`)) { response.writeHead(403).end(); return; }
  try {
    const body = await readFile(full);
    response.writeHead(200, {'Content-Type': TYPES[path.extname(full)] || 'application/octet-stream', 'Content-Security-Policy': CSP, 'Cache-Control': 'no-store'});
    response.end(body);
  } catch {
    response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'}).end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Meliora WhatsApp demo: http://127.0.0.1:${port}/`));
