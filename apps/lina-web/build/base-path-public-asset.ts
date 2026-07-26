import { existsSync, statSync } from "node:fs";
import path from "node:path";

import { publicAssetContentType } from "./public-asset-content-type";

export interface BasePathPublicAsset {
  contentType: string;
  filePath: string;
}

function normalizeBasePath(base: string): string {
  const candidate = base.trim();
  if (!candidate || candidate === "/") {
    return "/";
  }
  return `/${candidate.replace(/^\/+|\/+$/g, "")}/`;
}

export function resolveBasePathPublicAsset(
  base: string,
  publicDir: string,
  requestUrl: string,
): BasePathPublicAsset | undefined {
  const pathname = requestUrl.split("?", 2)[0] ?? "";
  const normalizedBase = normalizeBasePath(base);
  const requestPrefix = normalizedBase === "/" ? "/" : normalizedBase;
  if (!pathname.startsWith(requestPrefix)) {
    return undefined;
  }

  const relativePath = pathname.slice(requestPrefix.length);
  if (!relativePath) {
    return undefined;
  }

  const normalizedPublicDir = path.resolve(publicDir);
  const publicFile = path.resolve(normalizedPublicDir, relativePath);
  if (
    !publicFile.startsWith(`${normalizedPublicDir}${path.sep}`)
    || !existsSync(publicFile)
    || !statSync(publicFile).isFile()
  ) {
    return undefined;
  }

  return {
    contentType: publicAssetContentType(publicFile),
    filePath: publicFile,
  };
}
