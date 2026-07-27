import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import AiInvocationLogs from "../../../lina-plugins/linapro-ai-core/frontend/pages/invocation-logs";
import AiModelManagement from "../../../lina-plugins/linapro-ai-core/frontend/pages/model-management";
import AiProviderManagement from "../../../lina-plugins/linapro-ai-core/frontend/pages/provider-management";
import AiTierManagement from "../../../lina-plugins/linapro-ai-core/frontend/pages/tier-management";
import NoticeManagement from "../../../lina-plugins/linapro-content-notice/frontend/pages/notice-management";
import DemoSourcePage from "../../../lina-plugins/linapro-demo-source/frontend/pages/sidebar-entry";
import LoginLogManagement from "../../../lina-plugins/linapro-monitor-loginlog/frontend/pages/loginlog-management";
import OnlineUserPage from "../../../lina-plugins/linapro-monitor-online/frontend/pages/online-user";
import OperLogManagement from "../../../lina-plugins/linapro-monitor-operlog/frontend/pages/operlog-management";
import DeptManagement from "../../../lina-plugins/linapro-org-core/frontend/pages/dept-management";
import PostManagement from "../../../lina-plugins/linapro-org-core/frontend/pages/post-management";
import TenantManagement from "../../../lina-plugins/linapro-tenant-core/frontend/pages/tenant-management";
import type { PluginHostApi, PluginHostContextValue } from "#/plugin-ui/plugin-host-context";
import { LinaPluginHostProvider } from "#/plugin-ui/plugin-host-provider";

const now = 1_720_000_000_000;
const tenant = { code: "uir-tenant", createdAt: now, id: 11, name: "UIR Tenant", status: "active" };
const dept = { ancestors: "0", code: "uir-dept", createdAt: now, email: "", id: 21, leader: 0, name: "UIR Department", orderNum: 1, parentId: 0, phone: "", remark: "", status: 1 };
const post = { code: "uir-post", createdAt: now, deptId: 21, id: 31, name: "UIR Post", remark: "", sort: 1, status: 1 };
const notice = { content: "Body", createdAt: now, createdBy: 1, createdByName: "Admin", fileIds: "", id: 41, remark: "", status: 1, title: "UIR Notice", type: 1, updatedAt: now, updatedBy: 1 };
const online = { browser: "Browser", deptName: "UIR Department", ip: "127.0.0.1", loginTime: now, os: "OS", tokenId: "uir-token", username: "uir-online-user" };
const operLog = { costTime: 12, errorMsg: "", id: 51, jsonResult: "{}", method: "run", operIp: "127.0.0.1", operName: "Admin", operParam: "{}", operSummary: "Updated", operTime: now, operType: "1", operUrl: "/uir", requestMethod: "POST", status: 1, title: "UIR Operation" };
const loginLog = { browser: "Browser", id: 61, ip: "127.0.0.1", loginTime: now, msg: "Success", os: "OS", status: 1, userName: "uir-login-user" };
const demoRecord = { attachmentName: "", content: "UIR Content", createdAt: now, hasAttachment: 0, id: 71, title: "UIR Demo Record", updatedAt: now };
const provider = { createdAt: now, enabled: 1, enabledEndpointCount: 1, enabledModelCount: 1, endpointCount: 1, endpoints: [], id: 81, modelCount: 1, models: [], name: "UIR Provider", remark: "", updatedAt: now, websiteUrl: "https://example.com" };
const model = { createdAt: now, enabled: 1, endpointBaseUrl: "https://api.example.com", endpointId: 1, id: 91, modelName: "uir-model", protocol: "openai", providerId: 81, providerName: "UIR Provider", source: "manual", updatedAt: now };
const tier = { binding: { enabled: 1, modelId: 91, modelName: "uir-model", protocol: "openai", providerId: 81, providerName: "UIR Tier Provider" }, capabilityMethod: "generate", capabilityType: "text", code: "basic", defaultEffort: "low", description: "UIR tier", displayName: "Basic", enabled: 1, id: 101, lastTestAt: now, lastTestErrorSummary: "", lastTestLatencyMs: 18, lastTestStatus: "success", sortOrder: 1, updatedAt: now };
const invocation = { assetSummaryJson: "{}", capabilityMethod: "generate", capabilityType: "text", createdAt: now, errorCode: "", errorSummary: "", id: 111, inputTokens: 10, latencyMs: 20, metadataSummaryJson: "{}", modelId: 91, modelName: "uir-model", operationSummaryJson: "{}", outputTokens: 5, protocol: "openai", providerId: 81, providerName: "UIR Provider", purpose: "UIR Invocation", requestId: "uir-request", sourcePluginId: "test", status: "success", tenantId: 1, thinkingEffort: "low", tierCode: "basic", userId: 1 };

function listResponse(pluginId: string, path: string): unknown {
  if (pluginId === "linapro-tenant-core" && path.startsWith("platform/tenants")) return { list: [tenant], total: 1 };
  if (pluginId === "linapro-org-core" && path.startsWith("dept")) return { list: [dept] };
  if (pluginId === "linapro-org-core" && path.startsWith("post/dept-tree")) return { list: [] };
  if (pluginId === "linapro-org-core" && path.startsWith("post")) return { list: [post], total: 1 };
  if (pluginId === "linapro-content-notice" && path.startsWith("notice")) return { list: [notice], total: 1 };
  if (pluginId === "linapro-monitor-online" && path.startsWith("monitor/online/list")) return { items: [online], total: 1 };
  if (pluginId === "linapro-monitor-operlog" && path.startsWith("operlog")) return { items: [operLog], total: 1 };
  if (pluginId === "linapro-monitor-loginlog" && path.startsWith("loginlog")) return { items: [loginLog], total: 1 };
  if (pluginId === "linapro-demo-source" && path.includes("/records")) return { list: [demoRecord], total: 1 };
  if (pluginId === "linapro-ai-core" && path.startsWith("ai/providers")) return { list: [provider], total: 1 };
  if (pluginId === "linapro-ai-core" && path.startsWith("ai/models")) return { list: [model], total: 1 };
  if (pluginId === "linapro-ai-core" && path.startsWith("ai/tiers")) return { list: [tier] };
  if (pluginId === "linapro-ai-core" && path.startsWith("ai/invocations")) return { list: [invocation], total: 1 };
  throw new Error(`Unexpected plugin request: ${pluginId}/${path}`);
}

function hostValue(): PluginHostContextValue {
  const api: PluginHostApi = {
    plugin: vi.fn(async (pluginId: string, path: string) => listResponse(pluginId, path)) as PluginHostApi["plugin"],
    pluginBlob: vi.fn(async () => new Blob()) as PluginHostApi["pluginBlob"],
    request: vi.fn(async () => ({ list: [{ label: "Enabled", value: "1" }] })) as PluginHostApi["request"],
    requestBlob: vi.fn(async () => new Blob()) as PluginHostApi["requestBlob"],
  };
  return {
    api,
    locale: "en-US",
    permissions: new Set(["*"]),
    t: (key) => key,
    tenant: { code: "platform", id: 1, name: "Platform" },
    user: { id: 1, name: "Admin" },
  };
}

async function expectResponsiveRecord(
  page: ReactNode,
  desktopTestId: string,
  mobileTestId: string,
  rowText: string,
  actionName: string,
) {
  render(<LinaPluginHostProvider value={hostValue()}>{page}</LinaPluginHostProvider>);
  const desktop = await screen.findByTestId(desktopTestId);
  const mobile = await screen.findByTestId(mobileTestId);
  await waitFor(() => expect(within(desktop).getByText(rowText)).toBeVisible());
  expect(within(mobile).getByText(rowText)).toBeVisible();
  expect(within(desktop).getByRole("button", { name: actionName })).toBeEnabled();
  expect(within(mobile).getByRole("button", { name: actionName })).toBeEnabled();
}

describe("plugin responsive list contracts", () => {
  it("shares tenant data, permissions and edit actions", async () => {
    await expectResponsiveRecord(<TenantManagement />, "platform-tenants-table", "platform-tenants-mobile-list", tenant.name, "pages.common.edit");
  });

  it("shares department data, permissions and edit actions", async () => {
    await expectResponsiveRecord(<DeptManagement />, "org-dept-table", "org-dept-mobile-list", dept.name, "pages.common.edit");
  });

  it("shares post data, permissions and edit actions", async () => {
    await expectResponsiveRecord(<PostManagement />, "org-post-table", "org-post-mobile-list", post.name, "pages.common.edit");
  });

  it("shares notice data, permissions and preview actions", async () => {
    await expectResponsiveRecord(<NoticeManagement />, "notice-table", "notice-mobile-list", notice.title, "plugin.linapro-content-notice.common.preview");
  });

  it("shares online-user data, permissions and force-logout actions", async () => {
    await expectResponsiveRecord(<OnlineUserPage />, "online-user-table", "online-user-mobile-list", online.username, "plugin.linapro-monitor-online.page.actions.forceLogout");
  });

  it("shares operation-log data, permissions and detail actions", async () => {
    await expectResponsiveRecord(<OperLogManagement />, "operlog-table", "operlog-mobile-list", operLog.title, "pages.common.detail");
  });

  it("shares login-log data, permissions and detail actions", async () => {
    await expectResponsiveRecord(<LoginLogManagement />, "loginlog-table", "loginlog-mobile-list", loginLog.userName, "pages.common.detail");
  });

  it("shares source-plugin data, permissions and edit actions", async () => {
    await expectResponsiveRecord(<DemoSourcePage />, "linapro-demo-source-record-table", "linapro-demo-source-mobile-list", demoRecord.title, "pages.common.edit");
  });

  it("shares AI provider data, permissions and edit actions", async () => {
    await expectResponsiveRecord(<AiProviderManagement />, "ai-provider-table", "ai-provider-mobile-list", provider.name, "pages.common.edit");
  });

  it("shares AI model data, permissions and edit actions", async () => {
    await expectResponsiveRecord(<AiModelManagement />, "ai-model-table", "ai-model-mobile-list", model.modelName, "pages.common.edit");
  });

  it("shares AI tier data, permissions and edit actions", async () => {
    await expectResponsiveRecord(<AiTierManagement />, "ai-tier-table", "ai-tier-mobile-list", tier.binding.providerName, "pages.common.edit");
  });

  it("clears old tier rows and ignores a late response after capability switches", async () => {
    let releaseImage!: (value: unknown) => void;
    const imageResponse = new Promise<unknown>((resolve) => { releaseImage = resolve; });
    const value = hostValue();
    value.api.plugin = vi.fn(async (_pluginId: string, path: string) => {
      if (path.includes("capabilityType=image")) return imageResponse;
      if (path.includes("capabilityType=audio")) return {
        list: [{ ...tier, binding: { ...tier.binding, providerName: "UIR Audio Provider" }, capabilityType: "audio" }],
      };
      return { list: [tier] };
    }) as PluginHostApi["plugin"];

    render(<LinaPluginHostProvider value={value}><AiTierManagement /></LinaPluginHostProvider>);
    expect((await screen.findAllByText("UIR Tier Provider")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByTestId("ai-tier-capability-tab-image"));
    expect(screen.queryAllByText("UIR Tier Provider")).toHaveLength(0);
    expect(screen.getByTestId("ai-tier-list-feedback")).toHaveAttribute("data-state", "loading");

    fireEvent.click(screen.getByTestId("ai-tier-capability-tab-audio"));
    expect((await screen.findAllByText("UIR Audio Provider")).length).toBeGreaterThan(0);
    releaseImage({
      list: [{ ...tier, binding: { ...tier.binding, providerName: "Late Image Provider" }, capabilityType: "image" }],
    });
    await waitFor(() => expect(screen.queryAllByText("Late Image Provider")).toHaveLength(0));
    expect(screen.getAllByText("UIR Audio Provider").length).toBeGreaterThan(0);
  });

  it("shares AI invocation data, permissions and detail actions", async () => {
    await expectResponsiveRecord(<AiInvocationLogs />, "ai-invocation-table", "ai-invocation-mobile-list", invocation.purpose, "plugin.linapro-ai-core.common.detail");
  });
});
