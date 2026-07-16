import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import {
  discoverPluginUIManifests,
  generatePluginUIVirtualModule,
  isPluginUIManifestPath,
  scanPluginUIImportBoundaries,
} from "./plugin-ui-registry";

const temporaryRoots: string[] = [];

async function fixtureRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "linapro-plugin-ui-"));
  temporaryRoots.push(root);
  return root;
}

async function writeFile(file: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, "utf8");
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => fs.rm(root, { force: true, recursive: true })));
});

describe("Vite source-plugin UI discovery", () => {
  it("discovers only direct frontend/plugin-ui.ts manifests in plugin ID order", async () => {
    const root = await fixtureRoot();
    await writeFile(path.join(root, "zeta-source-plugin", "frontend", "plugin-ui.ts"), "export default {};\n");
    await writeFile(path.join(root, "alpha-source-plugin", "frontend", "plugin-ui.ts"), "export default {};\n");
    await writeFile(path.join(root, "alpha-source-plugin", "frontend", "pages", "ignored.tsx"), "export default 1;\n");
    await writeFile(path.join(root, "nested", "child", "frontend", "plugin-ui.ts"), "export default {};\n");

    const manifests = await discoverPluginUIManifests(root);
    expect(manifests.map((item) => item.pluginId)).toEqual([
      "alpha-source-plugin",
      "zeta-source-plugin",
    ]);
  });

  it("generates manifest-only imports without eagerly importing page chunks or backend paths", async () => {
    const root = await fixtureRoot();
    await writeFile(
      path.join(root, "acme-demo-source", "frontend", "plugin-ui.ts"),
      [
        'import { definePluginUI } from "@linapro/plugin-ui";',
        "export default definePluginUI({",
        '  pages: { "/demo": { capabilities: [], load: () => import("./pages/demo-page"), surface: "page" } },',
        "  slots: {},",
        "});",
      ].join("\n"),
    );
    await writeFile(
      path.join(root, "acme-demo-source", "frontend", "pages", "demo-page.tsx"),
      'import React from "react"; export default function Demo() { return <div>Demo</div>; }\n',
    );

    const source = await generatePluginUIVirtualModule(root);
    expect(source).toContain("frontend/plugin-ui.ts");
    expect(source).not.toContain("frontend/pages/demo-page.tsx");
    expect(source).not.toContain("apps/lina-core");
    expect(source).toContain('pluginId: "acme-demo-source"');
  });

  it("rejects directory escape, non-React lazy modules, bare dependencies, and plugin ID overrides", async () => {
    const cases = [
      {
        expected: /directory escape/i,
        manifest: 'import("../../outside.tsx"); export default { pages: {}, slots: {} };',
        prepare: async (root: string) => writeFile(path.join(root, "outside.tsx"), "export default 1;"),
      },
      {
        expected: /React \.tsx or \.jsx/i,
        manifest: 'import("./pages/not-react.ts"); export default { pages: {}, slots: {} };',
        prepare: async (root: string) => writeFile(path.join(root, "acme-demo-source", "frontend", "pages", "not-react.ts"), "export default 1;"),
      },
      {
        expected: /may only import @linapro\/plugin-ui/i,
        manifest: 'import React from "react"; export default { pages: {}, slots: {} };',
      },
      {
        expected: /directory-owned plugin ID/i,
        manifest: 'export default { pluginId: "override", pages: {}, slots: {} };',
      },
      {
        expected: /cannot eagerly import frontend modules/i,
        manifest: 'import Page from "./pages/page"; export default { pages: {}, slots: {} };',
        prepare: async (root: string) => writeFile(path.join(root, "acme-demo-source", "frontend", "pages", "page.tsx"), "export default 1;"),
      },
      {
        expected: /literal dynamic imports/i,
        manifest: 'const page = "./pages/page"; import(page); export default { pages: {}, slots: {} };',
      },
    ];
    for (const testCase of cases) {
      const root = await fixtureRoot();
      await testCase.prepare?.(root);
      await writeFile(
        path.join(root, "acme-demo-source", "frontend", "plugin-ui.ts"),
        testCase.manifest,
      );
      await expect(generatePluginUIVirtualModule(root)).rejects.toThrow(testCase.expected);
    }
  });

  it("recognizes direct manifests for add, unlink, and HMR invalidation", async () => {
    const root = await fixtureRoot();
    expect(isPluginUIManifestPath(path.join(root, "acme-demo-source", "frontend", "plugin-ui.ts"), root)).toBe(true);
    expect(isPluginUIManifestPath(path.join(root, "acme-demo-source", "frontend", "pages", "index.tsx"), root)).toBe(false);
    expect(isPluginUIManifestPath(path.join(root, "nested", "acme", "frontend", "plugin-ui.ts"), root)).toBe(false);
  });

  it("scans each manifest's reachable React graph and rejects host-private imports", async () => {
    const root = await fixtureRoot();
    await writeFile(
      path.join(root, "acme-demo-source", "frontend", "plugin-ui.ts"),
      [
        'import { definePluginUI } from "@linapro/plugin-ui";',
        'export default definePluginUI({ pages: { "/demo": { capabilities: [], load: () => import("./pages/demo"), surface: "page" } }, slots: {} });',
      ].join("\n"),
    );
    const pagePath = path.join(root, "acme-demo-source", "frontend", "pages", "demo.tsx");
    await writeFile(pagePath, 'import "#/store/private"; export default function Demo() { return null; }');
    await expect(scanPluginUIImportBoundaries(root)).rejects.toThrow(/forbidden source-plugin UI import/i);
    await writeFile(
      pagePath,
      'import { useLinaPluginHost } from "@linapro/plugin-ui"; export default function Demo() { useLinaPluginHost(); return null; }',
    );
    await expect(scanPluginUIImportBoundaries(root)).resolves.toEqual(expect.arrayContaining([
      expect.stringContaining("frontend/plugin-ui.ts"),
      expect.stringContaining("frontend/pages/demo.tsx"),
    ]));
  });

  it("configures external plugin reads, stable imports, dependency dedupe, and the registry plugin", async () => {
    const appRoot = process.cwd();
    const source = await fs.readFile(path.join(appRoot, "vite.config.ts"), "utf8");
    expect(source).toContain('new URL("../lina-plugins", import.meta.url)');
    expect(source).toContain('"@linapro/plugin-ui"');
    expect(source).toContain("createPluginUIRegistryPlugin()");
    for (const dependency of [
      "react",
      "react-dom",
      "react-router",
      "react-router-dom",
      "@tanstack/react-query",
    ]) {
      expect(source).toContain(`"${dependency}"`);
    }
  });
});
