import { test, expect } from "../../fixtures/auth";
import { LayoutAuditPage } from "../../pages/LayoutAuditPage";
import { ProfilePage } from "../../pages/ProfilePage";

test.describe("TC-1 个人资料加载反馈", () => {
  test("TC-1a: 手机端先显示结构化骨架且资料只请求一次", async ({ adminPage }) => {
    await adminPage.setViewportSize({ height: 844, width: 390 });
    const profile = new ProfilePage(adminPage);
    const layout = new LayoutAuditPage(adminPage);

    const loading = await profile.gotoAndObserveLoading();
    await expect(profile.loadingSkeleton).toBeVisible();
    await profile.capture("ui-remediation-390x844-zh-CN-profile-loading-e2e");
    await loading.waitForLoaded();

    await expect(profile.profilePanel).toBeVisible();
    expect(loading.requestCount()).toBe(1);
    await layout.expectNoHorizontalOverflow();
    await profile.capture("ui-remediation-390x844-zh-CN-profile-loaded-e2e");
  });
});
