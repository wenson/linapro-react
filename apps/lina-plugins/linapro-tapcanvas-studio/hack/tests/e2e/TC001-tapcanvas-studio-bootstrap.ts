import { expect, test } from "@host-tests/fixtures/auth";

import { TapCanvasStudioPage } from "../pages/TapCanvasStudioPage";

test.describe("TC001 TapCanvas Studio builtin React bootstrap", () => {
  test("renders the tenant-bound project entry and first real canvas load", async ({ adminPage }) => {
    const studio = new TapCanvasStudioPage(adminPage);
    const legacyRequests: string[] = [];
    const legacyApiPath = /^\/(?:auth|flows|projects|chapters|assets|tasks|executions|agents|ai|model-catalog|models|billing|commerce|products|orders|wechat-pay)(?:\/|$)/;
    const legacyProxyPath = /^\/api\/(?:auth|assets)(?:\/|$)/;
    const onRequest = (request: { url: () => string }) => {
      const url = new URL(request.url());
      if (url.port === "8788" || legacyApiPath.test(url.pathname) || legacyProxyPath.test(url.pathname)) {
        legacyRequests.push(request.url());
      }
    };
    adminPage.on("request", onRequest);

    try {
      await studio.gotoProjectsWithoutTenant();
      await studio.screenshot("tapcanvas-projects-tenant-required");
      await studio.gotoStudioWithoutTenant();
      await studio.screenshot("tapcanvas-studio-tenant-required");

      const tenant = await studio.impersonateFirstActiveTenant();
      expect(tenant?.impersonated).toBe(true);
      await studio.gotoProjects();
      await studio.assertChineseProjectContent();
      await studio.assertReactSemiBoundary();
      await studio.screenshot("tapcanvas-project-entry");

      await studio.gotoStudio();
      await studio.assertCanvasReady();
      await studio.assertAccessMode("editable");
      await expect(studio.studioWorkspace).toContainText(tenant!.name);
      await studio.assertReactSemiBoundary();
      await studio.assertStudioIsolation();
      await studio.assertNoLegacyAuthState();
      await studio.screenshot("tapcanvas-studio-first-load");
      expect(legacyRequests).toEqual([]);
    } finally {
      adminPage.off("request", onRequest);
      await studio.exitImpersonation();
    }
  });

  test("follows LinaPro light and dark themes without leaking Mantine state", async ({ adminPage }) => {
    const studio = new TapCanvasStudioPage(adminPage);
    try {
      await studio.impersonateFirstActiveTenant();
      await studio.gotoStudio();
      await studio.assertCanvasReady();

      await studio.setHostColorScheme("light");
      await studio.assertStudioIsolation();
      await studio.screenshot("tapcanvas-studio-light");

      await studio.setHostColorScheme("dark");
      await studio.assertStudioIsolation();
      await studio.screenshot("tapcanvas-studio-dark");
    } finally {
      await studio.exitImpersonation();
    }
  });
});
