import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { HmrContext, Plugin, ViteDevServer } from "vite";

const virtualModuleId = "virtual:linapro-plugin-ui";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;
const pluginIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const moduleExtensions = ["", ".ts", ".tsx", ".js", ".jsx", ".css", ".scss", ".less", ".json"] as const;
const indexExtensions = ["index.ts", "index.tsx", "index.js", "index.jsx"] as const;

export interface PluginUIRegistryOptions {
  pluginsRoot?: string;
}

interface PluginUIManifest {
  manifestPath: string;
  pluginId: string;
}

function normalizePath(value: string): string {
  return value.replaceAll(path.sep, "/");
}

function viteFileSystemPath(value: string): string {
  return `/@fs/${normalizePath(value)}`;
}

function isWithin(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function existingFile(candidates: readonly string[]): Promise<string | null> {
  for (const candidate of candidates) {
    try {
      if ((await fs.stat(candidate)).isFile()) {
        return candidate;
      }
    } catch {
      // Vite-style extension resolution continues through the remaining candidates.
    }
  }
  return null;
}

async function resolveLocalModule(manifestDir: string, specifier: string): Promise<string> {
  const cleanSpecifier = specifier.split(/[?#]/, 1)[0] ?? "";
  const unresolved = path.resolve(manifestDir, cleanSpecifier);
  const candidates = [
    ...moduleExtensions.map((extension) => `${unresolved}${extension}`),
    ...indexExtensions.map((fileName) => path.join(unresolved, fileName)),
  ];
  const resolved = await existingFile(candidates);
  if (!resolved) {
    throw new Error(`Plugin UI manifest references a missing module: ${specifier}`);
  }
  return await fs.realpath(resolved);
}

function importSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const matcher = /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["']([^"']+)["']/g;
  for (const match of source.matchAll(matcher)) {
    if (match[1]) {
      specifiers.push(match[1]);
    }
  }
  return specifiers;
}

function lazyImportSpecifiers(source: string): Set<string> {
  const specifiers = new Set<string>();
  const matcher = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
  for (const match of source.matchAll(matcher)) {
    if (match[1]) {
      specifiers.add(match[1]);
    }
  }
  return specifiers;
}

async function validateManifest(manifest: PluginUIManifest): Promise<void> {
  const source = await fs.readFile(manifest.manifestPath, "utf8");
  if (/\bpluginId\s*:/.test(source)) {
    throw new Error(`${manifest.pluginId} plugin-ui.ts cannot override its directory-owned plugin ID`);
  }

  const frontendRoot = await fs.realpath(path.dirname(manifest.manifestPath));
  const lazyImports = lazyImportSpecifiers(source);
  const dynamicImportCount = source.match(/\bimport\s*\(/g)?.length ?? 0;
  const literalDynamicImportCount = source.match(
    /\bimport\s*\(\s*["'][^"']+["']\s*\)/g,
  )?.length ?? 0;
  if (dynamicImportCount !== literalDynamicImportCount) {
    throw new Error(`${manifest.pluginId} plugin-ui.ts may only use literal dynamic imports`);
  }
  const loadCount = source.match(/\bload\s*:/g)?.length ?? 0;
  const literalLazyLoadCount = source.match(
    /\bload\s*:\s*\(\s*\)\s*=>\s*import\s*\(\s*["'][^"']+["']\s*\)/g,
  )?.length ?? 0;
  if (loadCount !== literalLazyLoadCount) {
    throw new Error(`${manifest.pluginId} plugin-ui.ts load() entries must use literal lazy imports`);
  }
  for (const specifier of importSpecifiers(source)) {
    if (specifier === "@linapro/plugin-ui") {
      continue;
    }
    if (!specifier.startsWith(".")) {
      throw new Error(
        `${manifest.pluginId} plugin-ui.ts may only import @linapro/plugin-ui and modules in its own frontend directory`,
      );
    }
    if (!lazyImports.has(specifier)) {
      throw new Error(`${manifest.pluginId} plugin-ui.ts cannot eagerly import frontend modules: ${specifier}`);
    }
    const resolved = await resolveLocalModule(frontendRoot, specifier);
    if (!isWithin(frontendRoot, resolved)) {
      throw new Error(`${manifest.pluginId} plugin-ui.ts contains a frontend directory escape: ${specifier}`);
    }
    if (lazyImports.has(specifier) && !/\.[jt]sx$/i.test(resolved)) {
      throw new Error(`${manifest.pluginId} lazy UI module must resolve to a React .tsx or .jsx file: ${specifier}`);
    }
  }
}

export async function discoverPluginUIManifests(pluginsRoot: string): Promise<PluginUIManifest[]> {
  let entries;
  try {
    entries = await fs.readdir(pluginsRoot, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const realPluginsRoot = await fs.realpath(pluginsRoot);
  const manifests: PluginUIManifest[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.name === "node_modules") {
      continue;
    }
    if (entry.isSymbolicLink()) {
      throw new Error(`Plugin directories must not be symlinks: ${entry.name}`);
    }
    if (!entry.isDirectory()) {
      continue;
    }
    if (!pluginIdPattern.test(entry.name)) {
      throw new Error(`Invalid source plugin directory ID: ${entry.name}`);
    }
    const pluginRoot = path.join(realPluginsRoot, entry.name);
    const manifestPath = path.join(pluginRoot, "frontend", "plugin-ui.ts");
    try {
      const manifestRealPath = await fs.realpath(manifestPath);
      const frontendRoot = await fs.realpath(path.join(pluginRoot, "frontend"));
      if (!isWithin(frontendRoot, manifestRealPath)) {
        throw new Error(`Plugin UI manifest escapes its frontend directory: ${entry.name}`);
      }
      manifests.push({ manifestPath: manifestRealPath, pluginId: entry.name });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }
  return manifests;
}

export async function generatePluginUIVirtualModule(pluginsRoot: string): Promise<string> {
  const manifests = await discoverPluginUIManifests(pluginsRoot);
  await Promise.all(manifests.map(validateManifest));
  const imports = manifests.map(
    (manifest, index) => `import plugin${index} from ${JSON.stringify(viteFileSystemPath(manifest.manifestPath))};`,
  );
  const entries = manifests.map(
    (manifest, index) => `  { pluginId: ${JSON.stringify(manifest.pluginId)}, definition: plugin${index} },`,
  );
  return [
    ...imports,
    "export const sourcePluginUI = [",
    ...entries,
    "];",
    "",
  ].join("\n");
}

const forbiddenPluginImports = [
  /^(?:#\/|@vben(?:\/|$))/,
  /^(?:vue|vue-router|ant-design-vue|antd|@ant-design\/icons)(?:\/|$)/,
  /apps\/lina-web\/src\//,
] as const;

export async function scanPluginUIImportBoundaries(pluginsRoot: string): Promise<string[]> {
  const manifests = await discoverPluginUIManifests(pluginsRoot);
  const visited = new Set<string>();

  async function scan(file: string, frontendRoot: string): Promise<void> {
    const realFile = await fs.realpath(file);
    if (visited.has(realFile)) {
      return;
    }
    if (!isWithin(frontendRoot, realFile)) {
      throw new Error(`Source-plugin UI import escapes its frontend directory: ${realFile}`);
    }
    visited.add(realFile);
    if (!/\.[cm]?[jt]sx?$/i.test(realFile)) {
      return;
    }
    const source = await fs.readFile(realFile, "utf8");
    for (const specifier of importSpecifiers(source)) {
      if (forbiddenPluginImports.some((pattern) => pattern.test(specifier))) {
        throw new Error(`Forbidden source-plugin UI import in ${realFile}: ${specifier}`);
      }
      if (specifier.startsWith(".")) {
        const resolved = await resolveLocalModule(path.dirname(realFile), specifier);
        await scan(resolved, frontendRoot);
      }
    }
  }

  for (const manifest of manifests) {
    await validateManifest(manifest);
    await scan(manifest.manifestPath, await fs.realpath(path.dirname(manifest.manifestPath)));
  }
  return [...visited].sort();
}

export function isPluginUIManifestPath(file: string, pluginsRoot: string): boolean {
  const relative = normalizePath(path.relative(path.resolve(pluginsRoot), path.resolve(file)));
  return /^[^/]+\/frontend\/plugin-ui\.ts$/.test(relative);
}

function invalidateVirtualModule(server: ViteDevServer): void {
  const module = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
  if (module) {
    server.moduleGraph.invalidateModule(module);
  }
  server.ws.send({ type: "full-reload" });
}

export function createPluginUIRegistryPlugin(options: PluginUIRegistryOptions = {}): Plugin {
  const pluginsRoot = path.resolve(
    options.pluginsRoot ?? fileURLToPath(new URL("../../lina-plugins", import.meta.url)),
  );
  return {
    configureServer(server) {
      server.watcher.add(pluginsRoot);
      const refresh = (file: string) => {
        if (isPluginUIManifestPath(file, pluginsRoot)) {
          invalidateVirtualModule(server);
        }
      };
      server.watcher.on("add", refresh);
      server.watcher.on("unlink", refresh);
    },
    async handleHotUpdate(context: HmrContext) {
      if (isPluginUIManifestPath(context.file, pluginsRoot)) {
        invalidateVirtualModule(context.server);
        return [];
      }
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        return await generatePluginUIVirtualModule(pluginsRoot);
      }
    },
    name: "linapro-plugin-ui-registry",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
  };
}
