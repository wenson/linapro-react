import { expect, test } from "@host-tests/fixtures/auth";
import { prepareSourcePluginsBaseline } from "@host-tests/fixtures/plugin";
import { MainLayout } from "@host-tests/pages/MainLayout";
import { SmartCenterPage } from "../pages/SmartCenterPage";

function response(data: unknown, status = 200) {
  return { body: JSON.stringify(data), contentType: "application/json", status };
}

test.describe("TC-9 智能中心列表状态反馈", () => {
  test.beforeAll(async () => {
    await prepareSourcePluginsBaseline(["linapro-ai-core"]);
  });

  test("TC-9a: 渠道列表提供互斥状态、单一主操作和双语失败重试", async ({ adminPage }) => {
    let releaseInitialRequest: (() => void) | undefined;
    let mode: "initial" | "failure" | "recovered" = "initial";
    await adminPage.route("**/x/linapro-ai-core/api/v1/ai/providers?*", async (route) => {
      if (mode === "initial") {
        await new Promise<void>((resolve) => { releaseInitialRequest = resolve; });
        await route.fulfill(response({ code: 0, data: { list: [], total: 0 } }));
        return;
      }
      if (mode === "failure") {
        await route.fulfill(response({ code: 500, message: "simulated provider query failure" }, 503));
        return;
      }
      await route.fulfill(response({ code: 0, data: { list: [], total: 0 } }));
    });

    const smartCenter = new SmartCenterPage(adminPage);
    await smartCenter.gotoProvidersForListFeedback();
    const feedback = smartCenter.providerListFeedback();
    await expect(feedback.getByTestId("ai-list-loading")).toBeVisible();
    await expect(feedback.getByText("当前没有可显示的记录。")).toHaveCount(0);

    releaseInitialRequest?.();
    await expect(feedback.getByText("当前没有可显示的记录。")).toBeVisible();
    await expect(adminPage.getByRole("button", { name: "新增渠道" })).toHaveCount(1);
    await smartCenter.captureEvidence("TC009-provider-empty-zh");

    mode = "failure";
    await smartCenter.gotoProvidersForListFeedback();
    const alert = feedback.getByTestId("ai-list-failed");
    await expect(alert).toContainText("无法加载所需数据。");
    await expect(alert.getByRole("button", { name: "重试" })).toBeVisible();
    await smartCenter.captureEvidence("TC009-provider-failed-zh");

    mode = "recovered";
    await alert.getByRole("button", { name: "重试" }).click();
    await expect(feedback.getByText("当前没有可显示的记录。")).toBeVisible();

    const mainLayout = new MainLayout(adminPage);
    await mainLayout.switchLanguage("English");
    await expect(feedback.getByText("No records to display.")).toBeVisible();
    await expect(adminPage.getByRole("button", { name: "Add Provider" })).toHaveCount(1);
    await smartCenter.captureEvidence("TC009-provider-empty-en");
  });
});
