import { config } from "@host-tests/fixtures/config";
import { expect, test } from "@host-tests/fixtures/auth";
import { LoginPage } from "@host-tests/pages/LoginPage";
import {
  createAdminApiContext,
  createUser,
  deleteUser,
  expectSuccess,
} from "@host-tests/support/api/job";
import { waitForRouteReady } from "@host-tests/support/ui";

import {
  addTenantMember,
  createTenant,
  deleteTenant,
  grantTenantPermissions,
  removeTenantMember,
  revokeTenantPermissionGrants,
  updateUserPrimaryTenant,
  type TenantUserGrant,
} from "../../../../linapro-tenant-core/hack/tests/support/linapro-tenant-core";
import { TapCanvasStudioPage } from "../pages/TapCanvasStudioPage";

type AdminApi = Awaited<ReturnType<typeof createAdminApiContext>>;
type TenantFixture = { code: string; id: number; name: string };

const password = "test123456";

test.describe("TC002 TapCanvas Studio LinaPro host boundaries", () => {
  let adminApi: AdminApi;
  let tenantA: TenantFixture;
  let tenantB: TenantFixture;
  let userId = 0;
  let username = "";
  let memberAId = 0;
  let memberBId = 0;
  const grants: TenantUserGrant[] = [];

  test.beforeAll(async () => {
    adminApi = await createAdminApiContext();
    const suffix = Date.now().toString();
    tenantA = {
      code: `studio-a-${suffix}`.slice(0, 32),
      id: (await createTenant(adminApi, {
        code: `studio-a-${suffix}`.slice(0, 32),
        name: `Studio Editable ${suffix}`,
      })).id,
      name: `Studio Editable ${suffix}`,
    };
    tenantB = {
      code: `studio-b-${suffix}`.slice(0, 32),
      id: (await createTenant(adminApi, {
        code: `studio-b-${suffix}`.slice(0, 32),
        name: `Studio Readonly ${suffix}`,
      })).id,
      name: `Studio Readonly ${suffix}`,
    };
    const roles = await expectSuccess<{
      list: Array<{ id: number; key: string }>;
    }>(await adminApi.get("role?page=1&size=100&key=admin"));
    const adminRole = roles.list.find((role) => role.key === "admin");
    expect(adminRole, "built-in admin role should exist").toBeTruthy();
    username = `studio_user_${suffix}`;
    userId = (await createUser(adminApi, {
      nickname: "Studio Tenant User",
      password,
      roleIds: [adminRole!.id],
      username,
    })).id;
    updateUserPrimaryTenant(username, tenantA.id);
    memberAId = (await addTenantMember(adminApi, { tenantId: tenantA.id, userId })).id;
    memberBId = (await addTenantMember(adminApi, { tenantId: tenantB.id, userId })).id;
    grants.push(
      await grantTenantPermissions(adminApi, {
        permissions: [
          "tapcanvas:studio:view",
          "tapcanvas:flow:read",
          "tapcanvas:flow:update",
        ],
        roleKey: `studio-editable-${suffix}`,
        roleName: `Studio Editable ${suffix}`,
        tenantId: tenantA.id,
        userId,
      }),
      await grantTenantPermissions(adminApi, {
        permissions: [
          "tapcanvas:studio:view",
          "tapcanvas:flow:read",
        ],
        roleKey: `studio-readonly-${suffix}`,
        roleName: `Studio Readonly ${suffix}`,
        tenantId: tenantB.id,
        userId,
      }),
    );
  });

  test.afterAll(async () => {
    revokeTenantPermissionGrants(grants);
    if (memberAId > 0) await removeTenantMember(adminApi, memberAId).catch(() => undefined);
    if (memberBId > 0) await removeTenantMember(adminApi, memberBId).catch(() => undefined);
    if (userId > 0) await deleteUser(adminApi, userId).catch(() => undefined);
    if (tenantA?.id) await deleteTenant(adminApi, tenantA.id).catch(() => undefined);
    if (tenantB?.id) await deleteTenant(adminApi, tenantB.id).catch(() => undefined);
    await adminApi?.dispose();
  });

  test("switches Tenant, remounts the canvas, and hides editing without update permission", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: config.baseURL });
    const page = await context.newPage();
    const login = new LoginPage(page);
    const studio = new TapCanvasStudioPage(page);
    let readonlyProjection = false;
    const legacyRequests: string[] = [];
    const legacyApiPath = /^\/(?:auth|flows|projects|chapters|assets|tasks|executions|agents|ai|model-catalog|models|billing|commerce|products|orders|wechat-pay)(?:\/|$)/;
    const legacyProxyPath = /^\/api\/(?:auth|assets)(?:\/|$)/;
    const onRequest = (request: { url: () => string }) => {
      const url = new URL(request.url());
      if (url.port === "8788" || legacyApiPath.test(url.pathname) || legacyProxyPath.test(url.pathname)) {
        legacyRequests.push(request.url());
      }
    };

    try {
      await page.route("**/x/linapro-tenant-core/api/v1/auth/login-tenants?*", async (route) => {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ code: 0, data: { list: [tenantA, tenantB] } }),
        });
      });
      await page.route("**/api/v1/user/info", async (route) => {
        const response = await route.fetch();
        const payload = await response.json() as {
          data?: { permissions?: string[] };
        };
        if (payload.data) {
          payload.data.permissions = readonlyProjection
            ? [
                "system:tenant:auth:login-tenants",
                "tapcanvas:studio:view",
                "tapcanvas:flow:read",
              ]
            : Array.from(new Set([
                ...(payload.data.permissions ?? []),
                "system:tenant:auth:login-tenants",
              ]));
        }
        await route.fulfill({ json: payload, response });
      });
      await login.goto();
      await login.login(username, password);
      await expect(page.getByTestId("login-tenant-selector")).toBeVisible();
      const tenantSelect = page.getByTestId("login-tenant-form").getByRole("combobox");
      await tenantSelect.click();
      await page.getByRole("option", { name: `${tenantA.name} (${tenantA.code})` }).click();
      const selectionResponse = page.waitForResponse((response) =>
        /\/x\/linapro-tenant-core\/api\/v1\/auth\/select-tenant$/.test(response.url()),
      );
      await page.getByTestId("login-tenant-confirm").click();
      await selectionResponse;
      await page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 15_000 });
      await waitForRouteReady(page);

      page.on("request", onRequest);
      await studio.gotoStudio();
      await studio.assertCanvasReady();
      await studio.assertAccessMode("editable");
      await expect(studio.studioWorkspace).toContainText(tenantA.name);
      await studio.studioWorkspace.evaluate((element) => {
        element.setAttribute("data-e2e-tenant-instance", "tenant-a");
      });
      await studio.screenshot("tapcanvas-studio-tenant-editable");

      const switcher = page.getByTestId("tenant-switcher-select");
      await expect(switcher).toBeVisible();
      await switcher.click();
      readonlyProjection = true;
      const switchResponse = page.waitForResponse((response) =>
        /\/x\/linapro-tenant-core\/api\/v1\/auth\/switch-tenant$/.test(response.url()),
      );
      await page.getByRole("listbox").last().getByRole("option", { name: tenantB.name }).click();
      await switchResponse;
      await expect.poll(async () => (await studio.currentTenant())?.id ?? 0).toBe(tenantB.id);
      await waitForRouteReady(page);

      await studio.gotoStudio();
      await studio.assertCanvasReady();
      await studio.assertAccessMode("read-only");
      await expect(studio.studioWorkspace).toContainText(tenantB.name);
      await expect(studio.studioWorkspace).not.toHaveAttribute("data-e2e-tenant-instance");
      await studio.assertNoLegacyAuthState();
      await studio.screenshot("tapcanvas-studio-tenant-readonly");
      expect(legacyRequests).toEqual([]);
    } finally {
      page.off("request", onRequest);
      await context.close().catch(() => undefined);
    }
  });
});
