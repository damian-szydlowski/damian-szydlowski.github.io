import sharp from "sharp";
import { mkdir, readdir, writeFile, stat } from "node:fs/promises";
import { resolve, relative, extname, basename, join, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const flag = (name, fallback) => { const index = args.indexOf(name); return index < 0 ? fallback : args[index + 1]; };
const input = resolve(root, flag("--input", "assets/originals"));
const output = resolve(root, flag("--output", "assets/images"));
const outputRelative = relative(root, output);
if (outputRelative.startsWith("..") || output === root || output === input || relative(input, output).startsWith(`..${sep}`) === false) {
  throw new Error("Choose a separate output directory inside this project and outside the originals folder.");
}
const size = await stat(input).catch(() => null);
if (!size?.isDirectory()) {
  console.error("Add your JPG, PNG, or WebP originals to assets/originals first, or use --input <folder>.");
  process.exitCode = 1;
} else {
  await mkdir(output, { recursive: true });
  const files = (await readdir(input)).filter(name => /\.(jpe?g|png|webp|tiff?|avif)$/i.test(name)).sort();
  const names = new Set();
  const manifest = [];
  for (const file of files) {
    const slug = basename(file, extname(file)).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug || names.has(slug)) throw new Error(`Give each original a unique simple filename. Duplicate or invalid name: ${file}`);
    names.add(slug);
    const source = join(input, file);
    const metadata = await sharp(source).metadata();
    const rotated = [5, 6, 7, 8].includes(metadata.orientation);
    const width = rotated ? metadata.height : metadata.width;
    const height = rotated ? metadata.width : metadata.height;
    const widths = [...new Set([480, 960, 1600, 2400].map(value => Math.min(value, width)))];
    const variants = [];
    for (const target of widths) {
      const filename = `${slug}-${target}.webp`;
      // Auto-orient first; Sharp's default output strips private EXIF metadata.
      await sharp(source).rotate().resize({ width: target, withoutEnlargement: true }).webp({ quality: 85, effort: 5 }).toFile(join(output, filename));
      variants.push({ src: relative(root, join(output, filename)).split(sep).join("/"), width: target });
    }
    const preferred = variants.find(variant => variant.width >= 960) || variants.at(-1);
    manifest.push({ src: preferred.src, width, height, alt: "Describe this image before adding it to the gallery.", variants });
    console.log(`${file} → ${variants.length} web-sized copies`);
  }
  await writeFile(join(output, "image-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Prepared ${manifest.length} images. Copy image records from ${relative(root, join(output, "image-manifest.json"))} into scripts/content.js.`);
}
