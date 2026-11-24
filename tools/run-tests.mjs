import { spawn } from "node:child_process";
import { once } from "node:events";

// Own direct Node children so Windows can clean up without taskkill or a shell tree.
const preview = spawn(process.execPath, ["tools/serve.mjs", "--port", "0"], { stdio: ["ignore", "pipe", "inherit"], windowsHide: true });
let runner;
const stop = () => { runner?.kill(); preview.kill(); };
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
try {
  const url = await new Promise((resolve, reject) => {
    preview.once("error", reject);
    preview.once("exit", code => reject(new Error(`Preview exited before starting (${code}).`)));
    preview.stdout.on("data", chunk => {
      const match = chunk.toString().match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) resolve(match[0]);
    });
  });
  runner = spawn(process.execPath, ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)], {
    stdio: "inherit", windowsHide: true, env: { ...process.env, PORTFOLIO_TEST_URL: url },
  });
  const [code] = await once(runner, "exit");
  process.exitCode = code ?? 1;
} finally {
  if (preview.exitCode === null) { const stopped = once(preview, "exit"); preview.kill(); await stopped; }
}
