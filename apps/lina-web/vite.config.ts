import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

import { resolveBasePathPublicAsset } from "./build/base-path-public-asset";
import { createPluginUIRegistryPlugin } from "./build/plugin-ui-registry";

const DEFAULT_API_TARGET = "http://127.0.0.1:9120";

function normalizeBuildBase(value: string | undefined): string {
  const candidate = value?.trim();
  if (!candidate || candidate === "/") {
    return "/";
  }

  return `/${candidate.replace(/^\/+|\/+$/g, "")}/`;
}

export function createBasePathPublicAssetPlugin(base: string): Plugin {
  return {
    name: "linapro-base-path-public-assets",
    configureServer(server) {
      const publicDir = path.resolve(server.config.publicDir);
      server.middlewares.use((request, response, next) => {
        const pathname = (request.url ?? "").split("?", 2)[0] ?? "";
        const basePath = base === "/" ? "/" : base.replace(/\/$/, "");
        if (basePath !== "/" && pathname === basePath) {
          response.statusCode = 307;
          response.setHeader("Location", `${basePath}/`);
          response.end();
          return;
        }
        const asset = resolveBasePathPublicAsset(
          base,
          publicDir,
          request.url ?? "",
        );
        if (asset) {
          response.statusCode = 200;
          response.setHeader("Content-Type", asset.contentType);
          createReadStream(asset.filePath).pipe(response);
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.LINA_API_PROXY_TARGET || DEFAULT_API_TARGET;
  const base = normalizeBuildBase(env.LINA_WEB_BASE_PATH);

  return {
    base,
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          onlyExplicitManualChunks: true,
          manualChunks(moduleId) {
            const normalizedId = moduleId.replaceAll("\\", "/");
            if (!normalizedId.includes("/node_modules/")) {
              return undefined;
            }
            if (
              normalizedId.includes("/node_modules/echarts/") ||
              normalizedId.includes("/echarts@")
            ) {
              return "echarts-vendor";
            }
            if (
              normalizedId.includes("/node_modules/zrender/") ||
              normalizedId.includes("/zrender@")
            ) {
              return "zrender-vendor";
            }
            if (
              normalizedId.includes("/node_modules/@tiptap/") ||
              normalizedId.includes("/@tiptap+") ||
              normalizedId.includes("/node_modules/prosemirror-") ||
              normalizedId.includes("/prosemirror-")
            ) {
              return "tiptap-vendor";
            }
            if (
              /\/@douyinfe\/semi-ui\/lib\/es\/(descriptions|list|tabs)\//.test(
                normalizedId,
              )
            ) {
              return "semi-page-vendor";
            }
            if (
              normalizedId.includes("/@douyinfe/semi-foundation/") ||
              normalizedId.includes("/@douyinfe+semi-foundation@")
            ) {
              return "semi-foundation-vendor";
            }
            if (
              normalizedId.includes("/@douyinfe/semi-ui/") ||
              normalizedId.includes("/@douyinfe+semi-ui@")
            ) {
              return "semi-ui-vendor";
            }
            if (normalizedId.includes("/@douyinfe/")) {
              return "semi-runtime-vendor";
            }
            if (
              normalizedId.includes("/react@") ||
              normalizedId.includes("/react-dom@") ||
              normalizedId.includes("/react-router") ||
              normalizedId.includes("/scheduler@")
            ) {
              return "react-vendor";
            }
            if (
              normalizedId.includes("/i18next@") ||
              normalizedId.includes("/react-i18next@") ||
              normalizedId.includes("/dayjs@")
            ) {
              return "i18n-vendor";
            }
            if (normalizedId.includes("/@tanstack/")) {
              return "query-vendor";
            }
            return "vendor";
          },
        },
      },
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom", "@tanstack/react-query"],
    },
    plugins: [createBasePathPublicAssetPlugin(base), react(), createPluginUIRegistryPlugin()],
    resolve: {
      alias: {
        "#": fileURLToPath(new URL("./src", import.meta.url)),
        "@linapro/plugin-ui/rich-text-editor": fileURLToPath(
          new URL("./src/plugin-ui/rich-text-public.ts", import.meta.url),
        ),
        "@linapro/plugin-ui": fileURLToPath(
          new URL("./src/plugin-ui/public.ts", import.meta.url),
        ),
        "@douyinfe/semi-icons": fileURLToPath(
          new URL("./node_modules/@douyinfe/semi-icons", import.meta.url),
        ),
        "@douyinfe/semi-ui": fileURLToPath(
          new URL("./node_modules/@douyinfe/semi-ui", import.meta.url),
        ),
      },
      dedupe: [
        "@testing-library/react",
        "react",
        "react-dom",
        "react-router",
        "react-router-dom",
        "@tanstack/react-query",
        "zustand",
      ],
    },
    server: {
      fs: {
        allow: [
          fileURLToPath(new URL(".", import.meta.url)),
          fileURLToPath(new URL("../lina-plugins", import.meta.url)),
        ],
      },
      proxy: {
        "/api": { changeOrigin: true, target: apiTarget },
        "/x-assets": { changeOrigin: true, target: apiTarget },
        "/x": { changeOrigin: true, target: apiTarget },
      },
    },
    test: {
      css: true,
      environment: "jsdom",
      globals: true,
      include: [
        "build/**/*.test.ts",
        "src/**/*.test.{ts,tsx}",
        "../lina-plugins/*/frontend/**/*.test.{ts,tsx}",
      ],
      maxWorkers: 8,
      setupFiles: ["./src/test/setup.ts"],
      testTimeout: 10_000,
    },
  };
});
