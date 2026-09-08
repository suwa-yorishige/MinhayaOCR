import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const directJs = resolve(root, "direct-app.js");
const directCss = resolve(root, "direct-app.css");

await build({
  entryPoints: [resolve(root, "src/main.js")],
  bundle: true,
  format: "iife",
  platform: "browser",
  outfile: directJs,
  assetNames: "assets/[name]-[hash]",
  loader: { ".css": "css" },
  outbase: resolve(root, "src"),
  minify: false,
});
await copyFile(resolve(root, "src/style.css"), directCss);

await new Promise((resolvePromise, reject) => {
  const child = spawn(process.execPath, [resolve(root, "node_modules/vite/bin/vite.js"), "build"], { cwd: root, stdio: "inherit" });
  child.on("error", reject);
  child.on("exit", (code) => code === 0 ? resolvePromise() : reject(new Error(`vite build failed: ${code}`)));
});

await mkdir(resolve(root, "dist"), { recursive: true });
await copyFile(directJs, resolve(root, "dist/direct-app.js"));
await copyFile(directCss, resolve(root, "dist/direct-app.css"));
