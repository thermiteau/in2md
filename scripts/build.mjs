import * as esbuild from "esbuild";
import { cpSync, mkdirSync, existsSync, readdirSync, readFileSync, writeFileSync, rmSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const srcDir = resolve(root, "src");
const buildRoot = resolve(root, "build");

const targetsArg = (process.env.TARGET || "firefox,chrome").split(",").map((s) => s.trim()).filter(Boolean);
const validTargets = new Set(["firefox", "chrome"]);
for (const t of targetsArg) {
  if (!validTargets.has(t)) {
    console.error(`Unknown target: ${t}. Valid: firefox, chrome`);
    process.exit(1);
  }
}

async function buildTarget(target) {
  const outDir = resolve(buildRoot, target);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  mkdirSync(resolve(outDir, "icons"), { recursive: true });

  await esbuild.build({
    entryPoints: [resolve(srcDir, "scraper/index.ts")],
    bundle: true,
    outfile: resolve(outDir, "scraper.js"),
    format: "iife",
    target: "es2020",
  });

  await esbuild.build({
    entryPoints: [resolve(srcDir, "extraction/index.ts")],
    bundle: true,
    outfile: resolve(outDir, "extract.js"),
    format: "iife",
    target: "es2020",
  });

  await esbuild.build({
    entryPoints: [resolve(srcDir, "background.ts")],
    bundle: true,
    outdir: outDir,
    format: "esm",
    target: "es2020",
  });

  await esbuild.build({
    entryPoints: [
      resolve(srcDir, "block-autorefresh.ts"),
      resolve(srcDir, "inject-autorefresh-blocker.ts"),
    ],
    bundle: true,
    outdir: outDir,
    format: "iife",
    target: "es2020",
  });

  await esbuild.build({
    entryPoints: [resolve(srcDir, "popup.ts")],
    bundle: true,
    outdir: outDir,
    format: "iife",
    target: "es2020",
  });

  // Merge base manifest with per-target overlay
  const base = JSON.parse(readFileSync(resolve(srcDir, "manifest.base.json"), "utf8"));
  const overlay = JSON.parse(readFileSync(resolve(srcDir, `manifest.${target}.json`), "utf8"));
  const manifest = { ...base, ...overlay };
  writeFileSync(resolve(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  cpSync(resolve(srcDir, "popup.html"), resolve(outDir, "popup.html"));

  const iconsDir = resolve(srcDir, "icons");
  if (existsSync(iconsDir)) {
    for (const file of readdirSync(iconsDir)) {
      cpSync(resolve(iconsDir, file), resolve(outDir, "icons", file));
    }
  }

  for (const svg of ["in2md.svg", "in2md-active.svg"]) {
    if (existsSync(resolve(srcDir, svg))) {
      cpSync(resolve(srcDir, svg), resolve(outDir, svg));
    }
  }

  console.log(`Build complete → build/${target}/`);
}

mkdirSync(buildRoot, { recursive: true });
for (const target of targetsArg) {
  await buildTarget(target);
}
