import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tscEntry = path.join(appRoot, "node_modules", "typescript", "bin", "tsc");
const eslintEntry = path.join(appRoot, "node_modules", "eslint", "bin", "eslint.js");

const typeScriptFiles = spawnSync(
  process.execPath,
  [tscEntry, "--listFilesOnly", "-p", "tsconfig.tapcanvas-studio.json"],
  { cwd: appRoot, encoding: "utf8" },
);

if (typeScriptFiles.status !== 0) {
  process.stderr.write(typeScriptFiles.stderr || typeScriptFiles.stdout);
  process.exit(typeScriptFiles.status ?? 1);
}

const sourceFiles = typeScriptFiles.stdout
  .split(/\r?\n/u)
  .filter((file) => /linapro-tapcanvas-studio[/\\]frontend[/\\].*\.tsx?$/u.test(file))
  .filter((file) => !file.endsWith(".d.ts"));

const lint = spawnSync(process.execPath, [eslintEntry, ...sourceFiles], {
  cwd: appRoot,
  encoding: "utf8",
  stdio: "inherit",
});

process.exit(lint.status ?? 1);
