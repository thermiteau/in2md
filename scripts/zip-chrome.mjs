import { execFileSync } from "child_process";
import { mkdirSync, readFileSync, existsSync, rmSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = resolve(root, "build/chrome");
const distDir = resolve(root, "dist");

if (!existsSync(src)) {
  console.error("build/chrome does not exist — run the Chrome build first.");
  process.exit(1);
}

mkdirSync(distDir, { recursive: true });

const { version } = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const outFile = resolve(distDir, `in2md-${version}-chrome.zip`);
rmSync(outFile, { force: true });

execFileSync("zip", ["-r", "-q", outFile, "."], { cwd: src, stdio: "inherit" });
console.log(`Chrome package → dist/in2md-${version}-chrome.zip`);
