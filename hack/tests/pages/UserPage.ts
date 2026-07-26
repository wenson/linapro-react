import { expect, type Locator, type Page } from "@playwright/test";

import {
  waitForBusyIndicatorsToClear,
  waitForDialogReady,
  waitForRouteReady,
  waitForTableReady,
} from "../support/ui";
import { captureEvidence } from "../support/evidence";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function searchLabel(label: string): RegExp {
  if (/账号/.test(label)) return /用户账号|Account/i;
  if (/昵称/.test(label)) return /用户昵称|Display name/i;
  if (/手机|电话/.test(label)) return /手机号|Phone/i;
  return new RegExp(escapeRegExp(label), "i");
}

function columnLabel(label: string): RegExp {
  if (/账号/.test(label)) return /用户账号|Account/i;
  if (/创建时间/.test(label)) return /创建时间|Created at/i;
  if (/角色/.test(label)) return /角色|Roles/i;
  if (/所属租户/.test(label)) return /所属租户|Tenant memberships/i;
  return new RegExp(escapeRegExp(label), "i");
}

export class UserPage {
  private static readonly DRAWER_HIDDEN_TIMEOUT = 20_000;
  private static readonly DIALOG_READY_TIMEOUT = 20_000;

  constructor(private page: Page) {}

  get table() {
    return this.page.getByTestId("user-table");
  }

  get drawer() {
    return this.page.locator('.semi-sidesheet-inner[role="dialog"]').last();
  }

  get mobileList() {
    return this.page.getByTestId("user-mobile-list");
  }

  private get rows() {
    return this.table.locator(".semi-table-tbody > .semi-table-row");
  }

  private get drawerAccountInput() {
    return this.drawer.getByRole("textbox", { name: /用户账号|Account/i });
  }

  private get drawerPasswordInput() {
    return this.drawer.getByRole("textbox", {
      name: /^密码\*?$|^Password\*?$/i,
    });
  }

  private get usernameSearchInput() {
    return this.page
      .locator('[data-testid="user-page"] .iam-search-form')
      .getByLabel(/用户账号|Account/i)
      .first();
  }

  private searchInput(label: string) {
    return this.page
      .locator('[data-testid="user-page"] .iam-search-form')
      .getByLabel(searchLabel(label))
      .first();
  }

  private drawerField(label: RegExp) {
    return this.drawer.locator(".semi-form-field").filter({ hasText: label }).first();
  }

  private get roleField() {
    return this.drawerField(/角色|Roles/i);
  }

  private get roleCombobox() {
    return this.roleField.getByRole("combobox");
  }

  private get roleSelect() {
    return this.roleField.locator(".semi-select").first();
  }

  get tenantFilter() {
    return this.page.getByTestId("user-tenant-filter");
  }

  get tenantMembershipHeader() {
    return this.table.getByRole("columnheader", { name: /所属租户|Tenant memberships/i });
  }

  getUserRow(username: string) {
    const exactUsername = new RegExp(`^\\s*${escapeRegExp(username)}\\s*$`);
    return this.rows
      .filter({
        has: this.page.locator(".semi-table-row-cell", { hasText: exactUsername }),
      })
      .first();
  }

  async hasDeptTreeNode(label: string): Promise<boolean> {
    return this.page
      .getByTestId("user-dept-tree")
      .getByText(label, { exact: false })
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async goto() {
    await this.page.goto("/system/user");
    await waitForTableReady(this.page, '[data-testid="user-table"]');
  }

  async createUser(username: string, password: string, nickname?: string) {
    await this.page.getByTestId("user-create-button").click();
    await this.waitForDrawerReady("");
    await this.drawerAccountInput.fill(username);
    await this.drawerPasswordInput.fill(password);
    if (nickname) await this.drawer.getByLabel(/用户昵称|Display name/i).fill(nickname);
    await this.saveDrawer();
  }

  async openCreateDrawer() {
    await this.page.getByTestId("user-create-button").click();
    await this.waitForDrawerReady("");
    return this.drawer;
  }

  async capture(name: string) {
    return captureEvidence(this.page, name);
  }

  async editUser(username: string, fields: { nickname?: string }) {
    await this.searchByUsername(username);
    const row = this.getUserRow(username);
    await row.getByRole("button", { name: /^编\s*辑$|^Edit$/i }).click();
    await this.waitForDrawerReady(username);
    if (fields.nickname) {
      await this.drawer.getByLabel(/用户昵称|Display name/i).fill(fields.nickname);
    }
    await this.saveDrawer();
  }

  async deleteUser(username: string) {
    await this.searchByUsername(username);
    const row = this.getUserRow(username);
    await row.getByRole("button", { name: /^删\s*除$|^Delete$/i }).click();
    const popconfirm = this.page.locator(".semi-popover:visible").last();
    await popconfirm.waitFor({ state: "visible", timeout: 5_000 });
    await popconfirm
      .getByRole("button", { name: /^确\s*认$|^确\s*定$|^Confirm$|^OK$/i })
      .click();
    await waitForTableReady(this.page, '[data-testid="user-table"]');
  }

  async hasUser(username: string): Promise<boolean> {
    return this.getUserRow(username)
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  columnHeader(title: string) {
    return this.table
      .getByRole("columnheader")
      .filter({ hasText: columnLabel(title) })
      .first();
  }

  async clickColumnSort(columnTitle: string) {
    await this.columnHeader(columnTitle)
      .locator(".semi-table-column-sorter-wrapper")
      .click();
    await waitForRouteReady(this.page);
  }

  async getColumnValues(columnTitle: string): Promise<string[]> {
    const headers = await this.table.getByRole("columnheader").allTextContents();
    const index = headers.findIndex((text) => columnLabel(columnTitle).test(text));
    if (index < 0) return [];
    return await this.rows.locator(".semi-table-row-cell").nth(index).allTextContents();
  }

  async getVisibleRowCount(): Promise<number> {
    return this.rows.count();
  }

  async fillSearchField(label: string, value: string) {
    await this.searchInput(label).fill(value);
  }

  async expectSearchFieldValue(label: string, value: string) {
    await expect(this.searchInput(label)).toHaveValue(value);
  }

  async selectSearchStatus(statusLabel: string) {
    const field = this.page
      .locator('[data-testid="user-page"] .iam-search-form .semi-form-field')
      .filter({ hasText: /状态|Status/i })
      .first();
    await field.getByRole("combobox").click();
    await this.page.getByRole("option", { name: statusLabel, exact: true }).click();
  }

  async clickSearch() {
    await this.page.getByRole("button", { name: /^搜\s*索$|^Search$/i }).first().click();
    await waitForTableReady(this.page, '[data-testid="user-table"]');
  }

  async clickReset() {
    await this.page.getByRole("button", { name: /^重\s*置$|^Reset$/i }).first().click();
    await waitForTableReady(this.page, '[data-testid="user-table"]');
  }

  async searchByUsername(username: string) {
    await this.clickReset();
    await this.usernameSearchInput.fill(username);
    await this.clickSearch();
  }

  async searchByUsernameKeyword(keyword: string) {
    await this.searchByUsername(keyword);
  }

  async selectVisibleUserRows(usernames: string[]) {
    for (const username of usernames) {
      const row = this.getUserRow(username);
      await expect(row).toBeVisible();
      await row.locator(".semi-checkbox").first().click();
      await expect(row.getByRole("checkbox")).toBeChecked();
    }
  }

  async confirmSelectedUserBatchDelete() {
    await this.page.getByTestId("user-batch-delete-button").click();
    const modal = this.page.locator('.semi-modal-content[role="dialog"]:visible').last();
    await modal.waitFor({ state: "visible", timeout: 5_000 });
    await modal
      .getByRole("button", { name: /^确\s*认$|^确\s*定$|^Confirm$|^OK$/i })
      .click();
    await waitForBusyIndicatorsToClear(this.page);
  }

  async openSelectedUserBatchEdit() {
    await this.page.getByTestId("user-batch-edit-button").click();
    const dialog = this.page.locator('.semi-modal-content[role="dialog"]:visible').filter({
      has: this.page.getByTestId("user-batch-edit-dialog"),
    });
    return waitForDialogReady(dialog, UserPage.DIALOG_READY_TIMEOUT);
  }

  async expectBatchEditControlsReady(dialog: Locator) {
    const updateStatus = dialog.getByRole("checkbox", {
      name: /更新状态|Update status/i,
    });
    const updateRoles = dialog.getByRole("checkbox", {
      name: /更新角色|Update roles/i,
    });
    await expect(updateStatus).toBeVisible();
    await expect(updateRoles).toBeVisible();
    await expect(updateStatus).not.toBeChecked();
    await expect(updateRoles).not.toBeChecked();
    await expect(dialog.getByText(/^updateStatus$|^updateRoles$/)).toHaveCount(0);
  }

  async expectToolbarPrimaryActionsDistinct() {
    const buttons = [
      this.page.getByTestId("user-batch-edit-button"),
      this.page.getByTestId("user-batch-delete-button"),
      this.page.getByTestId("user-create-button"),
    ];
    await Promise.all(buttons.map((button) => expect(button).toBeVisible()));
    const colors = await Promise.all(buttons.map((button) => button.evaluate((element) => {
      const style = getComputedStyle(element);
      return `${style.backgroundColor}|${style.borderColor}|${style.color}`;
    })));
    expect(new Set(colors).size).toBe(3);
  }

  async batchUpdateSelectedStatus(statusLabel: string) {
    const dialog = await this.openSelectedUserBatchEdit();
    await this.expectBatchEditControlsReady(dialog);
    const updateStatus = dialog.locator(".semi-checkbox").filter({
      hasText: /更新状态|Update status/i,
    });
    await updateStatus.click();
    const statusField = dialog.locator(".semi-form-field").filter({ hasText: /^状态|Status/i }).first();
    await statusField.getByRole("combobox").click();
    const statusOption = this.page
      .locator(".semi-select-option:visible")
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(statusLabel)}\\s*$`) })
      .first();
    await expect(statusOption).toBeVisible({ timeout: 10_000 });
    await statusOption.click();
    const update = this.page.waitForResponse((response) =>
      new URL(response.url()).pathname.endsWith("/user") && response.request().method() === "PUT",
    );
    await dialog.getByRole("button", { name: /^保\s*存$|^Save$/i }).click();
    await update;
    await dialog.waitFor({ state: "hidden", timeout: 15_000 });
  }

  async clickExport() {
    await this.page.getByRole("button", { name: /导\s*出|Export/i }).click();
    return waitForDialogReady(this.page.locator('.semi-modal-content[role="dialog"]:visible'));
  }

  async clickExportConfirm() {
    const modal = this.page.locator('.semi-modal-content[role="dialog"]:visible').last();
    await modal
      .getByRole("button", { name: /^确\s*认$|^确\s*定$|^Confirm$|^OK$/i })
      .click();
  }

  async selectRow(username: string) {
    await this.searchByUsername(username);
    const row = this.getUserRow(username);
    await row.locator(".semi-checkbox").first().click();
    await expect(row.getByRole("checkbox")).toBeChecked();
  }

  async isExportVisible(): Promise<boolean> {
    return this.page.getByRole("button", { name: /导\s*出|Export/i })
      .isVisible({ timeout: 2_000 })
      .catch(() => false);
  }

  async isToolbarDeleteVisible(): Promise<boolean> {
    return this.page.getByTestId("user-batch-delete-button")
      .isVisible({ timeout: 2_000 })
      .catch(() => false);
  }

  async hasActionButtons(username: string): Promise<boolean> {
    await this.searchByUsername(username);
    const actions = this.getUserRow(username).getByRole("button", {
      name: /编\s*辑|Edit|删\s*除|Delete|重置密码|Reset password/i,
    });
    return (await actions.count()) > 0;
  }

  async isStatusSwitchDisabled(username: string): Promise<boolean> {
    await this.searchByUsername(username);
    return this.getUserRow(username).getByRole("switch").isDisabled();
  }

  async isCheckboxDisabled(username: string): Promise<boolean> {
    await this.searchByUsername(username);
    return this.getUserRow(username).getByRole("checkbox").isDisabled();
  }

  async clickImport() {
    await this.page.getByRole("button", { name: /导\s*入|Import/i }).first().click();
    const dialog = this.page.locator('.semi-modal-content[role="dialog"]:visible').filter({
      has: this.page.getByTestId("user-import-dialog"),
    });
    return waitForDialogReady(dialog, UserPage.DIALOG_READY_TIMEOUT);
  }

  async getTotalCount(): Promise<number> {
    const text = await this.table.locator(".semi-page-total").textContent();
    return Number(text?.match(/\d+/)?.[0] ?? 0);
  }

  async selectRoles(roleNames: string[]) {
    for (const roleName of roleNames) {
      await this.roleCombobox.click();
      const option = this.page
        .locator(".semi-select-option:visible")
        .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(roleName)}\\s*$`) })
        .first();
      await expect(option).toBeVisible({ timeout: 10_000 });
      await option.click();
    }
  }

  async getRoleNames(username: string): Promise<string> {
    await this.searchByUsername(username);
    const headers = await this.table.getByRole("columnheader").allTextContents();
    const index = headers.findIndex((text) => /角色|Roles/i.test(text));
    expect(index, "role column must exist").toBeGreaterThanOrEqual(0);
    return (
      await this.getUserRow(username).locator(".semi-table-row-cell").nth(index).innerText()
    ).trim();
  }

  async getSelectedRoleCount(): Promise<number> {
    return this.roleSelect.locator(".semi-tag").count();
  }

  async createUserWithRoles(
    username: string,
    password: string,
    nickname: string,
    roleNames: string[],
  ) {
    await this.page.getByTestId("user-create-button").click();
    await this.waitForDrawerReady("");
    await this.drawerAccountInput.fill(username);
    await this.drawerPasswordInput.fill(password);
    await this.drawer.getByLabel(/用户昵称|Display name/i).fill(nickname);
    await this.selectRoles(roleNames);
    await this.saveDrawer();
  }

  async editUserRoles(username: string, roleNames: string[]) {
    await this.searchByUsername(username);
    await this.getUserRow(username).getByRole("button", { name: /^编\s*辑$|^Edit$/i }).click();
    await this.waitForDrawerReady(username);

    await this.roleSelect.hover();
    const clear = this.roleSelect.locator(".semi-select-clear");
    if (await clear.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await clear.click();
    } else {
      const closeButtons = this.roleSelect.locator(".semi-tag-close");
      while (await closeButtons.count()) await closeButtons.first().click();
    }
    await this.selectRoles(roleNames);
    await this.saveDrawer();
  }

  private async waitForDrawerReady(expectedUsername: string) {
    await waitForDialogReady(this.drawer, UserPage.DIALOG_READY_TIMEOUT);
    await this.drawer.getByTestId("user-drawer-form").waitFor({
      state: "visible",
      timeout: UserPage.DIALOG_READY_TIMEOUT,
    });
    await expect(this.drawerAccountInput).toHaveValue(expectedUsername, { timeout: 10_000 });
    await this.roleCombobox.waitFor({ state: "visible", timeout: 10_000 });
  }

  private async saveDrawer() {
    await this.drawer.getByRole("button", { name: /^保\s*存$|^Save$/i }).click();
    await this.drawer.waitFor({ state: "hidden", timeout: UserPage.DRAWER_HIDDEN_TIMEOUT });
    await waitForTableReady(this.page, '[data-testid="user-table"]');
  }
}
