import * as esbuild from "esbuild";
import { cpSync, mkdirSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const srcDir = resolve(root, "src");
const buildDir = resolve(root, "build");

mkdirSync(buildDir, { recursive: true });
mkdirSync(resolve(buildDir, "icons"), { recursive: true });

// Bundle content scripts
await esbuild.build({
  entryPoints: [resolve(srcDir, "scraper/index.ts")],
  bundle: true,
  outfile: resolve(buildDir, "scraper.js"),
  format: "iife",
  target: "es2020",
  minify: false,
  sourcemap: false,
});

await esbuild.build({
  entryPoints: [resolve(srcDir, "extraction/index.ts")],
  bundle: true,
  outfile: resolve(buildDir, "extract.js"),
  format: "iife",
  target: "es2020",
  minify: false,
  sourcemap: false,
});

// Bundle background script (ES module for MV3)
await esbuild.build({
  entryPoints: [resolve(srcDir, "background.ts")],
  bundle: true,
  outdir: buildDir,
  format: "esm",
  target: "es2020",
  minify: false,
  sourcemap: false,
});

// Bundle autorefresh blocker (injected into page world)
await esbuild.build({
  entryPoints: [
    resolve(srcDir, "block-autorefresh.ts"),
    resolve(srcDir, "inject-autorefresh-blocker.ts"),
  ],
  bundle: true,
  outdir: buildDir,
  format: "iife",
  target: "es2020",
  minify: false,
  sourcemap: false,
});

// Bundle popup script
await esbuild.build({
  entryPoints: [resolve(srcDir, "popup.ts")],
  bundle: true,
  outdir: buildDir,
  format: "iife",
  target: "es2020",
  minify: false,
  sourcemap: false,
});

// Copy static assets
cpSync(resolve(srcDir, "manifest.json"), resolve(buildDir, "manifest.json"));
cpSync(resolve(srcDir, "popup.html"), resolve(buildDir, "popup.html"));

// Copy icons
const iconsDir = resolve(srcDir, "icons");
if (existsSync(iconsDir)) {
  for (const file of readdirSync(iconsDir)) {
    cpSync(resolve(iconsDir, file), resolve(buildDir, "icons", file));
  }
}

// Copy SVG icons (toolbar)
for (const svg of ["in2md.svg", "in2md-active.svg"]) {
  if (existsSync(resolve(srcDir, svg))) {
    cpSync(resolve(srcDir, svg), resolve(buildDir, svg));
  }
}

console.log("Build complete → build/");
