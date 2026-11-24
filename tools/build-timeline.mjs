import { build } from "esbuild";
import { spawn } from "node:child_process";
import { once } from "node:events";

await build({
  entryPoints: ["components/timeline-entry.tsx"],
  outfile: "assets/vendor/timeline.js",
  bundle: true,
  format: "esm",
  target: ["es2020"],
  minify: true,
  legalComments: "linked",
  define: { "process.env.NODE_ENV": '"production"' },
});
const css = spawn(process.execPath, ["node_modules/@tailwindcss/cli/dist/index.mjs", "-i", "styles/timeline-input.css", "-o", "styles/timeline.css", "--minify"], { stdio: "inherit", windowsHide: true });
const [code] = await once(css, "exit");
if (code !== 0) process.exit(code ?? 1);
console.log("Built the React timeline and its Tailwind styles.");
