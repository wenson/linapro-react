import { test } from "@host-tests/fixtures/auth";
import { prepareSourcePluginsBaseline } from "@host-tests/fixtures/plugin";

import { SmartCenterPage } from "../pages/SmartCenterPage";
import {
  createProviderWithModel,
  deleteProvider,
  withAdminApi,
} from "../support/ai-core-api";

test.describe("TC-10 AI 管理列表响应式布局", () => {
  test.beforeAll(async () => {
    await prepareSourcePluginsBaseline(["linapro-ai-core"]);
  });

  test("TC-10a: 渠道、模型、档位和调用日志在桌面与手机端均可查看和操作", async ({
    adminPage,
  }) => {
    await withAdminApi(async (api) => {
      const suffix = Date.now();
      const fixture = await createProviderWithModel(api, {
        modelName: `e2e-responsive-model-${suffix}`,
        providerName: `E2E Responsive Provider ${suffix}`,
      });
      const invocationPurpose = `e2e-responsive-invocation-${suffix}`;
      const invocationRoute =
        "**/x/linapro-ai-core/api/v1/ai/invocations**";
      await adminPage.route(invocationRoute, async (route) => {
        await route.fulfill({
          body: JSON.stringify({
            code: 0,
            data: {
              list: [
                {
                  capabilityMethod: "generate",
                  capabilityType: "text",
                  createdAt: Date.now(),
                  errorCode: "AI_CORE_PROVIDER_HTTP_ERROR",
                  errorSummary: "E2E redacted provider failure",
                  id: 1,
                  inputTokens: 11,
                  latencyMs: 123,
                  modelId: fixture.modelId,
                  modelName: fixture.modelName,
                  outputTokens: 7,
                  protocol: "openai",
                  providerId: fixture.providerId,
                  providerName: fixture.providerName,
                  purpose: invocationPurpose,
                  requestId: `e2e-responsive-request-${suffix}`,
                  sourcePluginId: "e2e-responsive",
                  status: "failed",
                  tenantId: 0,
                  thinkingEffort: "medium",
                  tierCode: "standard",
                  userId: 1,
                },
              ],
              total: 1,
            },
          }),
          contentType: "application/json",
          status: 200,
        });
      });
      try {
        const page = new SmartCenterPage(adminPage);

        await page.gotoProviders();
        await page.searchProvider(fixture.providerName);
        await page.assertResponsiveList({
          action: /编辑|Edit/i,
          evidenceName: "ui-remediation-ai-provider",
          fields: [/端点|Endpoints/i, /模型|Models/i, /状态|Status/i],
          headers: [/名称|Name/i, /模型|Models/i, /端点|Endpoints/i, /模型数|Model Count/i, /状态|Status/i, /操作|Actions/i],
          mobileListTestId: "ai-provider-mobile-list",
          recordText: fixture.providerName,
          tableTestId: "ai-provider-table",
        });

        await page.gotoModels();
        await page.assertModelManagementProjection({
          endpointUrl: fixture.openaiEndpointUrl,
          modelName: fixture.modelName,
          protocolLabel: /OpenAI/i,
          providerName: fixture.providerName,
        });
        await page.assertResponsiveList({
          action: /编辑|Edit/i,
          evidenceName: "ui-remediation-ai-model",
          fields: [/渠道|Provider/i, /协议|Protocol/i, /端点|Endpoint/i, /状态|Status/i],
          headers: [/模型名称|Model Name/i, /渠道|Provider/i, /协议|Protocol/i, /端点|Endpoint/i, /状态|Status/i, /操作|Actions/i],
          mobileListTestId: "ai-model-mobile-list",
          recordText: fixture.modelName,
          tableTestId: "ai-model-table",
        });

        await page.gotoTiers();
        await page.assertResponsiveList({
          action: /编辑|Edit/i,
          evidenceName: "ui-remediation-ai-tier",
          fields: [/描述|Description/i, /渠道|Provider/i, /模型|Model/i, /状态|Status/i, /最近测试|Last Test/i],
          headers: [/档位|Tier/i, /描述|Description/i, /渠道|Provider/i, /模型|Model/i, /状态|Status/i, /操作|Actions/i],
          mobileListTestId: "ai-tier-mobile-list",
          recordText: /基础|Basic/i,
          tableTestId: "ai-tier-table",
        });

        await page.gotoInvocations();
        await page.filterInvocationsByCapabilityAndPurpose(
          "text.generate",
          invocationPurpose,
        );
        await page.assertResponsiveList({
          action: /详情|Detail/i,
          evidenceName: "ui-remediation-ai-invocation",
          fields: [/调用方法|Invocation Method/i, /状态|Status/i, /渠道.*模型|Provider.*Model/i, /耗时|Latency/i, /创建时间|Created At/i],
          headers: [/用途|Purpose/i, /调用方法|Invocation Method/i, /协议|Protocol/i, /来源插件|Source Plugin/i, /档位|Tier/i, /状态|Status/i, /渠道|Provider/i],
          mobileListTestId: "ai-invocation-mobile-list",
          recordText: invocationPurpose,
          scrollToEnd: true,
          tableTestId: "ai-invocation-table",
        });
      } finally {
        await adminPage.unroute(invocationRoute).catch(() => {});
        await deleteProvider(api, fixture.providerId).catch(() => {});
      }
    });
  });
});
