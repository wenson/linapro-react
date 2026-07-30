import { test, expect } from "../../../fixtures/auth";
import { ConfigPage } from "../../../pages/ConfigPage";
import { captureEvidence } from "../../../support/evidence";

test.describe("TC-10 参数设置宽屏布局", () => {
  test("TC-10a: 宽屏只保留正常页面边距", async ({ adminPage }) => {
    await adminPage.setViewportSize({ height: 1152, width: 2048 });
    const configPage = new ConfigPage(adminPage);
    await configPage.goto();

    await expect(configPage.heading).toHaveText("参数配置");
    const gutters = await configPage.getHorizontalGutters();
    expect(gutters.left).toBeGreaterThanOrEqual(20);
    expect(gutters.left).toBeLessThanOrEqual(32);
    expect(gutters.right).toBeGreaterThanOrEqual(20);
    expect(gutters.right).toBeLessThanOrEqual(32);

    await captureEvidence(adminPage, "config-wide-page-layout-2048x1152");
  });
});
