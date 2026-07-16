import { expect, test } from "@host-tests/fixtures/auth";
import { prepareSourcePluginsBaseline } from "@host-tests/fixtures/plugin";
import { workspacePath } from "@host-tests/fixtures/config";
import { waitForRouteReady } from "@host-tests/support/ui";

const routes = [
  { path: "/ai/providers", testId: "ai-provider-management-page", title: /渠道列表|Providers/i },
  { path: "/ai/models", testId: "ai-model-management-page", title: /模型列表|Models/i },
  { path: "/ai/tiers", testId: "ai-tier-management-page", title: /档位管理|AI Tiers/i },
  { path: "/ai/invocations", testId: "ai-invocation-logs-page", title: /调用日志|Request Logs/i },
] as const;

test.describe("TC-8 AI 源码插件 React 页面契约", () => {
  test.beforeAll(async () => {
    await prepareSourcePluginsBaseline(["linapro-ai-core"]);
  });

  for (const route of routes) {
    test(`TC-8: ${route.path} 使用 React/Semi 页面与双语资源`, async ({ adminPage }) => {
      await adminPage.goto(workspacePath(route.path));
      await waitForRouteReady(adminPage);
      const page = adminPage.getByTestId(route.testId);
      await expect(page).toBeVisible();
      await expect(page.getByText(route.title).first()).toBeVisible();
      await expect(page.getByText(/plugin\.linapro-ai-core/)).toHaveCount(0);
      await expect(page.locator(".ant-btn, .ant-table, .vxe-table")).toHaveCount(0);
    });
  }
});
