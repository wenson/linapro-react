import { mkdirSync } from "node:fs";
import path from "node:path";

import { workspacePath } from "@host-tests/fixtures/config";
import {
  expect,
  type Locator,
  type Page,
} from "@host-tests/support/playwright";
import {
  closeDialogWithEscape,
  waitForBusyIndicatorsToClear,
  waitForDialogReady,
  waitForRouteReady,
  waitForTableReady,
} from "@host-tests/support/ui";

const repoRoot = path.resolve(process.cwd(), "../..");
const legacyChineseProviderPattern = new RegExp("\u4f9b\u5e94\u5546");
const tierCapabilityTypeLabels: Record<string, { en: string; zh: string }> = {
  audio: { en: "Audio", zh: "音频" },
  document: { en: "Document", zh: "文档理解" },
  embedding: { en: "Embedding", zh: "向量嵌入" },
  image: { en: "Image", zh: "图像" },
  safety: { en: "Safety", zh: "安全审核" },
  text: { en: "Text", zh: "文本" },
  video: { en: "Video", zh: "视频" },
  vision: { en: "Vision", zh: "视觉理解" },
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function screenshotName(name: string, timestamp: string) {
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${timestamp}-${safeName || "screenshot"}.png`;
}

function screenshotTimestamp() {
  return new Date().toISOString().replace(/\D/g, "").slice(0, 14);
}

function localDateTime(value: Date) {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export class SmartCenterPage {
  constructor(private page: Page) {}

  private get dialog() {
    return this.page.locator('[role="dialog"]:visible').last();
  }

  private providerPage() {
    return this.page.getByTestId("ai-provider-management-page");
  }

  private providerTable() {
    return this.page.getByTestId("ai-provider-table");
  }

  private modelTable() {
    return this.page.getByTestId("ai-model-table");
  }

  private tierTable() {
    return this.page.getByTestId("ai-tier-table");
  }

  private invocationTable() {
    return this.page.getByTestId("ai-invocation-table");
  }

  private tableRow(table: Locator, text: string | RegExp) {
    return table.getByRole("row").filter({ hasText: text }).first();
  }

  private async selectOption(
    scope: Locator,
    label: string | RegExp,
    option: string | RegExp,
  ) {
    const control = scope.getByRole("combobox", { name: label }).first();
    await control.click();
    const listbox = this.page.getByRole("listbox").last();
    await expect(listbox).toBeVisible();
    await listbox.getByRole("option", { name: option }).first().click();
    await expect(control).toContainText(option);
    await expect(control).toHaveAttribute("aria-expanded", "false");
  }

  private async waitForToast(text?: string | RegExp) {
    const toast = text
      ? this.page.getByRole("alert").filter({ hasText: text }).last()
      : this.page.getByRole("alert").last();
    await expect(toast).toBeVisible();
  }

  async gotoProviders() {
    await this.page.goto(workspacePath("/ai/providers"));
    await waitForRouteReady(this.page);
    await expect(this.providerPage()).toBeVisible();
    await waitForTableReady(this.page, '[data-testid="ai-provider-table"]');
  }

  async gotoProvidersForListFeedback() {
    await this.page.goto(workspacePath("/ai/providers"), {
      waitUntil: "domcontentloaded",
    });
    await expect(this.providerPage()).toBeVisible();
  }

  providerListFeedback() {
    return this.providerTable();
  }

  async gotoModels() {
    await this.page.goto(workspacePath("/ai/models"));
    await waitForRouteReady(this.page);
    await expect(this.page.getByTestId("ai-model-management-page")).toBeVisible();
    await waitForTableReady(this.page, '[data-testid="ai-model-table"]');
  }

  async gotoTiers() {
    await this.page.goto(workspacePath("/ai/tiers"));
    await waitForRouteReady(this.page);
    await expect(this.page.getByTestId("ai-tier-management-page")).toBeVisible();
    await waitForTableReady(this.page, '[data-testid="ai-tier-table"]');
  }

  async gotoInvocations() {
    await this.page.goto(workspacePath("/ai/invocations"));
    await waitForRouteReady(this.page);
    await expect(this.page.getByTestId("ai-invocation-logs-page")).toBeVisible();
    await waitForTableReady(this.page, '[data-testid="ai-invocation-table"]');
  }

  async assertProviderPageWithoutTabs() {
    await expect(this.providerPage()).toBeVisible();
    await expect(this.providerPage().getByRole("tab")).toHaveCount(0);
    await expect(
      this.page.getByTestId("ai-provider-management-tabs"),
    ).toHaveCount(0);
  }

  async openProviderManagementTab() {
    await this.gotoProviders();
  }

  async openModelManagementTab() {
    await this.gotoModels();
  }

  async assertTierThinkingEffortLabel() {
    await expect(
      this.page.getByText(/Default Thinking Effort|默认 Thinking Effort/i),
    ).toHaveCount(0);
  }

  async assertInvocationMethodLabelSingleLine() {
    const label = this.page
      .getByText(/调用方法|Invocation Method/i, { exact: true })
      .first();
    await expect(label).toBeVisible();
    await expect(label).toHaveCSS("white-space", /nowrap|normal/);
  }

  async assertResponsiveList(input: {
    action: RegExp;
    evidenceName: string;
    fields: RegExp[];
    headers: RegExp[];
    mobileListTestId: string;
    recordText: RegExp | string;
    scrollToEnd?: boolean;
    tableTestId: string;
  }) {
    await this.page.setViewportSize({ height: 768, width: 1366 });
    await waitForTableReady(this.page, `[data-testid="${input.tableTestId}"]`);
    const table = this.page.getByTestId(input.tableTestId);
    const mobileList = this.page.getByTestId(input.mobileListTestId);
    await expect(table).toBeVisible();
    await expect(mobileList).toBeHidden();
    for (const header of input.headers) {
      await expect(
        table.locator(".semi-table-row-head, th", { hasText: header }).first(),
      ).toBeVisible();
    }
    const tableBox = await table.boundingBox();
    expect(tableBox).not.toBeNull();
    expect(tableBox!.x).toBeGreaterThanOrEqual(0);
    expect(tableBox!.x + tableBox!.width).toBeLessThanOrEqual(1367);
    if (input.scrollToEnd) {
      const scrollBody = table.locator(".semi-table-body").first();
      await scrollBody.evaluate((node) => {
        node.scrollLeft = node.scrollWidth;
      });
    }
    await expect(
      table.getByRole("button", { name: input.action }).first(),
    ).toBeVisible();
    await this.captureEvidence(`${input.evidenceName}-1366x768-desktop`);

    await this.page.setViewportSize({ height: 844, width: 390 });
    await expect(table).toBeHidden();
    await expect(mobileList).toBeVisible();
    const card = mobileList
      .locator(".mobile-record-card")
      .filter({ hasText: input.recordText })
      .first();
    await expect(card).toBeVisible();
    for (const field of input.fields) {
      await expect(card.getByText(field).first()).toBeVisible();
    }
    await expect(card.getByRole("button", { name: input.action }).first()).toBeVisible();
    await expect
      .poll(async () =>
        this.page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        })),
      )
      .toEqual({ clientWidth: 390, scrollWidth: 390 });
    await this.captureEvidence(`${input.evidenceName}-390x844-mobile`);
    await this.page.setViewportSize({ height: 768, width: 1366 });
  }

  async openCreateProvider() {
    await this.providerPage()
      .getByRole("button", { name: /新增渠道|Add Provider/i })
      .click();
    await waitForDialogReady(this.dialog);
  }

  async openCreateModel() {
    await this.page
      .getByTestId("ai-model-management-page")
      .getByRole("button", { name: /新增模型|Add Model/i })
      .click();
    await waitForDialogReady(this.dialog);
  }

  async assertCreateProviderDrawerChineseTranslations() {
    await this.openCreateProvider();
    await expect(this.dialog.getByText("新增渠道", { exact: true })).toBeVisible();
    await expect(this.dialog.getByLabel(/名称/).first()).toBeVisible();
    await expect(this.dialog.getByLabel(/API 密钥/).first()).toBeVisible();
    await expect(this.dialog.getByLabel(/OpenAI.*地址/).first()).toBeVisible();
    await expect(this.dialog.getByLabel(/Anthropic.*地址/).first()).toBeVisible();
    await expect(this.dialog.getByText(legacyChineseProviderPattern)).toHaveCount(0);
    await this.cancelDrawer();
  }

  async assertCreateModelDrawerChineseTranslations(providerName: string) {
    await this.gotoModels();
    await this.openCreateModel();
    await expect(this.dialog.getByText("新增模型", { exact: true })).toBeVisible();
    await expect(this.dialog.getByLabel(/渠道/).first()).toBeVisible();
    await expect(this.dialog.getByLabel(/端点/).first()).toBeVisible();
    await expect(this.dialog.getByLabel(/模型名称/).first()).toBeVisible();
    await this.selectOption(this.dialog, /渠道/, new RegExp(escapeRegExp(providerName)));
    await this.cancelDrawer();
    await this.gotoProviders();
    await this.searchProvider(providerName);
  }

  async assertProviderListProjection(input: {
    anthropicEndpointUrl?: string;
    modelName: string;
    openaiEndpointUrl?: string;
    providerName: string;
  }) {
    const row = this.tableRow(this.providerTable(), input.providerName);
    await expect(row).toBeVisible();
    await expect(row).toContainText(input.modelName);
    await expect(row).toContainText(/\d+\s*\/\s*\d+/);
    if (input.openaiEndpointUrl) {
      await this.assertProviderRowEndpoint(
        input.providerName,
        input.openaiEndpointUrl,
        "OpenAI",
      );
    }
    if (input.anthropicEndpointUrl) {
      await this.assertProviderRowEndpoint(
        input.providerName,
        input.anthropicEndpointUrl,
        "Anthropic",
      );
    }
  }

  async captureEvidence(name: string) {
    const timestamp = screenshotTimestamp();
    const dir = path.join(repoRoot, "temp", timestamp.slice(0, 8));
    mkdirSync(dir, { recursive: true });
    await waitForBusyIndicatorsToClear(this.page);
    const pathName = path.join(dir, screenshotName(name, timestamp));
    if (await this.dialog.isVisible().catch(() => false)) {
      await this.dialog.screenshot({ path: pathName });
    } else {
      await this.page.screenshot({ fullPage: true, path: pathName });
    }
  }

  async assertProviderRowEndpoint(
    providerName: string,
    endpointUrl: string,
    protocol: string,
  ) {
    const row = this.tableRow(this.providerTable(), providerName);
    await row.getByRole("button", { name: /端点|Endpoints/i }).click();
    await waitForDialogReady(this.dialog);
    const endpoint = this.dialog.locator(".ai-core-endpoint-row", {
      hasText: endpointUrl,
    });
    await expect(endpoint).toBeVisible();
    await expect(endpoint).toContainText(new RegExp(escapeRegExp(protocol), "i"));
    await this.cancelDrawer();
  }

  async assertProviderRowSecret(providerName: string, secretText: string) {
    const row = this.tableRow(this.providerTable(), providerName);
    await row.getByRole("button", { name: /端点|Endpoints/i }).click();
    await waitForDialogReady(this.dialog);
    await expect(this.dialog.getByText(secretText, { exact: true }).first()).toBeVisible();
    await this.cancelDrawer();
  }

  async assertProviderVisible(providerName: string) {
    await expect(this.tableRow(this.providerTable(), providerName)).toBeVisible();
  }

  async createModelForProviderProtocols(input: {
    modelName: string;
    protocolLabels: RegExp[];
    providerName: string;
  }) {
    await this.gotoModels();
    await this.openCreateModel();
    await this.selectOption(this.dialog, /渠道|Provider/i, new RegExp(escapeRegExp(input.providerName)));
    const endpointControl = this.dialog.getByRole("combobox", {
      name: /端点|Endpoint/i,
    });
    await endpointControl.click();
    for (const label of input.protocolLabels) {
      const listbox = this.page.getByRole("listbox").last();
      await listbox.getByRole("option", { name: label }).first().click();
      if (
        label !== input.protocolLabels.at(-1) &&
        !(await listbox.isVisible().catch(() => false))
      ) {
        await endpointControl.click();
      }
    }
    await this.page.keyboard.press("Escape");
    await this.page.getByLabel(/模型名称|Model Name/i).last().fill(input.modelName);
    await this.page.getByRole("button", { name: /保存|Save/i }).last().click();
    await this.waitForToast(/成功|success/i);
    await this.gotoProviders();
    await this.searchProvider(input.providerName);
    await expect(this.tableRow(this.providerTable(), input.providerName)).toContainText(
      input.modelName,
    );
  }

  async assertProviderSyncActions(input: { providerName: string }) {
    const row = this.tableRow(this.providerTable(), input.providerName);
    for (const name of [
      /编辑|Edit/i,
      /端点|Endpoints/i,
      /新增模型|Add Model/i,
      /同步模型|Sync Models/i,
      /删除|Delete/i,
    ]) {
      await expect(row.getByRole("button", { name })).toBeVisible();
    }
  }

  async assertProviderRowAddModelDefaults(providerName: string) {
    const row = this.tableRow(this.providerTable(), providerName);
    await row.getByRole("button", { name: /新增模型|Add Model/i }).click();
    await waitForDialogReady(this.dialog);
    const provider = this.dialog.getByRole("combobox", { name: /渠道|Provider/i });
    await expect(provider).toBeDisabled();
    await expect(provider).toContainText(providerName);
    await this.cancelDrawer();
  }

  async assertProviderSearchFormDefaultSpacing() {
    const form = this.providerPage().locator("form").first();
    await expect(form).toBeVisible();
    await expect(form.getByLabel(/渠道|Provider/i)).toBeVisible();
    await expect(form.getByRole("combobox", { name: /状态|Status/i })).toBeVisible();
    await expect(form.getByRole("button", { name: /搜索|Search/i })).toBeVisible();
  }

  async assertProviderIdentityModel(providerName: string, modelName: string) {
    await expect(this.tableRow(this.providerTable(), providerName)).toContainText(modelName);
  }

  async assertModelManagementProjection(input: {
    endpointUrl: string;
    modelName: string;
    protocolLabel: RegExp;
    providerName: string;
  }) {
    await this.gotoModels();
    const form = this.page.getByTestId("ai-model-management-page").locator("form");
    await form.getByLabel(/模型名称|Model Name/i).fill(input.modelName);
    await form.getByRole("button", { name: /搜索|Search/i }).click();
    await waitForTableReady(this.page, '[data-testid="ai-model-table"]');
    const row = this.tableRow(this.modelTable(), input.modelName);
    await expect(row).toBeVisible();
    await expect(row).toContainText(input.providerName);
    await expect(row).toContainText(input.endpointUrl);
    await expect(row).toContainText(input.protocolLabel);
  }

  async assertModelManagementHidesCapabilityControls(modelName: string) {
    const row = this.tableRow(this.modelTable(), modelName);
    await expect(row.getByText(/能力|Capability/i)).toHaveCount(0);
    await expect(row.getByRole("button", { name: /编辑|Edit/i })).toBeVisible();
    await expect(row.getByRole("button", { name: /删除|Delete/i })).toBeVisible();
  }

  async filterModelsByProviderOnly(input: {
    expectedModelNames: string[];
    hiddenModelNames: string[];
    providerId: number;
    providerName: string;
  }) {
    await this.gotoModels();
    const form = this.page.getByTestId("ai-model-management-page").locator("form");
    await this.selectOption(
      form,
      /渠道|Provider/i,
      new RegExp(escapeRegExp(input.providerName)),
    );
    const response = this.page.waitForResponse((candidate) => {
      const url = new URL(candidate.url());
      return (
        candidate.request().method() === "GET" &&
        url.pathname.endsWith("/ai/models") &&
        url.searchParams.get("providerId") === String(input.providerId)
      );
    });
    await form.getByRole("button", { name: /搜索|Search/i }).click();
    expect((await response).ok()).toBe(true);
    for (const modelName of input.expectedModelNames) {
      await expect(this.tableRow(this.modelTable(), modelName)).toBeVisible();
    }
    for (const modelName of input.hiddenModelNames) {
      await expect(this.tableRow(this.modelTable(), modelName)).toHaveCount(0);
    }
    await expect(form.getByText(/能力方法|Capability Method/i)).toHaveCount(0);
  }

  async renameModelFromModelManagement(input: {
    modelName: string;
    nextModelName: string;
  }) {
    const row = this.tableRow(this.modelTable(), input.modelName);
    await row.getByRole("button", { name: /编辑|Edit/i }).click();
    await waitForDialogReady(this.dialog);
    await this.dialog.getByLabel(/模型名称|Model Name/i).fill(input.nextModelName);
    await this.dialog.getByRole("button", { name: /保存|Save/i }).click();
    await this.waitForToast(/成功|success/i);
    const form = this.page.getByTestId("ai-model-management-page").locator("form");
    await form.getByLabel(/模型名称|Model Name/i).fill(input.nextModelName);
    await form.getByRole("button", { name: /搜索|Search/i }).click();
    await waitForTableReady(this.page, '[data-testid="ai-model-table"]');
    await expect(this.tableRow(this.modelTable(), input.nextModelName)).toBeVisible();
  }

  async deleteModelFromModelManagement(modelName: string) {
    const row = this.tableRow(this.modelTable(), modelName);
    await row.getByRole("button", { name: /删除|Delete/i }).click();
    await this.page
      .getByRole("button", { name: /确认|Confirm|确定/i })
      .last()
      .click();
    await this.waitForToast(/成功|success/i);
    await expect(this.tableRow(this.modelTable(), modelName)).toHaveCount(0);
  }

  async deleteModelFromProviderRow(providerName: string, modelName: string) {
    await this.gotoModels();
    const form = this.page.getByTestId("ai-model-management-page").locator("form");
    await form.getByLabel(/模型名称|Model Name/i).fill(modelName);
    await form.getByRole("button", { name: /搜索|Search/i }).click();
    const row = this.tableRow(this.modelTable(), modelName).filter({
      hasText: providerName,
    });
    await expect(row).toBeVisible();
    await this.deleteModelFromModelManagement(modelName);
  }

  async openProvider(name: string) {
    const row = this.tableRow(this.providerTable(), name);
    await row.getByRole("button", { name: /编辑|Edit/i }).click();
    await waitForDialogReady(this.dialog);
  }

  async fillProvider(data: {
    anthropicBaseUrl?: string;
    name?: string;
    openaiBaseUrl?: string;
    secretRef?: string;
  }) {
    if (data.name !== undefined) {
      await this.dialog.getByLabel(/名称|Name/i).first().fill(data.name);
    }
    if (data.secretRef !== undefined) {
      await this.dialog.getByLabel(/API 密钥|API Key/i).fill(data.secretRef);
    }
    if (data.openaiBaseUrl !== undefined) {
      await this.dialog.getByLabel(/OpenAI.*(地址|URL)/i).fill(data.openaiBaseUrl);
    }
    if (data.anthropicBaseUrl !== undefined) {
      await this.dialog
        .getByLabel(/Anthropic.*(地址|URL)/i)
        .fill(data.anthropicBaseUrl);
    }
  }

  async assertEditProviderMetadataForm(input?: {
    anthropicEndpointUrl?: string;
    openaiEndpointUrl?: string;
  }) {
    await expect(this.dialog.getByLabel(/名称|Name/i).first()).toBeVisible();
    await expect(this.dialog.getByLabel(/API 密钥|API Key/i)).toHaveValue("");
    if (input?.openaiEndpointUrl) {
      await expect(this.dialog.getByLabel(/OpenAI.*(地址|URL)/i)).toHaveValue(
        input.openaiEndpointUrl,
      );
    }
    if (input?.anthropicEndpointUrl) {
      await expect(this.dialog.getByLabel(/Anthropic.*(地址|URL)/i)).toHaveValue(
        input.anthropicEndpointUrl,
      );
    }
  }

  async confirmDrawer() {
    const visibleDialogs = this.page.locator('[role="dialog"]:visible');
    const count = await visibleDialogs.count();
    await visibleDialogs.last().getByRole("button", { name: /保存|Save/i }).click();
    await this.waitForToast(/成功|success/i);
    await expect(visibleDialogs).toHaveCount(Math.max(0, count - 1));
  }

  async cancelDrawer() {
    const visibleDialogs = this.page.locator('[role="dialog"]:visible');
    const count = await visibleDialogs.count();
    if (count === 0) return;
    await closeDialogWithEscape(this.page, visibleDialogs.last());
    await expect(visibleDialogs).toHaveCount(count - 1);
  }

  async searchProvider(name: string) {
    const form = this.providerPage().locator("form");
    await form.getByLabel(/渠道|Provider/i).fill(name);
    await form.getByRole("button", { name: /搜索|Search/i }).click();
    await waitForTableReady(this.page, '[data-testid="ai-provider-table"]');
  }

  async deleteProvider(name: string) {
    const row = this.tableRow(this.providerTable(), name);
    await row.getByRole("button", { name: /删除|Delete/i }).click();
    await this.page
      .getByRole("button", { name: /确认|Confirm|确定/i })
      .last()
      .click();
  }

  async selectTierCapabilityType(capabilityType: string) {
    await this.page.getByTestId(`ai-tier-capability-tab-${capabilityType}`).click();
    await waitForTableReady(this.page, '[data-testid="ai-tier-table"]');
  }

  async assertTierCapabilityTypeTabs() {
    const tabs = this.page.getByTestId("ai-tier-capability-tabs");
    await expect(tabs).toBeVisible();
    for (const type of Object.keys(tierCapabilityTypeLabels)) {
      await expect(this.page.getByTestId(`ai-tier-capability-tab-${type}`)).toBeVisible();
    }
  }

  async assertTierTabsVisualStyle() {
    const tabs = this.page.getByTestId("ai-tier-capability-tabs");
    await expect(tabs.getByRole("tablist")).toBeVisible();
    await expect(tabs.getByRole("tab", { selected: true })).toBeVisible();
  }

  async assertTierTypePage(capabilityType: string) {
    const label = tierCapabilityTypeLabels[capabilityType];
    expect(label, `未知能力类型: ${capabilityType}`).toBeTruthy();
    const active = this.page.getByRole("tab", { selected: true });
    await expect(active).toContainText(new RegExp(`${label.zh}|${label.en}`, "i"));
    await expect(this.page.getByTestId("ai-tier-capability-content")).toBeVisible();
    await expect(this.tierTable()).toBeVisible();
  }

  async assertTierUpdatedAtHidden(tierName: RegExp) {
    const row = this.tableRow(this.tierTable(), tierName);
    await expect(row).toBeVisible();
    await expect(this.tierTable().getByText(/更新时间|Updated At/i)).toHaveCount(0);
  }

  async editTier(tierName: RegExp) {
    const row = this.tableRow(this.tierTable(), tierName);
    await row.getByRole("button", { name: /编辑|Edit/i }).click();
    await waitForDialogReady(this.dialog);
  }

  async assertTierDrawerWithoutThinkingEffort(tierName: RegExp) {
    await this.editTier(tierName);
    await expect(
      this.dialog.getByLabel(/Thinking Effort|推理强度/i),
    ).toHaveCount(0);
    await this.cancelDrawer();
  }

  async assertTierDrawerDefaultConfig(tierName: RegExp) {
    await this.editTier(tierName);
    await expect(this.dialog.getByLabel(/渠道|Provider/i)).toBeVisible();
    await expect(this.dialog.getByLabel(/模型|Model/i)).toBeVisible();
    await expect(this.dialog.getByText(/参数 JSON|Parameters JSON/i)).toHaveCount(0);
  }

  async saveTierDrawer() {
    await this.dialog.getByRole("button", { name: /保存|Save/i }).click();
    await this.waitForToast(/成功|success/i);
  }

  async assertTierModelOptionsGrouped(input: {
    anthropicModelName: string;
    openAIModelName: string;
    providerName: string;
    tierName: RegExp;
  }) {
    await this.editTier(input.tierName);
    await this.selectOption(
      this.dialog,
      /渠道|Provider/i,
      new RegExp(escapeRegExp(input.providerName)),
    );
    await this.dialog.getByRole("combobox", { name: /模型|Model/i }).click();
    const listbox = this.page.getByRole("listbox").last();
    await expect(listbox).toContainText(/OpenAI/i);
    await expect(listbox).toContainText(/Anthropic/i);
    await expect(listbox).toContainText(input.openAIModelName);
    await expect(listbox).toContainText(input.anthropicModelName);
    await this.page.keyboard.press("Escape");
    await this.cancelDrawer();
  }

  async clickSavedTierTestAndAssertLoading(tierName: RegExp) {
    const row = this.tableRow(this.tierTable(), tierName);
    const button = row.getByRole("button", { name: /测试|Test/i });
    await button.click();
    await expect(button).toBeDisabled();
  }

  async clickDraftTierTestAndAssertLoading(tierName: RegExp) {
    await this.editTier(tierName);
    const button = this.dialog.getByRole("button", { name: /测试当前|Test Draft/i });
    await button.click();
    await expect(button).toBeDisabled();
  }

  async assertDraftTierCurrentTestLatency(expectedLatency: string) {
    await expect(this.page.getByTestId("ai-tier-current-test-result")).toContainText(
      expectedLatency,
    );
  }

  async filterInvocationsByCapabilityAndPurpose(
    capability: string,
    purpose: string,
  ) {
    await this.filterInvocationsByCapabilityPurposeAndSource(
      capability,
      purpose,
      undefined,
    );
  }

  async filterInvocationsByCapabilityPurposeAndSource(
    capability: string,
    purpose: string,
    sourcePluginId?: string,
  ) {
    const [capabilityType, capabilityMethod] = capability.split(".", 2);
    const capabilityLabel = tierCapabilityTypeLabels[capabilityType || ""];
    const form = this.page.getByTestId("ai-invocation-logs-page").locator("form");
    await this.selectOption(
      form,
      /能力类型|Capability Type/i,
      capabilityLabel
        ? new RegExp(`${escapeRegExp(capabilityLabel.zh)}|${escapeRegExp(capabilityLabel.en)}`, "i")
        : new RegExp(escapeRegExp(capabilityType || ""), "i"),
    );
    await form.getByLabel(/调用方法|Invocation Method/i).fill(capabilityMethod || "");
    await form.getByLabel(/用途|Purpose/i).fill(purpose);
    if (sourcePluginId !== undefined) {
      await form.getByLabel(/来源插件|Source Plugin/i).fill(sourcePluginId);
    }
    await form.getByRole("button", { name: /搜索|Search/i }).click();
    await waitForTableReady(this.page, '[data-testid="ai-invocation-table"]');
  }

  async selectInvocationCreatedAtTodayRange() {
    const form = this.page.getByTestId("ai-invocation-logs-page").locator("form");
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    await form.getByLabel(/开始时间|Start Time/i).fill(localDateTime(start));
    await form.getByLabel(/结束时间|End Time/i).fill(localDateTime(end));
  }

  async searchInvocations() {
    await this.page
      .getByTestId("ai-invocation-logs-page")
      .getByRole("button", { name: /搜索|Search/i })
      .click();
    await waitForTableReady(this.page, '[data-testid="ai-invocation-table"]');
  }

  async openInvocationDetail(rowText?: string | string[]) {
    let row = this.invocationTable().getByRole("row");
    for (const text of typeof rowText === "string" ? [rowText] : rowText || []) {
      row = row.filter({ hasText: text });
    }
    const target = row.filter({ has: this.page.getByRole("button", { name: /详情|Detail/i }) }).first();
    await expect(target).toBeVisible();
    await target.getByRole("button", { name: /详情|Detail/i }).click();
    await waitForDialogReady(this.dialog);
  }

  async assertInvocationDeleteButtonStyle() {
    const button = this.page.getByTestId("ai-invocation-clear");
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("data-testid", "ai-invocation-clear");
  }

  async expectInvocationDeleteDialogRequiresRangeAndCancel() {
    await this.page.getByTestId("ai-invocation-clear").click();
    await waitForDialogReady(this.dialog);
    await expect(this.page.getByTestId("ai-invocation-delete-alert")).toBeVisible();
    await expect(this.page.getByTestId("ai-invocation-delete-range-section")).toBeVisible();
    await this.dialog.getByRole("button", { name: /确认|Confirm/i }).click();
    await this.waitForToast(/时间范围|time range/i);
    await this.dialog.getByRole("button", { name: /取消|Cancel/i }).click();
    await expect(this.dialog).toBeHidden();
  }

  async expectInvocationDeleteAllModeUsesUnscopedClean() {
    await this.page.getByTestId("ai-invocation-clear").click();
    await waitForDialogReady(this.dialog);
    const option = this.page.getByTestId("ai-invocation-delete-all-option");
    const label = option.getByText(/删除所有调用日志|Delete all request logs/i);
    await label.click();
    const range = this.page.getByTestId("ai-invocation-delete-range-section");
    await expect(range.getByRole("textbox").nth(0)).toBeDisabled();
    await expect(range.getByRole("textbox").nth(1)).toBeDisabled();
    await label.click();
    await this.dialog.getByRole("button", { name: /取消|Cancel/i }).click();
  }

  async confirmInvocationCleanWithDialogRange() {
    await this.page.getByTestId("ai-invocation-clear").click();
    await waitForDialogReady(this.dialog);
    const range = this.page.getByTestId("ai-invocation-delete-range-section");
    const inputs = range.getByRole("textbox");
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    await inputs.nth(0).fill(localDateTime(start));
    await inputs.nth(1).fill(localDateTime(end));
    await this.dialog.getByRole("button", { name: /确认|Confirm/i }).click();
  }
}
