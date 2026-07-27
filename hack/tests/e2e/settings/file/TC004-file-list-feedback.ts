import { mkdir } from "node:fs/promises";
import path from "node:path";

import type { Page } from "@playwright/test";

import { test, expect } from "../../../fixtures/auth";
import { FilePage } from "../../../pages/FilePage";
import { MainLayout } from "../../../pages/MainLayout";

function response(data: unknown, status = 200) {
  return { body: JSON.stringify(data), contentType: "application/json", status };
}

async function captureEvidence(page: Page, name: string) {
  const directory = path.resolve(process.cwd(), "..", "..", "temp", "20260725", "ui-audit-remediation");
  await mkdir(directory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  await page.screenshot({ fullPage: false, path: path.join(directory, `${timestamp}-${name}.png`) });
}

test.describe("TC-4 文件列表状态反馈", () => {
  test("TC-4a: 加载、失败重试和英文空结果均提供可访问反馈", async ({ adminPage }) => {
    let releaseInitialRequest: (() => void) | undefined;
    let mode: "initial" | "failure" | "recovered" = "initial";
    let failureAttempts = 0;
    await adminPage.route("**/api/v1/file/scenes", (route) => route.fulfill(response({ code: 0, data: { list: [] } })));
    await adminPage.route("**/api/v1/file/suffixes", (route) => route.fulfill(response({ code: 0, data: { list: [] } })));
    await adminPage.route("**/api/v1/file?*", async (route) => {
      if (mode === "initial") {
        await new Promise<void>((resolve) => { releaseInitialRequest = resolve; });
        await route.fulfill(response({ code: 0, data: { list: [], total: 0 } }));
        return;
      }
      if (mode === "failure" && failureAttempts++ < 4) {
        await route.fulfill(response({ code: 500, message: "simulated file query failure" }, 503));
        return;
      }
      await route.fulfill(response({ code: 0, data: { list: [], total: 0 } }));
    });

    const filePage = new FilePage(adminPage);
    await filePage.gotoForListFeedback();
    await expect(filePage.listFeedback.getByRole("status", { name: "正在加载" })).toBeVisible();
    await captureEvidence(adminPage, "file-list-loading-zh");

    releaseInitialRequest?.();
    await expect(filePage.listFeedback).toHaveAttribute("data-state", "empty");

    mode = "failure";
    await filePage.setViewportSize(390, 844);
    await filePage.gotoForListFeedback();
    const alert = filePage.listFeedback;
    await expect(alert).toBeVisible();
    await expect(alert).toHaveAttribute("data-state", "error");
    await expect(alert).toContainText("无法加载所需数据。");
    await expect(alert.getByRole("button", { name: "重试" })).toBeVisible();
    await captureEvidence(adminPage, "file-list-failed-zh");

    mode = "recovered";
    await alert.getByRole("button", { name: "重试" }).click();
    await expect(filePage.listFeedback).toHaveAttribute("data-state", "empty");

    await filePage.setViewportSize(1366, 768);
    const mainLayout = new MainLayout(adminPage);
    await mainLayout.switchLanguage("English");
    await expect(filePage.root.getByRole("heading", { name: "File management" })).toBeVisible();
    await expect(filePage.listFeedback).toContainText("No records to display.");
    await captureEvidence(adminPage, "file-list-empty-en");
  });
});
