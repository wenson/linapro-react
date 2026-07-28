import { mkdirSync } from "node:fs";
import path from "node:path";

import { workspacePath } from "@host-tests/fixtures/config";
import { expect, type Page } from "@host-tests/support/playwright";
import { waitForConfirmOverlay, waitForRouteReady } from "@host-tests/support/ui";

const repoRoot = path.resolve(process.cwd(), "../..");
const screenshotDir = path.join(repoRoot, "temp", "20260716");

function screenshotTimestamp() {
  return new Date().toISOString().replace(/\D/g, "").slice(0, 14);
}

export class TapCanvasStudioPage {
  constructor(private page: Page) {}

  get projectEntry() {
    return this.page.getByTestId("tapcanvas-project-entry");
  }

  get projectsTenantRequired() {
    return this.page.getByTestId("tapcanvas-projects-tenant-required");
  }

  get studioWorkspace() {
    return this.page.getByTestId("tapcanvas-studio-workspace");
  }

  get tenantRequired() {
    return this.page.getByTestId("tapcanvas-studio-tenant-required");
  }

  get studioPortalRoot() {
    return this.studioWorkspace.getByTestId("tapcanvas-studio-portal-root");
  }

  get canvas() {
    return this.studioWorkspace.locator(".tapcanvas-studio-canvas");
  }

  projectRow(name: string) {
    return this.projectEntry.locator(".semi-table-row").filter({ hasText: name }).first();
  }

  chapterRow(title: string) {
    return this.projectEntry.locator(".tapcanvas-projects__chapters .semi-table-row").filter({ hasText: title }).first();
  }

  get reactFlowSurface() {
    return this.canvas.locator(".react-flow");
  }

  async gotoProjects() {
    await this.page.goto(workspacePath("/tapcanvas/projects"));
    await waitForRouteReady(this.page);
    await expect(this.projectEntry).toBeVisible();
  }

  async gotoProjectsWithoutTenant() {
    await this.page.goto(workspacePath("/tapcanvas/projects"));
    await waitForRouteReady(this.page);
    await expect(this.projectsTenantRequired).toBeVisible();
    await expect(this.projectEntry).toHaveCount(0);
  }

  async gotoStudio() {
    await this.page.goto(workspacePath("/tapcanvas/studio"));
    await waitForRouteReady(this.page);
    await expect(this.studioWorkspace).toBeVisible();
  }

  async gotoStudioWithoutTenant() {
    await this.page.goto(workspacePath("/tapcanvas/studio"));
    await waitForRouteReady(this.page);
    await expect(this.tenantRequired).toBeVisible();
    await expect(this.studioWorkspace).toHaveCount(0);
  }

  async impersonateFirstActiveTenant() {
    await this.page.goto(workspacePath("/platform/tenants"));
    await waitForRouteReady(this.page);
    await expect(this.page.getByTestId("platform-tenants-page")).toBeVisible();

    const action = this.page.locator('[data-testid^="tenant-impersonate-"]:not([disabled])').first();
    await expect(action).toBeVisible();
    const response = this.page.waitForResponse((item) =>
      /\/x\/linapro-tenant-core\/api\/v1\/platform\/tenants\/\d+\/impersonate$/.test(item.url()),
    );
    await action.click();
    await response;
    await expect(this.page.getByTestId("impersonation-banner")).toBeVisible();

    await expect.poll(async () => this.currentTenant()).not.toBeNull();
    return this.currentTenant();
  }

  async impersonateTenant(name: string) {
    await this.page.goto(workspacePath("/platform/tenants"));
    await waitForRouteReady(this.page);
    await expect(this.page.getByTestId("platform-tenants-page")).toBeVisible();

    const row = this.page.locator(".semi-table-row").filter({ hasText: name }).first();
    await expect(row).toBeVisible();
    const action = row.locator('[data-testid^="tenant-impersonate-"]:not([disabled])').first();
    await expect(action).toBeVisible();
    const response = this.page.waitForResponse((item) =>
      /\/x\/linapro-tenant-core\/api\/v1\/platform\/tenants\/\d+\/impersonate$/.test(item.url()),
    );
    await action.click();
    await response;
    await expect(this.page.getByTestId("impersonation-banner")).toBeVisible();
    await expect.poll(async () => this.currentTenant()).toMatchObject({ name });
    return this.currentTenant();
  }

  async exitImpersonation() {
    const exit = this.page.getByTestId("impersonation-exit");
    if (!(await exit.isVisible().catch(() => false))) return;
    const response = this.page.waitForResponse((item) =>
      /\/x\/linapro-tenant-core\/api\/v1\/platform\/tenants\/\d+\/end-impersonate$/.test(item.url()),
    );
    await exit.click();
    await response;
    await expect(this.page.getByTestId("impersonation-banner")).toHaveCount(0);
    await expect.poll(async () => this.currentTenant()).toBeNull();
  }

  async currentTenant() {
    return this.page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("linapro:web:tenant:v1") || "{}");
      const tenant = state.currentTenant;
      if (!tenant?.id || !tenant?.code || !tenant?.name) return null;
      return {
        code: String(tenant.code),
        id: Number(tenant.id),
        impersonated: state.impersonation?.active === true,
        name: String(tenant.name),
      };
    });
  }

  async assertChineseProjectContent() {
    await expect(this.projectEntry.getByRole("heading", { name: "项目" })).toBeVisible();
    await expect(this.projectEntry.getByText(/LinaPro 租户和角色数据权限/)).toBeVisible();
    await expect(this.projectEntry.getByRole("columnheader", { name: "项目名称" })).toBeVisible();
    await expect(this.projectEntry.getByRole("columnheader", { name: "章节数" })).toBeVisible();
    await expect(this.projectEntry.getByText(/plugin\.linapro-tapcanvas-studio/)).toHaveCount(0);
  }

  async createProject(name: string, description: string) {
    await this.projectEntry.getByRole("button", { name: /创建项目|Create Project/i }).click();
    const dialog = this.page.getByRole("dialog").last();
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/项目名称|Project Name/i).fill(name);
    await dialog.getByLabel(/描述|Description/i).fill(description);
    const response = this.page.waitForResponse((item) =>
      /\/x\/linapro-tapcanvas-studio\/api\/v1\/projects$/.test(item.url()) && item.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: /保存|Save/i }).click();
    await response;
    await expect(this.projectRow(name)).toBeVisible();
  }

  async updateProject(currentName: string, nextName: string, description: string) {
    const row = this.projectRow(currentName);
    await row.getByRole("button", { name: /编辑|Edit/i }).click();
    const dialog = this.page.getByRole("dialog").last();
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/项目名称|Project Name/i).fill(nextName);
    await dialog.getByLabel(/描述|Description/i).fill(description);
    const response = this.page.waitForResponse((item) =>
      /\/x\/linapro-tapcanvas-studio\/api\/v1\/projects\/[^/]+$/.test(item.url()) && item.request().method() === "PUT",
    );
    await dialog.getByRole("button", { name: /保存|Save/i }).click();
    await response;
    await expect(this.projectRow(nextName)).toBeVisible();
  }

  async openChapters(projectName: string) {
    await this.projectRow(projectName).getByRole("button", { name: /章节|Chapters/i }).click();
    await expect(this.projectEntry.locator(".tapcanvas-projects__chapters")).toBeVisible();
  }

  async createChapter(title: string, summary: string) {
    await this.projectEntry.getByRole("button", { name: /创建章节|Create Chapter/i }).click();
    const dialog = this.page.getByRole("dialog").last();
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/章节标题|Chapter Title/i).fill(title);
    await dialog.getByLabel(/摘要|Summary/i).fill(summary);
    const response = this.page.waitForResponse((item) =>
      /\/x\/linapro-tapcanvas-studio\/api\/v1\/projects\/[^/]+\/chapters$/.test(item.url()) && item.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: /保存|Save/i }).click();
    await response;
    await expect(this.chapterRow(title)).toBeVisible();
  }

  async updateChapter(currentTitle: string, nextTitle: string, summary: string) {
    await this.chapterRow(currentTitle).getByRole("button", { name: /编辑|Edit/i }).click();
    const dialog = this.page.getByRole("dialog").last();
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/章节标题|Chapter Title/i).fill(nextTitle);
    await dialog.getByLabel(/摘要|Summary/i).fill(summary);
    const status = dialog.getByLabel(/状态|Status/i);
    await status.click();
    await this.page.getByRole("option", { name: /策划中|Planning/i }).last().click();
    const response = this.page.waitForResponse((item) =>
      /\/x\/linapro-tapcanvas-studio\/api\/v1\/chapters\/[^/]+$/.test(item.url()) && item.request().method() === "PUT",
    );
    await dialog.getByRole("button", { name: /保存|Save/i }).click();
    await response;
    await expect(this.chapterRow(nextTitle)).toContainText(/策划中|Planning/i);
  }

  async moveChapterUp(title: string) {
    const response = this.page.waitForResponse((item) =>
      /\/x\/linapro-tapcanvas-studio\/api\/v1\/projects\/[^/]+\/chapters\/order$/.test(item.url()) && item.request().method() === "PUT",
    );
    await this.chapterRow(title).getByRole("button", { name: /上移|Move Up/i }).click();
    await response;
    await expect(this.projectEntry.locator(".tapcanvas-projects__chapters .semi-table-tbody .semi-table-row").first()).toContainText(title);
  }

  async deleteChapter(title: string) {
    await this.chapterRow(title).getByRole("button", { name: /删除|Delete/i }).click();
    const popconfirm = await waitForConfirmOverlay(this.page);
    const response = this.page.waitForResponse((item) =>
      /\/x\/linapro-tapcanvas-studio\/api\/v1\/chapters\/[^/]+$/.test(item.url()) && item.request().method() === "DELETE",
    );
    await popconfirm.getByRole("button", { name: /确\s*定|Confirm|OK|是/i }).click();
    await response;
    await expect(this.chapterRow(title)).toHaveCount(0);
  }

  async deleteProject(name: string) {
    await this.projectRow(name).getByRole("button", { name: /删除|Delete/i }).click();
    const popconfirm = await waitForConfirmOverlay(this.page);
    const response = this.page.waitForResponse((item) =>
      /\/x\/linapro-tapcanvas-studio\/api\/v1\/projects\/[^/]+$/.test(item.url()) && item.request().method() === "DELETE",
    );
    await popconfirm.getByRole("button", { name: /确\s*定|Confirm|OK|是/i }).click();
    await response;
    await expect(this.projectRow(name)).toHaveCount(0);
  }

  async assertCanvasReady() {
    await expect(this.studioWorkspace).toHaveClass(/tapcanvas-studio-root/);
    await expect(this.canvas).toBeVisible();
    await expect(this.reactFlowSurface).toBeVisible();
    await expect(this.reactFlowSurface.locator(".react-flow__renderer")).toBeVisible();
    await expect(this.studioPortalRoot).toHaveCount(1);
    await expect(this.studioWorkspace.getByText(/plugin\.linapro-tapcanvas-studio/)).toHaveCount(0);
  }

  async assertAccessMode(mode: "editable" | "read-only") {
    await expect(this.studioWorkspace).toHaveAttribute("data-access", mode);
    await expect(this.studioWorkspace.locator(".tc-canvas__visibility-panel"))
      .toHaveCount(mode === "editable" ? 1 : 0);
  }

  async assertStudioIsolation() {
    const rootState = await this.page.evaluate(() => {
      const mantineVariables = (element: HTMLElement) =>
        Array.from(element.style).filter((name) => name.startsWith("--mantine-"));
      return {
        bodyColorScheme: document.body.getAttribute("data-mantine-color-scheme"),
        bodyVariables: mantineVariables(document.body),
        htmlColorScheme: document.documentElement.getAttribute("data-mantine-color-scheme"),
        htmlVariables: mantineVariables(document.documentElement),
      };
    });
    expect(rootState).toEqual({
      bodyColorScheme: null,
      bodyVariables: [],
      htmlColorScheme: null,
      htmlVariables: [],
    });

    const escapedMantineElements = await this.page.locator('[class*="mantine-"]').evaluateAll(
      (elements) => elements.filter((element) => !element.closest(".tapcanvas-studio-root")).length,
    );
    expect(escapedMantineElements).toBe(0);
  }

  async assertNoLegacyAuthState() {
    const legacyAuthState = await this.page.evaluate(() => ({
      cookie: document.cookie.split(";").some((item) => item.trim().startsWith("tap_token=")),
      localToken: localStorage.getItem("tap_token"),
      localUser: localStorage.getItem("tap_user"),
      sessionToken: sessionStorage.getItem("tap_token"),
    }));
    expect(legacyAuthState).toEqual({
      cookie: false,
      localToken: null,
      localUser: null,
      sessionToken: null,
    });
  }

  async setHostColorScheme(colorScheme: "dark" | "light") {
    await this.page.evaluate((mode) => {
      document.body.setAttribute("theme-mode", mode);
      document.documentElement.classList.toggle("dark", mode === "dark");
    }, colorScheme);
    await expect(this.studioWorkspace).toHaveAttribute("data-mantine-color-scheme", colorScheme);
  }

  async assertReactSemiBoundary() {
    await expect(this.page.locator(".ant-btn, .ant-table, .vxe-table, [data-v-app]"))
      .toHaveCount(0);
  }

  async screenshot(name: string) {
    mkdirSync(screenshotDir, { recursive: true });
    const filePath = path.join(screenshotDir, `${screenshotTimestamp()}-${name}.png`);
    await this.page.screenshot({ path: filePath, fullPage: true });
    return filePath;
  }
}
