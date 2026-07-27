import { mkdir } from "node:fs/promises";
import path from "node:path";

import type { Page } from "@playwright/test";

import { test, expect } from "../../../fixtures/auth";
import { MainLayout } from "../../../pages/MainLayout";
import { MessagePage } from "../../../pages/MessagePage";

function response(data: unknown, status = 200) {
  return { body: JSON.stringify(data), contentType: "application/json", status };
}

async function captureEvidence(page: Page, name: string) {
  const directory = path.resolve(process.cwd(), "..", "..", "temp", "20260725", "ui-audit-remediation");
  await mkdir(directory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  await page.screenshot({ fullPage: false, path: path.join(directory, `${timestamp}-${name}.png`) });
}

test.describe("TC-1 我的消息列表状态反馈", () => {
  test("TC-1a: 加载、消息来源空态、失败重试与英文翻译可用", async ({ adminPage }) => {
    let releaseInitialRequest: (() => void) | undefined;
    let mode: "initial" | "failure" | "recovered" = "initial";
    let failureAttempts = 0;
    await adminPage.route("**/api/v1/user/message/count", (route) => route.fulfill(response({ code: 0, data: { count: 0 } })));
    await adminPage.route("**/api/v1/user/message?*", async (route) => {
      if (mode === "initial") {
        await new Promise<void>((resolve) => { releaseInitialRequest = resolve; });
        await route.fulfill(response({ code: 0, data: { list: [], total: 0 } }));
        return;
      }
      if (mode === "failure" && failureAttempts++ < 4) {
        await route.fulfill(response({ code: 500, message: "simulated message query failure" }, 503));
        return;
      }
      await route.fulfill(response({ code: 0, data: { list: [], total: 0 } }));
    });

    const messagePage = new MessagePage(adminPage);
    await messagePage.gotoForListFeedback();
    await expect(messagePage.list.getByRole("status", { name: "正在加载" })).toBeVisible();
    await expect(messagePage.list).not.toContainText("暂无消息");
    await captureEvidence(adminPage, "message-list-loading-zh");

    releaseInitialRequest?.();
    await expect(messagePage.list).toContainText("工作台和已启用插件的消息会显示在这里。");

    mode = "failure";
    await messagePage.setViewportSize(390, 844);
    await messagePage.gotoForListFeedback();
    const alert = messagePage.list.getByRole("alert");
    await expect(alert).toContainText("无法加载所需数据。");
    await expect(alert).toBeVisible();
    await expect(alert.getByRole("button", { name: "重试" })).toBeVisible();
    await captureEvidence(adminPage, "message-list-failed-zh");

    mode = "recovered";
    await alert.getByRole("button", { name: "重试" }).click();
    await expect(messagePage.list).toContainText("工作台和已启用插件的消息会显示在这里。");

    await messagePage.setViewportSize(1366, 768);
    const mainLayout = new MainLayout(adminPage);
    await mainLayout.switchLanguage("English");
    await expect(messagePage.list).toContainText("Messages from the workbench and enabled plugins appear here.");
    await captureEvidence(adminPage, "message-list-empty-en");
  });
});
