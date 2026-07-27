import type { Locator, Page } from "@playwright/test";

import {
  waitForBusyIndicatorsToClear,
  waitForConfirmOverlay,
  waitForDialogReady,
  waitForDropdown,
  waitForRouteReady,
  waitForTableReady,
} from "../support/ui";

export class ConfigPage {
  constructor(private page: Page) {}

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private localizedLabelPattern(label: string) {
    const labelMap: Record<string, RegExp> = {
      参数名称: /参数名称|Parameter Name|Configuration Name/i,
      参数键名: /参数键(?:名)?|Parameter Key|Configuration Key/i,
      参数键值: /参数(?:键)?值|Parameter Value|Configuration Value/i,
      备注: /备注|Remark/i,
    };
    return (
      labelMap[label] ?? new RegExp(`^\\s*${this.escapeRegex(label)}\\s*$`)
    );
  }

  private resolveLocalizedLabel(scope: Page | Locator, label: string) {
    return scope.getByLabel(this.localizedLabelPattern(label)).first();
  }

  private searchFieldName(label: string) {
    const fieldMap: Record<string, string> = {
      参数名称: "name",
      参数键名: "key",
    };
    return fieldMap[label];
  }

  private get searchForm() {
    return this.page.locator('[data-testid="config-page"] .iam-search-form').first();
  }

  get listFeedback() {
    return this.page.getByTestId("config-list-feedback");
  }

  async setViewportSize(width: number, height: number) {
    await this.page.setViewportSize({ height, width });
  }

  private async fillInputAndWaitForStableValue(input: Locator, value: string) {
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      await input.waitFor({ state: "visible", timeout: 2000 });
      await input.clear();
      await input.fill(value);
      await this.page.waitForTimeout(600);
      await waitForBusyIndicatorsToClear(this.page, 2000);
      if ((await input.inputValue().catch(() => "")) === value) {
        return;
      }
    }

    await input.clear();
    await input.fill(value);
  }

  /** The modal dialog container */
  private get dialog() {
    return this.page.locator('.semi-sidesheet-inner[role="dialog"]:visible').last();
  }

  get createEditDialog() {
    return this.dialog;
  }

  get dialogFullscreenButton() {
    return this.dialog.getByRole("button", { name: /全屏|Fullscreen/i });
  }

  get richtextEditor() {
    return this.dialog.getByTestId("config-value-editor-richtext");
  }

  get richtextEditorContent() {
    return this.richtextEditor.getByRole("textbox").first();
  }

  private get importDialog() {
    return this.page
      .locator('.semi-modal-content[role="dialog"]:visible')
      .filter({ has: this.page.getByTestId("settings-import-dialog") })
      .last();
  }

  private get builtinDeleteTooltip() {
    return this.page
      .locator(
        '[role="tooltip"]:visible, .semi-popover:visible',
      )
      .filter({
        hasText:
          /System built-in data cannot be deleted|系统内置数据不支持删除|系統內置數據不支援刪除/,
      })
      .first();
  }

  private getDeleteActionById(id: number) {
    return this.page.locator(`[data-testid="config-delete-${id}"]`).first();
  }

  private getRowByDeleteActionId(id: number) {
    return this.page
      .locator(".semi-table-tbody > .semi-table-row")
      .filter({ has: this.getDeleteActionById(id) })
      .first();
  }

  private async hoverDeleteButtonInRow(row: Locator) {
    const button = row.getByRole("button", { name: /删\s*除|Delete/i }).first();
    await button.waitFor({ state: "visible", timeout: 5000 });
    await button.locator("xpath=..").hover({ force: true });
  }

  async goto() {
    await this.page.goto("/system/config");
    await waitForTableReady(this.page);
  }

  async gotoForListFeedback() {
    await this.page.goto("/system/config", { waitUntil: "domcontentloaded" });
    await this.page.getByTestId("config-page").waitFor({ state: "visible" });
  }

  async refreshListForFeedback() {
    await this.searchForm
      .getByRole("button", { name: /搜\s*索|Search/i })
      .first()
      .click();
  }

  async openCreateDialog() {
    await this.page.getByRole("button", { name: /新\s*增|Add/i }).click();
    await waitForDialogReady(this.dialog);
  }

  async openEditByKey(key: string) {
    await this.fillSearchField("参数键名", key);
    await this.clickSearch();
    const edit = await this.getEditButtonByKey(key);
    await edit.click();
    await waitForDialogReady(this.dialog);
  }

  booleanOption(label: RegExp | string) {
    return this.dialog
      .getByRole("radio", { name: label })
      .locator("xpath=ancestor-or-self::*[contains(@class, 'semi-radio')][1]");
  }

  async chooseBooleanValue(value: "false" | "true") {
    const label = value === "true" ? /是|True/i : /否|False/i;
    await this.booleanOption(label).click();
  }

  async confirmDialog() {
    await this.dialog.getByRole("button", { name: /保\s*存|Save|确\s*认|Confirm/i }).click();
    await this.dialog.waitFor({ state: "hidden", timeout: 10_000 });
    await waitForRouteReady(this.page);
  }

  async clickDialogConfirm() {
    await this.dialog.getByRole("button", { name: /保\s*存|Save|确\s*认|Confirm/i }).click();
  }

  async selectDialogOption(fieldLabel: string, option: RegExp | string) {
    await this.resolveLocalizedLabel(this.dialog, fieldLabel).click();
    const dropdown = await waitForDropdown(this.page);
    await dropdown.getByText(option).first().click();
  }

  async selectValueType(option: RegExp | string) {
    await this.dialog.getByLabel(/值类型|Value type/i).click();
    const dropdown = await waitForDropdown(this.page);
    await dropdown.getByText(option).first().click();
  }

  async createSelect(
    name: string,
    key: string,
    options: string,
    value: string,
    remark: string,
  ) {
    await this.openCreateDialog();
    await this.resolveLocalizedLabel(this.dialog, "参数名称").fill(name);
    await this.resolveLocalizedLabel(this.dialog, "参数键名").fill(key);
    await this.selectValueType(/下拉选择|Select/i);
    await this.dialog.getByLabel(/选项|Options/i).fill(options);
    await this.selectDialogOption("参数键值", new RegExp(value, "i"));
    await this.resolveLocalizedLabel(this.dialog, "备注").fill(remark);
    await this.confirmDialog();
  }

  dialogFieldError(label: string) {
    const field = this.dialog.locator(".semi-form-field").filter({
      has: this.dialog.getByText(this.localizedLabelPattern(label)).first(),
    }).first();
    return field.locator(".semi-form-field-error-message, [role=alert]").first();
  }

  dialogFieldControl(label: string) {
    return this.resolveLocalizedLabel(this.dialog, label);
  }

  async getColumnAlignment(label: string) {
    const pattern = this.localizedLabelPattern(label);
    const headers = this.page.getByTestId("config-table").getByRole("columnheader");
    const texts = await headers.allTextContents();
    const index = texts.findIndex((text) => pattern.test(text));
    if (index < 0) {
      throw new Error(`未找到参数表格列：${label}`);
    }
    const header = headers.nth(index);
    const body = this.page.getByTestId("config-table")
      .locator(".semi-table-tbody > .semi-table-row")
      .first()
      .locator(".semi-table-row-cell")
      .nth(index);
    const [headerAlign, bodyAlign] = await Promise.all([
      header.evaluate((node) => getComputedStyle(node).textAlign),
      body.evaluate((node) => getComputedStyle(node).textAlign),
    ]);
    return {
      bodyLeft: bodyAlign === "left" || bodyAlign === "start",
      headerLeft: headerAlign === "left" || headerAlign === "start",
    };
  }

  // ========== CRUD operations ==========

  async create(name: string, key: string, value: string, remark?: string) {
    await this.page.getByRole("button", { name: /新\s*增|Add/i }).click();
    await waitForDialogReady(this.dialog);

    await this.resolveLocalizedLabel(this.dialog, "参数名称").fill(name);
    await this.resolveLocalizedLabel(this.dialog, "参数键名").fill(key);
    await this.resolveLocalizedLabel(this.dialog, "参数键值").fill(value);
    if (remark) {
      await this.resolveLocalizedLabel(this.dialog, "备注").fill(remark);
    }

    await this.dialog.getByRole("button", { name: /保\s*存|Save|确\s*认|Confirm/i }).click();
    await waitForRouteReady(this.page);
    await this.dialog
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  }

  async edit(
    configName: string,
    fields: { name?: string; key?: string; value?: string; remark?: string },
  ) {
    // Search for the config first to narrow results
    await this.fillSearchField("参数名称", configName);
    await this.clickSearch();

    // Click edit button
    await this.page
      .getByRole("button", { name: /编\s*辑|Edit/i })
      .first()
      .click();
    await waitForDialogReady(this.dialog);

    if (fields.name) {
      const input = this.resolveLocalizedLabel(this.dialog, "参数名称");
      await input.clear();
      await input.fill(fields.name);
    }
    if (fields.key) {
      const input = this.resolveLocalizedLabel(this.dialog, "参数键名");
      await input.clear();
      await input.fill(fields.key);
    }
    if (fields.value) {
      const input = this.resolveLocalizedLabel(this.dialog, "参数键值");
      await input.clear();
      await input.fill(fields.value);
    }
    if (fields.remark) {
      const input = this.resolveLocalizedLabel(this.dialog, "备注");
      await input.clear();
      await input.fill(fields.remark);
    }

    await this.dialog.getByRole("button", { name: /保\s*存|Save|确\s*认|Confirm/i }).click();
    await waitForRouteReady(this.page);
    await this.dialog
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  }

  async delete(configName: string) {
    // Search for the config first
    await this.fillSearchField("参数名称", configName);
    await this.clickSearch();

    const targetRow = this.page
      .locator(".semi-table-tbody > .semi-table-row")
      .filter({ hasText: configName })
      .first();
    await targetRow.waitFor({ state: "visible", timeout: 5000 });
    await targetRow.hover();

    // Click delete button
    await targetRow.getByRole("button", { name: /删\s*除|Delete/i }).click();

    // Confirm deletion in Popconfirm
    const popconfirm = await waitForConfirmOverlay(this.page);
    const confirmBtn = popconfirm.getByRole("button", {
      name: /确\s*定|确\s*认|OK|Confirm|是/i,
    });
    await confirmBtn.click();

    await waitForRouteReady(this.page);
  }

  async hasConfig(text: string): Promise<boolean> {
    return this.page
      .locator(".semi-table-tbody > .semi-table-row")
      .filter({ hasText: text })
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
  }

  findRowByExactKey(key: string): Locator {
    const keyPattern = new RegExp(`^\\s*${this.escapeRegex(key)}\\s*$`);

    return this.page
      .locator(".semi-table-tbody > .semi-table-row", {
        has: this.page.locator(".semi-table-row-cell").filter({ hasText: keyPattern }),
      })
      .first();
  }

  async getDeleteButtonByKey(key: string): Promise<Locator> {
    const row = this.findRowByExactKey(key);
    await row.waitFor({ state: "visible", timeout: 5000 });
    return row.getByRole("button", { name: /删\s*除|Delete/i }).first();
  }

  async getEditButtonByKey(key: string): Promise<Locator> {
    const row = this.findRowByExactKey(key);
    await row.waitFor({ state: "visible", timeout: 5000 });
    return row.getByRole("button", { name: /编\s*辑|Edit/i }).first();
  }

  async getDeleteButtonById(id: number): Promise<Locator> {
    const row = this.getRowByDeleteActionId(id);
    await row.waitFor({ state: "visible", timeout: 5000 });
    return row.getByRole("button", { name: /删\s*除|Delete/i }).first();
  }

  async getEditButtonById(id: number): Promise<Locator> {
    const row = this.getRowByDeleteActionId(id);
    await row.waitFor({ state: "visible", timeout: 5000 });
    return row.getByRole("button", { name: /编\s*辑|Edit/i }).first();
  }

  async hoverDeleteActionById(id: number) {
    const row = this.getRowByDeleteActionId(id);
    await row.waitFor({ state: "visible", timeout: 5000 });
    await this.hoverDeleteButtonInRow(row);
  }

  async hoverDeleteActionByKey(key: string) {
    const row = this.findRowByExactKey(key);
    await row.waitFor({ state: "visible", timeout: 5000 });
    await this.hoverDeleteButtonInRow(row);
  }

  async isBuiltinDeleteTooltipVisible() {
    return this.builtinDeleteTooltip
      .waitFor({ state: "visible", timeout: 3000 })
      .then(() => true)
      .catch(() => false);
  }

  async getRowCount(): Promise<number> {
    return this.page.locator(".semi-table-tbody > .semi-table-row").count();
  }

  // ========== Search helpers ==========

  async fillSearchField(label: string, value: string) {
    const fieldName = this.searchFieldName(label);
    if (fieldName) {
      const namedInput = this.searchForm
        .locator(`input[name="${fieldName}"]`)
        .first();
      if (await namedInput.isVisible().catch(() => false)) {
        await this.fillInputAndWaitForStableValue(namedInput, value);
        return;
      }
    }

    const fallbackInput = this.resolveLocalizedLabel(this.searchForm, label);
    await this.fillInputAndWaitForStableValue(fallbackInput, value);
  }

  async clickSearch() {
    await this.searchForm
      .getByRole("button", { name: /搜\s*索|Search/i })
      .first()
      .click();
    await waitForRouteReady(this.page);
  }

  async clickReset() {
    await this.searchForm
      .getByRole("button", { name: /重\s*置|Reset/i })
      .first()
      .click();
    await waitForRouteReady(this.page);
  }

  // ========== Row Selection ==========

  async selectRow(configName: string) {
    await this.fillSearchField("参数名称", configName);
    await this.clickSearch();
    // Click the first checkbox in the body rows
    const row = this.page.locator(".semi-table-tbody > .semi-table-row").first();
    await row.locator(".semi-checkbox").first().click();
    await waitForBusyIndicatorsToClear(this.page);
  }

  // ========== Export ==========

  async clickExport() {
    await this.page.getByRole("button", { name: /导\s*出|Export/i }).click();
    await waitForDialogReady(this.page.locator('.semi-modal-content[role="dialog"]:visible'));
  }

  /** Click confirm button in the export confirm modal */
  async clickExportConfirm() {
    const modal = this.page.locator('.semi-modal-content[role="dialog"]:visible').last();
    await modal.getByRole("button", { name: /^确\s*认$|^确\s*定$|^Confirm$|^OK$/i }).click();
    await waitForRouteReady(this.page);
  }

  // ========== Import ==========

  async clickImport() {
    await this.page.getByRole("button", { name: /导\s*入|Import/i }).click();
    await waitForDialogReady(this.importDialog);
  }
}
