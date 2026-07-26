import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Page } from "@playwright/test";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function timestamp() {
  return new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 17);
}

function safeName(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function captureEvidence(page: Page, name: string) {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const directory = path.join(repoRoot, "temp", day);
  await mkdir(directory, { recursive: true });
  const target = path.join(directory, `${timestamp()}-${safeName(name)}.png`);
  await page.screenshot({ fullPage: false, path: target });
  return target;
}
