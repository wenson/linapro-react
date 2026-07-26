import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { resolveBasePathPublicAsset } from "./base-path-public-asset";
import { publicAssetContentType } from "./public-asset-content-type";

const publicDir = path.resolve("public");

describe("base-path public asset content types", () => {
  it.each([
    ["apidocs.html", "text/html; charset=utf-8"],
    ["styles.min.css", "text/css; charset=utf-8"],
    ["web-components.min.js", "text/javascript; charset=utf-8"],
    ["api.json", "application/json; charset=utf-8"],
  ])("serves %s with %s", (filePath, expected) => {
    expect(publicAssetContentType(filePath)).toBe(expected);
  });

  it("keeps unknown files binary", () => {
    expect(publicAssetContentType("archive.bin")).toBe("application/octet-stream");
  });

  it("recognizes public asset types from Windows paths", () => {
    expect(
      publicAssetContentType("C:\\linapro\\public\\stoplight\\apidocs.html"),
    ).toBe("text/html; charset=utf-8");
    expect(
      publicAssetContentType("C:\\linapro\\public\\stoplight\\web-components.min.js"),
    ).toBe("text/javascript; charset=utf-8");
  });

  it.each([
    ["/", "/stoplight/"],
    ["/console/", "/console/stoplight/"],
  ])("loads API Docs assets and body under base %s", (base, requestPrefix) => {
    const html = resolveBasePathPublicAsset(
      base,
      publicDir,
      `${requestPrefix}apidocs.html?api=%2Fapi.json&lang=en-US`,
    );
    const css = resolveBasePathPublicAsset(
      base,
      publicDir,
      `${requestPrefix}styles.min.css`,
    );
    const script = resolveBasePathPublicAsset(
      base,
      publicDir,
      `${requestPrefix}web-components.min.js`,
    );

    expect(html?.contentType).toBe("text/html; charset=utf-8");
    expect(css?.contentType).toBe("text/css; charset=utf-8");
    expect(script?.contentType).toBe("text/javascript; charset=utf-8");

    const htmlBody = readFileSync(html?.filePath ?? "", "utf8");
    expect(htmlBody).toContain('href="./styles.min.css"');
    expect(htmlBody).toContain('src="./web-components.min.js"');
    expect(htmlBody).toContain("document.createElement('elements-api')");
    expect(readFileSync(css?.filePath ?? "", "utf8").length).toBeGreaterThan(1_000);
    expect(readFileSync(script?.filePath ?? "", "utf8").length).toBeGreaterThan(100_000);
  });

  it("rejects requests outside the configured base and public directory", () => {
    expect(
      resolveBasePathPublicAsset(
        "/console/",
        publicDir,
        "/other/stoplight/apidocs.html",
      ),
    ).toBeUndefined();
    expect(
      resolveBasePathPublicAsset(
        "/console/",
        publicDir,
        "/console/../package.json",
      ),
    ).toBeUndefined();
    expect(
      resolveBasePathPublicAsset(
        "/",
        publicDir,
        "/stoplight/missing-script.js",
      ),
    ).toBeUndefined();
  });
});
