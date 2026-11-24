import { copyFile, mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(import.meta.dirname, "..");
const copies = [
  ["node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2", "assets/fonts/geist-latin-wght-normal.woff2"],
  ["node_modules/@fontsource-variable/geist/LICENSE", "assets/fonts/Geist-OFL.txt"],
  ["node_modules/@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2", "assets/fonts/hanken-grotesk-latin-wght-normal.woff2"],
  ["node_modules/@fontsource-variable/hanken-grotesk/LICENSE", "assets/fonts/Hanken-Grotesk-OFL.txt"],
  ["node_modules/@google/model-viewer/dist/model-viewer.min.js", "assets/vendor/model-viewer.min.js"],
  ["node_modules/@google/model-viewer/LICENSE", "assets/vendor/model-viewer-LICENSE.txt"],
  ["node_modules/gsap/README.md", "assets/vendor/gsap-README.txt"],
  ["node_modules/lenis/LICENSE", "assets/vendor/lenis-LICENSE.txt"],
  ["node_modules/lenis/dist/lenis.css", "assets/vendor/lenis.css"],
];
for (const [source, destination] of copies) {
  const fullDestination = resolve(root, destination);
  await mkdir(resolve(fullDestination, ".."), { recursive: true });
  await copyFile(resolve(root, source), fullDestination);
}
const pkg = JSON.parse(await readFile(resolve(root, "node_modules/@google/model-viewer/package.json"), "utf8"));
const gsap = JSON.parse(await readFile(resolve(root, "node_modules/gsap/package.json"), "utf8"));
await build({ entryPoints: [resolve(root, "node_modules/lenis/dist/lenis.mjs")], outfile: resolve(root, "assets/vendor/lenis.js"), bundle: true, format: "esm", minify: true, target: "es2020" });
console.log(`Copied fonts, model-viewer ${pkg.version}, Lenis and GSAP ${gsap.version} notices. Run npm run build to bundle the React timeline.`);
