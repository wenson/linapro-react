import { config, pluginApiPath, workspacePath } from "@host-tests/fixtures/config";
import { expect, test } from "@host-tests/fixtures/auth";
import { MainLayout } from "@host-tests/pages/MainLayout";
import { LoginPage } from "@host-tests/pages/LoginPage";
import type {
  APIRequestContext,
  Browser,
  BrowserContext,
  Page,
} from "@host-tests/support/playwright";
import {
  createAdminApiContext,
  createUser,
  deleteUser,
  expectSuccess,
} from "@host-tests/support/api/job";
import { execPgSQL, queryPgScalar } from "@host-tests/support/postgres";
import { waitForRouteReady } from "@host-tests/support/ui";

import {
  addTenantMember,
  createTenant,
  createTenantApiContext,
  deleteTenant,
  grantTenantPermissions,
  loginRaw,
  removeTenantMember,
  revokeTenantPermissionGrants,
  selectTenant,
  updateUserPrimaryTenant,
  type TenantUserGrant,
} from "../../../../linapro-tenant-core/hack/tests/support/linapro-tenant-core";
import { TapCanvasStudioPage } from "../pages/TapCanvasStudioPage";

type TenantFixture = { code: string; id: number; name: string };
type ProjectItem = {
  chapterCount: number;
  createdAt: number | null;
  description: string;
  id: string;
  latestFlow: null | { id: string; name: string; updatedAt: number | null };
  name: string;
  ownerId: number;
  updatedAt: number | null;
};
type ChapterItem = {
  id: string;
  index: number;
  projectId: string;
  sortOrder: number;
  status: string;
  summary: string;
  title: string;
};

const password = "test123456";
const allProjectPermissions = [
  "tapcanvas:project:view",
  "tapcanvas:project:create",
  "tapcanvas:project:update",
  "tapcanvas:project:delete",
];

function studioApi(path: string) {
  return new URL(pluginApiPath("linapro-tapcanvas-studio", path), config.publicBaseURL).toString();
}

async function createProject(api: APIRequestContext, name: string, description = "") {
  return expectSuccess<ProjectItem>(await api.post(studioApi("projects"), {
    data: { description, name },
  }));
}

async function createChapter(api: APIRequestContext, projectId: string, title: string) {
  return expectSuccess<ChapterItem>(await api.post(studioApi(`projects/${projectId}/chapters`), {
    data: { summary: `${title} summary`, title },
  }));
}

async function listProjects(api: APIRequestContext) {
  return expectSuccess<{ list: ProjectItem[]; total: number }>(
    await api.get(studioApi("projects?pageNum=1&pageSize=100")),
  );
}

async function listChapters(api: APIRequestContext, projectId: string) {
  return expectSuccess<{ list: ChapterItem[] }>(
    await api.get(studioApi(`projects/${projectId}/chapters`)),
  );
}

async function expectRejected(response: Awaited<ReturnType<APIRequestContext["get"]>>) {
  const raw = await response.text();
  if (!response.ok()) {
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(raw).not.toBe("");
    return { code: response.status(), message: raw };
  }
  const payload = JSON.parse(raw) as { code: number; errorCode?: string; message?: string };
  expect(payload.code, raw).not.toBe(0);
  return payload;
}

async function loginTenantApi(username: string, tenantId: number) {
  const login = await loginRaw(username, password);
  const accessToken = login.accessToken ?? (
    login.preToken ? await selectTenant(login.preToken, tenantId) : ""
  );
  expect(accessToken, `missing tenant access token for ${username}`).toBeTruthy();
  return createTenantApiContext(accessToken);
}

async function loginTenantPage(browser: Browser, username: string, tenant: TenantFixture) {
  const context = await browser.newContext({ baseURL: config.baseURL, locale: "zh-CN" });
  const page = await context.newPage();
  const login = new LoginPage(page);
  await login.goto();
  await login.login(username, password);

  const selector = page.getByTestId("login-tenant-selector");
  await Promise.race([
    page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 15_000 }),
    selector.waitFor({ state: "visible", timeout: 15_000 }),
  ]);
  if (await selector.isVisible().catch(() => false)) {
    await page.getByTestId("login-tenant-form").getByRole("combobox").click();
    await page.getByRole("option", { name: `${tenant.name} (${tenant.code})` }).click();
    await page.getByTestId("login-tenant-confirm").click();
  }
  await page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 15_000 });
  await waitForRouteReady(page);
  return { context, page };
}

test.describe("TC003 TapCanvas project and chapter vertical slice", () => {
  let adminApi: APIRequestContext;
  let tenantA: TenantFixture;
  let tenantB: TenantFixture;
  let allAApi: APIRequestContext;
  let selfAApi: APIRequestContext;
  let allBApi: APIRequestContext;
  let viewAApi: APIRequestContext;
  const userIds: number[] = [];
  const memberIds: number[] = [];
  const grants: TenantUserGrant[] = [];
  let allAUsername = "";
  let selfAUsername = "";
  let allBUsername = "";
  let viewAUsername = "";
  let viewAUserId = 0;
  let tenantProject: ProjectItem;
  let selfProject: ProjectItem;
  let otherTenantProject: ProjectItem;
  let firstChapter: ChapterItem;
  let secondChapter: ChapterItem;
  let pluginState = "";
  let projectsTable = "";
  let chaptersTable = "";

  test.beforeAll(async () => {
    adminApi = await createAdminApiContext();
    pluginState = queryPgScalar(`
      SELECT version || '|' || installed || '|' || status
      FROM sys_plugin
      WHERE plugin_id = 'linapro-tapcanvas-studio'
        AND deleted_at IS NULL;
    `);
    projectsTable = queryPgScalar("SELECT to_regclass('public.tapcanvas_projects');");
    chaptersTable = queryPgScalar("SELECT to_regclass('public.tapcanvas_chapters');");

    const suffix = Date.now().toString();
    tenantA = {
      code: `studio-project-a-${suffix}`.slice(0, 32),
      id: 0,
      name: `Studio Project A ${suffix}`,
    };
    tenantA.id = (await createTenant(adminApi, { code: tenantA.code, name: tenantA.name })).id;
    tenantB = {
      code: `studio-project-b-${suffix}`.slice(0, 32),
      id: 0,
      name: `Studio Project B ${suffix}`,
    };
    tenantB.id = (await createTenant(adminApi, { code: tenantB.code, name: tenantB.name })).id;

    const users = [
      { key: "all-a", tenant: tenantA },
      { key: "self-a", tenant: tenantA },
      { key: "all-b", tenant: tenantB },
      { key: "view-a", tenant: tenantA },
    ] as const;
    const usernames: string[] = [];
    for (const item of users) {
      const username = `studio_${item.key}_${suffix}`.replaceAll("-", "_");
      const userId = (await createUser(adminApi, {
        nickname: `Studio ${item.key}`,
        password,
        roleIds: [],
        username,
      })).id;
      usernames.push(username);
      userIds.push(userId);
      if (item.key === "view-a") viewAUserId = userId;
      updateUserPrimaryTenant(username, item.tenant.id);
      memberIds.push((await addTenantMember(adminApi, { tenantId: item.tenant.id, userId })).id);
      const permissions = item.key === "view-a"
        ? ["tapcanvas:studio:view", "tapcanvas:project:view"]
        : allProjectPermissions;
      const grant = await grantTenantPermissions(adminApi, {
        permissions,
        roleKey: `studio-${item.key}-${suffix}`,
        roleName: `Studio ${item.key} ${suffix}`,
        tenantId: item.tenant.id,
        userId,
      });
      grants.push(grant);
      if (item.key === "self-a") {
        execPgSQL(`UPDATE sys_role SET data_scope = 4 WHERE id = ${grant.roleId};`);
      }
    }
    [allAUsername, selfAUsername, allBUsername, viewAUsername] = usernames;

    allAApi = await loginTenantApi(allAUsername, tenantA.id);
    selfAApi = await loginTenantApi(selfAUsername, tenantA.id);
    allBApi = await loginTenantApi(allBUsername, tenantB.id);
    viewAApi = await loginTenantApi(viewAUsername, tenantA.id);
    // Keep the direct tenant token above for API assertions, then add a second
    // membership so the browser exercises an explicit tenant-selection flow.
    memberIds.push((await addTenantMember(adminApi, { tenantId: tenantB.id, userId: viewAUserId })).id);

    tenantProject = await createProject(allAApi, `Tenant Project ${suffix}`, "Tenant-visible project");
    firstChapter = await createChapter(allAApi, tenantProject.id, `Opening ${suffix}`);
    secondChapter = await createChapter(allAApi, tenantProject.id, `Finale ${suffix}`);
    selfProject = await createProject(selfAApi, `Self Project ${suffix}`, "Self-only project");
    otherTenantProject = await createProject(allBApi, `Other Tenant ${suffix}`, "Must stay isolated");
  });

  test.afterAll(async () => {
    if (allAApi) {
      const list = await listProjects(allAApi).catch(() => ({ list: [] }));
      for (const project of list.list) {
        await allAApi.delete(studioApi(`projects/${project.id}`)).catch(() => undefined);
      }
    }
    if (allBApi && otherTenantProject?.id) {
      await allBApi.delete(studioApi(`projects/${otherTenantProject.id}`)).catch(() => undefined);
    }
    for (const api of [allAApi, selfAApi, allBApi, viewAApi]) {
      await api?.dispose().catch(() => undefined);
    }
    revokeTenantPermissionGrants(grants);
    for (const memberId of memberIds) {
      await removeTenantMember(adminApi, memberId).catch(() => undefined);
    }
    for (const userId of userIds) {
      await deleteUser(adminApi, userId).catch(() => undefined);
    }
    if (tenantA?.id) await deleteTenant(adminApi, tenantA.id).catch(() => undefined);
    if (tenantB?.id) await deleteTenant(adminApi, tenantB.id).catch(() => undefined);
    await adminApi?.dispose();
  });

  test("TC003a: builtin v0.1.1 exposes complete project and chapter CRUD with atomic ordering", async () => {
    expect(pluginState).toBe("v0.1.1|1|1");
    expect(projectsTable).toBe("tapcanvas_projects");
    expect(chaptersTable).toBe("tapcanvas_chapters");

    const project = await expectSuccess<ProjectItem>(
      await allAApi.get(studioApi(`projects/${tenantProject.id}`)),
    );
    expect(project).toMatchObject({ chapterCount: 2, latestFlow: null, ownerId: tenantProject.ownerId });
    expect(project.createdAt).toEqual(expect.any(Number));

    const updated = await expectSuccess<ProjectItem>(
      await allAApi.put(studioApi(`projects/${tenantProject.id}`), {
        data: { description: "Updated tenant-visible project", name: tenantProject.name },
      }),
    );
    expect(updated.description).toBe("Updated tenant-visible project");

    await expectRejected(await allAApi.put(studioApi(`projects/${tenantProject.id}/chapters/order`), {
      data: { chapterIds: [firstChapter.id, firstChapter.id] },
    }));
    expect((await listChapters(allAApi, tenantProject.id)).list.map((item) => item.id))
      .toEqual([firstChapter.id, secondChapter.id]);

    const reordered = await expectSuccess<{ list: ChapterItem[] }>(
      await allAApi.put(studioApi(`projects/${tenantProject.id}/chapters/order`), {
        data: { chapterIds: [secondChapter.id, firstChapter.id] },
      }),
    );
    expect(reordered.list.map((item) => item.id)).toEqual([secondChapter.id, firstChapter.id]);

    const updatedChapter = await expectSuccess<ChapterItem>(
      await allAApi.put(studioApi(`chapters/${secondChapter.id}`), {
        data: { status: "planning", summary: "Updated chapter summary", title: secondChapter.title },
      }),
    );
    expect(updatedChapter).toMatchObject({ status: "planning", summary: "Updated chapter summary" });

    const disposable = await createProject(allAApi, `Disposable ${Date.now()}`);
    await expectSuccess(await allAApi.delete(studioApi(`projects/${disposable.id}`)));
    await expectRejected(await allAApi.get(studioApi(`projects/${disposable.id}`)));
  });

  test("TC003b: Tenant, Self scope, detail, aggregate, permission, and reorder boundaries fail closed", async () => {
    const tenantList = await listProjects(allAApi);
    expect(tenantList.list.map((item) => item.id)).toEqual(expect.arrayContaining([
      tenantProject.id,
      selfProject.id,
    ]));
    expect(tenantList.list.map((item) => item.id)).not.toContain(otherTenantProject.id);
    expect(tenantList.list.find((item) => item.id === tenantProject.id)).toMatchObject({ chapterCount: 2 });

    const selfList = await listProjects(selfAApi);
    expect(selfList).toMatchObject({ total: 1 });
    expect(selfList.list).toHaveLength(1);
    expect(selfList.list[0]).toMatchObject({ chapterCount: 0, id: selfProject.id });
    await expectRejected(await selfAApi.get(studioApi(`projects/${tenantProject.id}`)));
    await expectRejected(await selfAApi.get(studioApi(`projects/${tenantProject.id}/chapters`)));

    const otherTenantList = await listProjects(allBApi);
    expect(otherTenantList.list.map((item) => item.id)).toEqual([otherTenantProject.id]);
    await expectRejected(await allAApi.get(studioApi(`projects/${otherTenantProject.id}`)));
    await expectRejected(await allAApi.get(studioApi(`chapters/${(await createChapter(allBApi, otherTenantProject.id, `Hidden ${Date.now()}`)).id}`)));

    const viewList = await listProjects(viewAApi);
    expect(viewList.list.map((item) => item.id)).toEqual(expect.arrayContaining([tenantProject.id, selfProject.id]));
    await expectRejected(await viewAApi.post(studioApi("projects"), {
      data: { description: "forbidden", name: "Forbidden" },
    }));
  });

  test("TC003c: React + Semi UI completes CRUD, stays bilingual, and hides ungranted mutations", async ({
    adminPage,
    browser,
    mainLayout,
  }) => {
    const studio = new TapCanvasStudioPage(adminPage);
    const suffix = Date.now().toString();
    const initialName = `UI Project ${suffix}`;
    const updatedName = `UI Project Updated ${suffix}`;
    const firstTitle = `UI Opening ${suffix}`;
    const secondTitle = `UI Finale ${suffix}`;
    let viewContext: BrowserContext | undefined;
    let viewPage: Page | undefined;

    try {
      await studio.impersonateTenant(tenantA.name);
      await studio.gotoProjects();
      await studio.assertChineseProjectContent();
      await studio.createProject(initialName, "Created from React UI");
      await studio.updateProject(initialName, updatedName, "Updated from React UI");
      await studio.openChapters(updatedName);
      await studio.createChapter(firstTitle, "Opening summary");
      await studio.createChapter(secondTitle, "Finale summary");
      await studio.moveChapterUp(secondTitle);
      await studio.updateChapter(secondTitle, `${secondTitle} Updated`, "Updated finale summary");
      await studio.deleteChapter(firstTitle);
      await expect(studio.chapterRow(`${secondTitle} Updated`)).toContainText("策划中");
      await expect(adminPage.getByText("keyword", { exact: true })).toHaveCount(0);
      await expect(adminPage.getByText(/pages\.common\./)).toHaveCount(0);
      await expect(adminPage.locator(".semi-toast-content-text:visible")).toHaveCount(0, { timeout: 10_000 });
      await studio.screenshot("tapcanvas-project-chapter-crud");

      await mainLayout.switchLanguage("English");
      await adminPage.keyboard.press("Escape");
      await expect(adminPage.locator(".semi-dropdown-menu:visible, .semi-toast-content-text:visible")).toHaveCount(0, { timeout: 10_000 });
      await expect(studio.projectEntry.getByRole("heading", { name: "Projects" })).toBeVisible();
      await expect(studio.projectEntry.getByRole("columnheader", { name: "Project Name" })).toBeVisible();
      await expect(studio.projectEntry.getByRole("columnheader", { name: "Chapters" }).first()).toBeVisible();
      await expect(studio.chapterRow(`${secondTitle} Updated`)).toContainText("Planning");
      await expect(studio.projectEntry.getByText(/plugin\.linapro-tapcanvas-studio/)).toHaveCount(0);
      await studio.screenshot("tapcanvas-project-chapter-english");
      await studio.deleteChapter(`${secondTitle} Updated`);
      await studio.deleteProject(updatedName);
      await mainLayout.switchLanguage("简体中文");
      await studio.exitImpersonation();

      ({ context: viewContext, page: viewPage } = await loginTenantPage(browser, viewAUsername, tenantA));
      const viewStudio = new TapCanvasStudioPage(viewPage);
      await viewStudio.gotoProjects();
      await expect(viewStudio.projectRow(tenantProject.name)).toBeVisible();
      await expect(viewStudio.projectEntry.getByRole("button", { name: /创建项目|Create Project/i })).toHaveCount(0);
      await expect(viewStudio.projectRow(tenantProject.name).getByRole("button", { name: /编辑|Edit/i })).toHaveCount(0);
      await expect(viewStudio.projectRow(tenantProject.name).getByRole("button", { name: /删除|Delete/i })).toHaveCount(0);
      await expect(viewStudio.projectRow(tenantProject.name).getByRole("button", { name: /章节|Chapters/i })).toBeVisible();
      await new MainLayout(viewPage).switchLanguage("English");
      await expect(viewStudio.projectEntry.getByRole("heading", { name: "Projects" })).toBeVisible();
    } finally {
      await viewContext?.close().catch(() => undefined);
      if (await adminPage.getByTestId("impersonation-banner").isVisible().catch(() => false)) {
        await studio.exitImpersonation();
      }
      await adminPage.goto(workspacePath("/dashboard/analytics")).catch(() => undefined);
    }
  });
});
