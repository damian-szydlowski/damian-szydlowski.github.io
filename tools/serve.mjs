import { createServer } from "node:http";
import { watch } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { resolve, relative, extname, sep } from "node:path";
import { spawn } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const portIndex = process.argv.indexOf("--port");
const hostIndex = process.argv.indexOf("--host");
const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : 4173);
const host = hostIndex >= 0 ? process.argv[hostIndex + 1] : "127.0.0.1";
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2", ".glb": "model/gltf-binary", ".pdf": "application/pdf", ".mp4": "video/mp4", ".webm": "video/webm" };
const liveClients = new Set();
let reloadTimer;
let rebuildTimer;
let builder;
let rebuildQueued = false;
const reload = () => { for (const client of liveClients) client.write("data: reload\n\n"); };
const rebuildTimeline = () => {
  if (builder) { rebuildQueued = true; return; }
  builder = spawn(process.execPath, ["tools/build-timeline.mjs"], { cwd: root, stdio: "inherit", windowsHide: true });
  builder.once("exit", code => {
    builder = undefined;
    if (code === 0) reload();
    else console.error("Timeline build failed. Fix the source error and save again.");
    if (rebuildQueued) { rebuildQueued = false; rebuildTimeline(); }
  });
};
const ignored = new Set([".git", ".cache", "node_modules", "originals", "tests", "test-results", "playwright-report", "tools"]);

// A small server-sent-event connection reloads open preview tabs when source files change.
const watcher = watch(root, { recursive: true }, (_event, filename) => {
  const path = filename?.toString().replaceAll("\\", "/");
  if (!path || path.split("/").some(part => ignored.has(part) || part.startsWith("."))) return;
  if (/^(components\/.*\.tsx|lib\/.*\.ts|styles\/timeline-input\.css)$/.test(path)) {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(rebuildTimeline, 120);
    return;
  }
  if (builder && /^(assets\/vendor\/timeline\.js|styles\/timeline\.css)/.test(path)) return;
  if (!/\.(html|css|js|mjs|json|svg|webp|jpe?g|png|woff2|glb|pdf|mp4|webm)$/i.test(path)) return;
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(reload, 180);
});

const server = createServer(async (request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405).end(); return; }
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/__live") {
    response.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no" });
    response.write("retry: 1000\n\n");
    liveClients.add(response);
    request.on("close", () => liveClients.delete(response));
    return;
  }
  try {
    const decodedPath = decodeURIComponent(pathname);
    const file = resolve(root, `.${decodedPath === "/" ? "/index.html" : decodedPath}`);
    const local = relative(root, file);
    const parts = local.split(sep);
    if (local.startsWith("..") || parts.some(part => part.startsWith(".") || ["node_modules", "originals", "tests", "tools"].includes(part))) {
      response.writeHead(403).end("Not available"); return;
    }
    const info = await stat(file);
    if (!info.isFile()) throw new Error("Not a file");
    let content = await readFile(file);
    if (extname(file).toLowerCase() === ".html") {
      const html = content.toString("utf8");
      const client = '<script>new EventSource("/__live").onmessage=event=>{if(event.data==="reload")location.reload()}</script>';
      content = Buffer.from(html.includes("</body>") ? html.replace("</body>", `${client}</body>`) : `${html}${client}`);
    }
    response.writeHead(200, { "Content-Type": types[extname(file).toLowerCase()] || "application/octet-stream", "Content-Length": content.length, "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
  }
});
server.on("close", () => {
  clearTimeout(reloadTimer);
  clearTimeout(rebuildTimer);
  builder?.kill();
  watcher.close();
  for (const client of liveClients) client.end();
});
server.on("error", error => { console.error(`Preview could not start: ${error.message}`); process.exitCode = 1; });
server.listen(port, host, () => {
  console.log(`Local preview: http://${host}:${server.address().port}`);
  console.log("Save HTML, CSS, JS, images, or content to reload connected preview tabs automatically.");
  console.log("Press Ctrl+C to stop. This server is for local development only.");
});
