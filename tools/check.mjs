import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { projects, photos, projectContexts } from "../scripts/content.js";

const root = resolve(import.meta.dirname, "..");
let placeholders = 0;
async function asset(path) {
  assert(!/^(https?:|data:)/.test(path), `Expected a locally hosted asset: ${path}`);
  const info = await stat(resolve(root, path));
  assert(info.isFile() && info.size > 0, `Missing or empty asset: ${path}`);
}
async function checkImage(record) {
  assert(record && record.width > 0 && record.height > 0, "Images need positive width and height");
  assert(typeof record.alt === "string", "Images need an alt description");
  await asset(record.src);
  for (const variant of record.variants || []) {
    assert(variant.width > 0, "Image variants need a width");
    await asset(variant.src);
  }
}
const ids = new Set();
for (const record of [...projects, ...photos]) {
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id), `Use a simple lowercase ID: ${record.id}`);
  assert(!ids.has(record.id), `Duplicate ID: ${record.id}`);
  ids.add(record.id);
  if (record.placeholder) placeholders++;
}
for (const project of projects) {
  assert(projectContexts[project.context], `Unknown project context: ${project.context}`);
  await checkImage(project.cover);
  for (const record of project.images || []) await checkImage(record);
  for (const link of project.links || []) assert(/^https?:\/\//.test(link.href), `Use an absolute HTTP(S) project link: ${link.href}`);
  if (project.model) {
    assert(project.model.src.endsWith(".glb"), "Export CAD as a GLB for the website");
    await asset(project.model.src);
    if (project.model.poster) await checkImage(project.model.poster);
  }
}
for (const photo of photos) {
  assert(photo.categories.length > 0, `Photo needs a category: ${photo.id}`);
  await checkImage(photo.image);
}
for (const page of ["index.html", "photography.html"]) {
  const html = await readFile(resolve(root, page), "utf8");
  assert(html.includes('name="viewport"'), `${page} needs a viewport declaration`);
  assert(!/your-email|your-linkedin|example\.com/.test(html), `${page} contains a fake contact link`);
  const pageIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(pageIds.length, new Set(pageIds).size, `${page} contains duplicate IDs`);
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, "");
  for (const match of withoutComments.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    const value = match[1];
    if (/^(https?:|mailto:|#)/.test(value)) continue;
    await asset(value.split("#")[0]);
  }
}
await asset("assets/vendor/model-viewer.min.js");
await asset("assets/vendor/lenis.js");
await asset("assets/vendor/lenis-LICENSE.txt");
for (const path of ["scripts/assembly-video.js", "scripts/main.js", "scripts/smooth-scroll.js", "scripts/content.js", "tools/serve.mjs", "tools/prepare-images.mjs", "tools/copy-vendor.mjs"]) {
  const result = spawnSync(process.execPath, ["--check", resolve(root, path)], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
}
console.log(`Checks passed: 2 pages, ${projects.length} projects, ${photos.length} gallery entries, local assets and JavaScript syntax.`);
console.log(`Content remaining: ${placeholders} explicitly labelled placeholder entries, plus biography, portrait, education, equipment and resume details.`);
