import { mkdir } from "node:fs/promises";
import path from "node:path";

import type { Page } from "@playwright/test";

import { test, expect } from "../../fixtures/auth";
import { MainLayout } from "../../pages/MainLayout";

const tabStorageKey = "linapro:web:tabs:v1";

const routes = [
  "/dashboard/analytics",
  "/dashboard/workspace",
  "/system/user",
  "/system/role",
  "/system/menu",
  "/system/config",
  "/system/dict",
  "/system/file",
  "/system/job",
  "/system/job-group",
  "/system/job-log",
  "/system/plugin",
  "/about/api-docs",
  "/about/system-info",
  "/about",
] as const;

async function openTabScenario(page: Page, mainLayout: MainLayout) {
  await page.evaluate((key) => localStorage.removeItem(key), tabStorageKey);
  for (const [index, route] of routes.entries()) {
    await mainLayout.openWorkbenchRoute(route);
    const tabs = page.getByTestId("workbench-tabs");
    await expect(tabs).toBeVisible();
    await expect
      .poll(async () => await tabs.locator('[data-tab-item="true"]').count())
      .toBe(index + 1);
  }
}

async function captureEvidence(page: Page, name: string) {
  const screenshotDirectory = path.resolve(
    process.cwd(),
    "..",
    "..",
    "temp",
    "20260725",
    "ui-audit-remediation",
  );
  await mkdir(screenshotDirectory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  await page.screenshot({
    fullPage: false,
    path: path.join(screenshotDirectory, `${timestamp}-${name}.png`),
  });
}

test.describe("TC-8 标签栏溢出", () => {
  test("TC-8a: 连续打开十五页时标签栏单行滚动且保持键盘可达", async ({
    adminPage,
    mainLayout,
  }) => {
    await adminPage.setViewportSize({ height: 900, width: 1366 });
    await openTabScenario(adminPage, mainLayout);

    const tabs = adminPage.getByTestId("workbench-tabs");
    const tabItems = tabs.locator('[data-tab-item="true"]');
    await expect(tabItems).toHaveCount(15);
    const geometry = await tabs.evaluate((element) => ({
      clientWidth: element.clientWidth,
      height: element.getBoundingClientRect().height,
      scrollWidth: element.scrollWidth,
    }));
    expect(geometry.scrollWidth).toBeGreaterThan(geometry.clientWidth);
    expect(geometry.height).toBeLessThanOrEqual(50);

    for (const label of await tabs.locator(".tab-label span").all()) {
      await expect(label).toHaveCSS("white-space", "nowrap");
    }

    const lastTab = tabItems.last();
    const tabButton = lastTab.locator("button.tab-label");
    const closeButton = lastTab.locator("button").nth(1);
    await tabButton.focus();
    await expect(tabButton).toBeFocused();
    await adminPage.keyboard.press("Tab");
    await expect(closeButton).toBeFocused();

    await captureEvidence(adminPage, "tab-strip-overflow");
  });

  test("TC-8b: 中英文和明暗主题下标签文本、焦点与对比度保持可读", async ({
    adminPage,
    mainLayout,
  }) => {
    await adminPage.setViewportSize({ height: 900, width: 1366 });
    await mainLayout.switchLanguage("简体中文");
    await mainLayout.ensureThemeMode("light");
    await openTabScenario(adminPage, mainLayout);

    const tabs = adminPage.getByTestId("workbench-tabs");
    const activeLabel = tabs.locator("button.tab-label").last();
    await expect(activeLabel).toHaveText("关于项目");
    await activeLabel.focus();
    await expect(activeLabel).toBeFocused();
    await captureEvidence(adminPage, "tab-strip-zh-light");

    await mainLayout.openWorkbenchRoute("/system/plugin");
    await mainLayout.switchLanguage("English");
    await expect(mainLayout.tabTitle("Plugins")).toBeVisible();
    await expect(mainLayout.tabTitle("About")).toBeVisible();
    await expect(adminPage.getByText("简体中文", { exact: true })).toHaveCount(0);
    await captureEvidence(adminPage, "tab-strip-en-light");

    await mainLayout.ensureThemeMode("dark");
    await expect.poll(async () => await tabs.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
    await captureEvidence(adminPage, "tab-strip-en-dark");

    await mainLayout.switchLanguage("简体中文");
    await expect(mainLayout.tabTitle("插件")).toBeVisible();
    await expect(mainLayout.tabTitle("关于项目")).toBeVisible();
    await expect(adminPage.getByText("English", { exact: true })).toHaveCount(0);
    await captureEvidence(adminPage, "tab-strip-zh-dark");
  });
});
