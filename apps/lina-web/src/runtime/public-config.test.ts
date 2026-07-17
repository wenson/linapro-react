import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "#/api/client";
import {
  defaultPublicFrontendConfig,
  loadPublicFrontendConfig,
  normalizePublicFrontendConfig,
  normalizeWorkspaceBasePath,
  resolveWorkspaceAssetUrl,
  resolveWorkspaceRouterBase,
} from "#/runtime/public-config";

describe("public frontend config", () => {
  it("projects every public configuration group", () => {
    const config = normalizePublicFrontendConfig({
      app: { logo: "/brand.svg", logoDark: "/brand-dark.svg", name: "Lina Custom" },
      auth: {
        forgetPasswordEnabled: true,
        loginSubtitle: "Sign in",
        panelLayout: "panel-center",
        pageDesc: "Description",
        pageTitle: "Title",
        privacyPolicy: "Privacy",
        registerEnabled: false,
        termsOfService: "Terms",
      },
      cron: {
        logRetention: { mode: "count", value: 80 },
        shell: {
          disabledReason: "Disabled",
          disabledReasonKey: "config.cron.shell.disabled",
          enabled: true,
          supported: false,
        },
        timezone: { current: "UTC" },
      },
      ui: {
        layout: "header-nav",
        themeMode: "dark",
        watermarkContent: "Tenant A",
        watermarkEnabled: true,
      },
      user: { defaultAvatar: "/people/default.webp" },
      workspace: { basePath: "/console/" },
    });

    expect(config).toEqual({
      app: { logo: "/brand.svg", logoDark: "/brand-dark.svg", name: "Lina Custom" },
      auth: {
        forgetPasswordEnabled: true,
        loginSubtitle: "Sign in",
        panelLayout: "panel-center",
        pageDesc: "Description",
        pageTitle: "Title",
        privacyPolicy: "Privacy",
        registerEnabled: false,
        termsOfService: "Terms",
      },
      cron: {
        logRetention: { mode: "count", value: 80 },
        shell: {
          disabledReason: "Disabled",
          disabledReasonKey: "config.cron.shell.disabled",
          enabled: true,
          supported: false,
        },
        timezone: { current: "UTC" },
      },
      ui: {
        layout: "header-nav",
        themeMode: "dark",
        watermarkContent: "Tenant A",
        watermarkEnabled: true,
      },
      user: { defaultAvatar: "/people/default.webp" },
      workspace: { basePath: "/console" },
    });
  });

  it.each([
    "/api",
    "/api/v1/users",
    "/x",
    "/x/plugin",
    "/x-assets/demo",
    "https://example.com/admin",
    "//example.com/admin",
    "/admin?mode=1",
    "/admin#hash",
    "/admin/*",
    "/admin/../api",
  ])("rejects reserved or unsafe basePath %s", (basePath) => {
    expect(normalizeWorkspaceBasePath(basePath)).toBe("/admin");
  });

  it("preserves root API assets while prefixing workbench assets", () => {
    expect(resolveWorkspaceAssetUrl("/api.json", "/console")).toBe("/api.json");
    expect(resolveWorkspaceAssetUrl("/api/files/1", "/console")).toBe("/api/files/1");
    expect(resolveWorkspaceAssetUrl("/x/demo/api/v1/items", "/console")).toBe(
      "/x/demo/api/v1/items",
    );
    expect(resolveWorkspaceAssetUrl("/x-assets/demo/logo.svg", "/console")).toBe(
      "/x-assets/demo/logo.svg",
    );
    expect(resolveWorkspaceAssetUrl("logo.webp?rev=1", "/console")).toBe(
      "/console/logo.webp?rev=1",
    );
    expect(resolveWorkspaceRouterBase("/console")).toBe("/console/");
  });

  it("falls back atomically and records one diagnostic when loading fails", async () => {
    const diagnostic = vi.fn();
    const client = {
      get: vi.fn().mockRejectedValue(new Error("offline")),
    } as unknown as ApiClient;

    await expect(loadPublicFrontendConfig(client, { onDiagnostic: diagnostic })).resolves.toEqual(
      defaultPublicFrontendConfig,
    );
    expect(diagnostic).toHaveBeenCalledOnce();
  });
});
