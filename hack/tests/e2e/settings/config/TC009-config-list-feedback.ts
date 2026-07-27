import { mkdir } from "node:fs/promises";
import path from "node:path";

import type { Page } from "@playwright/test";

import { test, expect } from "../../../fixtures/auth";
import { ConfigPage } from "../../../pages/ConfigPage";
import { MainLayout } from "../../../pages/MainLayout";

function configListResponse(data: unknown, status = 200) {
  return {
    contentType: "application/json",
    status,
    body: JSON.stringify(data),
  };
}

async function captureEvidence(page: Page, name: string) {
  const directory = path.resolve(process.cwd(), "..", "..", "temp", "20260725", "ui-audit-remediation");
  await mkdir(directory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  await page.screenshot({ fullPage: false, path: path.join(directory, `${timestamp}-${name}.png`) });
}

test.describe("TC-9 参数设置列表状态反馈", () => {
  test("TC-9a: 加载、空态、失败与重试互斥且显示本地化反馈", async ({ adminPage }) => {
    let releaseInitialRequest: (() => void) | undefined;
    let mode: "initial" | "failure" | "recovered" = "initial";
    let failedAttempts = 0;
    await adminPage.route("**/api/v1/config?*", async (route) => {
      if (mode === "initial") {
        await new Promise<void>((resolve) => { releaseInitialRequest = resolve; });
        await route.fulfill(configListResponse({ code: 0, data: { list: [], total: 0 } }));
        return;
      }
      if (mode === "failure" && failedAttempts++ < 4) {
        await route.fulfill(configListResponse({ code: 500, message: "simulated config query failure" }, 503));
        return;
      }
      await route.fulfill(configListResponse({ code: 0, data: { list: [], total: 0 } }));
    });

    const configPage = new ConfigPage(adminPage);
    await configPage.gotoForListFeedback();
    await expect(configPage.listFeedback.getByRole("status", { name: "正在加载" })).toBeVisible();
    await expect(configPage.listFeedback).not.toContainText("当前筛选条件下暂无参数。");
    await captureEvidence(adminPage, "config-list-loading-zh");

    releaseInitialRequest?.();
    await expect(configPage.listFeedback.getByText("当前筛选条件下暂无参数。")).toBeVisible();

    mode = "failure";
    await configPage.setViewportSize(390, 844);
    await configPage.fillSearchField("参数名称", "feedback failure");
    await configPage.refreshListForFeedback();
    const alert = configPage.listFeedback.getByRole("alert");
    await expect(alert).toContainText("无法加载所需数据。");
    await expect(configPage.listFeedback).toBeVisible();
    await expect(alert.getByRole("button", { name: "重试" })).toBeVisible();
    await captureEvidence(adminPage, "config-list-failed-zh");

    mode = "recovered";
    await alert.getByRole("button", { name: "重试" }).click();
    await expect(configPage.listFeedback.getByText("当前筛选条件下暂无参数。")).toBeVisible();

    await configPage.setViewportSize(1366, 768);
    const mainLayout = new MainLayout(adminPage);
    await mainLayout.switchLanguage("English");
    await expect(configPage.listFeedback.getByText("No parameters match the current filters.")).toBeVisible();
    await captureEvidence(adminPage, "config-list-empty-en");
  });
});
