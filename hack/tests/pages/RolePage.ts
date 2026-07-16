import { expect, type Locator, type Page } from "@playwright/test";

import {
  waitForBusyIndicatorsToClear,
  waitForDialogReady,
  waitForRouteReady,
  waitForTableReady,
} from "../support/ui";

export class RolePage {
  constructor(private page: Page) {}

  get table() {
    return this.page.getByTestId("role-table");
  }

  get drawer() {
    return this.page.locator('.semi-sidesheet-inner[role="dialog"]').last();
  }

  private get roleRows() {
    return this.table.locator(".semi-table-tbody > .semi-table-row");
  }

  private get roleNameSearchInput() {
    return this.page.getByTestId("role-name-search-input");
  }

  private dataScopeField(drawer: Locator) {
    return drawer
      .locator(".semi-form-field")
      .filter({ hasText: /数据权限|Data scope/i })
      .first();
  }

  roleRowByName(roleName: string): Locator {
    return this.roleRows.filter({ hasText: roleName }).first();
  }

  roleRowByKey(roleKey: string): Locator {
    return this.roleRows.filter({ hasText: roleKey }).first();
  }

  async roleRowTextByKey(roleKey: string): Promise<string> {
    return (await this.roleRowByKey(roleKey).innerText()).trim();
  }

  async selectDataScope(drawer: Locator, label: string | RegExp) {
    const combobox = this.dataScopeField(drawer).getByRole("combobox");
    await combobox.click();
    await this.page.getByRole("option", { name: label, exact: typeof label === "string" }).click();
  }

  async getDataScopeOptions(drawer: Locator) {
    await this.dataScopeField(drawer).getByRole("combobox").click();
    const options = this.page.getByRole("option");
    await expect(options.first()).toBeVisible({ timeout: 5_000 });
    const labels = (await options.allTextContents()).map((label) => label.trim()).filter(Boolean);
    await this.page.keyboard.press("Escape");
    return labels;
  }

  async selectedDataScopeText(drawer: Locator) {
    return (
      await this.dataScopeField(drawer)
        .locator(".semi-select-selection-text")
        .innerText()
    ).trim();
  }

  async goto() {
    await this.page.goto("/system/role");
    await waitForTableReady(this.page, '[data-testid="role-table"]');
    await this.roleNameSearchInput.waitFor({ state: "visible", timeout: 10_000 });
  }

  async openCreateDrawer(options: { keepTourOpen?: boolean } = {}) {
    await waitForRouteReady(this.page);
    await this.markPermissionGuideRead(options);
    await this.page
      .getByRole("button", { name: /^新\s*增$|^Add$/i })
      .first()
      .click();
    const drawer = await waitForDialogReady(this.drawer, 15_000);
    await this.waitForPermissionTreeReady(drawer);
    return drawer;
  }

  async openEditDrawer(
    roleName: string,
    options: { keepTourOpen?: boolean } = {},
  ) {
    await waitForRouteReady(this.page);
    await this.markPermissionGuideRead(options);
    const row = this.roleRowByName(roleName);
    await row.waitFor({ state: "visible", timeout: 10_000 });
    await row.getByRole("button", { name: /^编\s*辑$|^Edit$/i }).click();
    const drawer = await waitForDialogReady(this.drawer, 15_000);
    await this.waitForPermissionTreeReady(drawer);
    return drawer;
  }

  async waitForDrawerHidden(timeout = 10_000) {
    await this.drawer.waitFor({ state: "hidden", timeout });
  }

  async clickDrawerCloseIcon(drawer: Locator) {
    await drawer.locator(".semi-sidesheet-close").click();
  }

  async clickDrawerOverlay() {
    await this.page.locator(".semi-sidesheet-mask:visible").click({
      position: { x: 10, y: 10 },
    });
  }

  async expectMenuSelectionMode(
    drawer: Locator,
    mode: "independent" | "linked",
  ) {
    const label = mode === "linked"
      ? /父子联动|Parent-child linked/i
      : /独立选择|Independent selection/i;
    const control = drawer.getByTestId("menu-permission-association-mode");
    await expect(control.getByText(label)).toBeVisible();
    await expect(control).toHaveAttribute("data-selection-mode", mode);
  }

  async switchMenuSelectionMode(
    drawer: Locator,
    mode: "independent" | "linked",
  ) {
    const label = mode === "linked"
      ? /父子联动|Parent-child linked/i
      : /独立选择|Independent selection/i;
    const control = drawer.getByTestId("menu-permission-association-mode");
    await control.getByText(label).click({ timeout: 5_000 });
    await expect(control).toHaveAttribute("data-selection-mode", mode);
  }

  async submitDrawer(drawer: Locator) {
    await drawer.getByRole("button", { name: /^保\s*存$|^Save$/i }).click();
  }

  async createRole(params: {
    name: string;
    code: string;
    sort?: number;
    status?: number;
    remark?: string;
  }) {
    const drawer = await this.openCreateDrawer();
    await drawer.getByRole("textbox", { name: /角色名称|Role name/i }).fill(params.name);
    await drawer.getByRole("textbox", { name: /权限字符|Permission key/i }).fill(params.code);
    if (params.sort !== undefined) {
      await drawer.getByRole("spinbutton", { name: /排序|Sort/i }).fill(String(params.sort));
    }
    if (params.remark) {
      await drawer.getByRole("textbox", { name: /备注|Remark/i }).fill(params.remark);
    }
    if (params.status === 0) {
      const disabled = drawer.getByRole("radio", { name: /禁用|Disabled/i });
      await disabled.locator("xpath=ancestor::*[contains(@class, 'semi-radio')][1]").click();
    }
    await this.selectDataScope(drawer, /全部数据|All data/i);

    const response = this.waitForRoleMutationResponse("POST");
    await this.submitDrawer(drawer);
    await response;
    await this.waitForDrawerHidden(15_000);
    await waitForTableReady(this.page, '[data-testid="role-table"]');
  }

  async editRole(roleName: string, newName: string) {
    const drawer = await this.openEditDrawer(roleName);
    const nameInput = drawer.getByRole("textbox", { name: /角色名称|Role name/i });
    await expect(nameInput).toHaveValue(roleName, { timeout: 10_000 });
    await nameInput.fill(newName);

    const response = this.waitForRoleMutationResponse("PUT");
    await this.submitDrawer(drawer);
    await response;
    await this.waitForDrawerHidden(15_000);
    await waitForTableReady(this.page, '[data-testid="role-table"]');
  }

  async deleteRole(roleName: string) {
    const row = this.roleRowByName(roleName);
    await row.getByRole("button", { name: /^删\s*除$|^Delete$/i }).click();
    const popconfirm = this.page.locator(".semi-popover:visible").last();
    await popconfirm.waitFor({ state: "visible", timeout: 5_000 });
    await popconfirm
      .getByRole("button", { name: /^确\s*认$|^确\s*定$|^Confirm$|^OK$/i })
      .click();
    await waitForTableReady(this.page, '[data-testid="role-table"]');
  }

  async hasRole(roleName: string): Promise<boolean> {
    return this.roleRowByName(roleName)
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async searchRole(name: string) {
    await this.roleNameSearchInput.fill(name);
    await this.page
      .getByRole("button", { name: /^搜\s*索$|^Search$/i })
      .first()
      .click();
    await waitForTableReady(this.page, '[data-testid="role-table"]');
  }

  async resetSearch() {
    await this.page
      .getByRole("button", { name: /^重\s*置$|^Reset$/i })
      .first()
      .click();
    await waitForTableReady(this.page, '[data-testid="role-table"]');
  }

  async selectVisibleRoleRows(roleNames: string[]) {
    for (const roleName of roleNames) {
      const row = this.roleRowByName(roleName);
      await row.waitFor({ state: "visible", timeout: 10_000 });
      await row.locator(".semi-checkbox").first().click();
      await expect(row.getByRole("checkbox")).toBeChecked();
    }
  }

  async confirmSelectedRoleBatchDelete() {
    await this.page.getByRole("button", { name: /^删\s*除$|^Delete$/i }).first().click();
    const modal = this.page.locator('.semi-modal-content[role="dialog"]:visible').last();
    await modal.waitFor({ state: "visible", timeout: 5_000 });
    await modal
      .getByRole("button", { name: /^确\s*认$|^确\s*定$|^Confirm$|^OK$/i })
      .click();
    await waitForBusyIndicatorsToClear(this.page);
  }

  async toggleStatus(roleName: string) {
    const row = this.roleRowByName(roleName);
    const switchButton = row.getByRole("switch");
    const before = await switchButton.getAttribute("aria-checked");
    await switchButton.click();
    await expect(switchButton).not.toHaveAttribute("aria-checked", before ?? "");
  }

  async clickAssign(roleName: string) {
    await this.roleRowByName(roleName)
      .getByRole("button", { name: /授权用户|Authorize users/i })
      .click();
    await this.page.waitForURL(/\/system\/role-auth\/user\/\d+/, { timeout: 10_000 });
    await waitForTableReady(this.page, '[data-testid="role-auth-table"]');
  }

  async clickFirstAssign() {
    const button = this.table
      .getByRole("button", { name: /授权用户|Authorize users/i })
      .first();
    await expect(button).toBeVisible({ timeout: 10_000 });
    await button.click();
    await this.page.waitForURL(/\/system\/role-auth\/user\/\d+/, { timeout: 10_000 });
    await waitForTableReady(this.page, '[data-testid="role-auth-table"]');
  }

  async assignMenusToRole(roleName: string, menuNames: string[]) {
    const drawer = await this.openEditDrawer(roleName);
    await expect(
      drawer.getByRole("textbox", { name: /角色名称|Role name/i }),
    ).toHaveValue(roleName, { timeout: 10_000 });

    for (const menuName of menuNames) {
      const option = drawer
        .getByTestId("menu-permission-tree")
        .locator(".semi-tree-option")
        .filter({ hasText: menuName })
        .first();
      await option.waitFor({ state: "visible", timeout: 10_000 });
      const checkbox = option.getByRole("checkbox");
      if (!(await checkbox.isChecked())) {
        await option.locator(".semi-checkbox").click();
      }
      await expect(checkbox).toBeChecked();
    }

    const response = this.waitForRoleMutationResponse("PUT");
    await this.submitDrawer(drawer);
    await response;
    await this.waitForDrawerHidden(15_000);
  }

  async isStatusSwitchDisabled(roleName: string): Promise<boolean> {
    await this.searchRole(roleName);
    return this.roleRowByName(roleName).getByRole("switch").isDisabled();
  }

  async isCheckboxDisabled(roleName: string): Promise<boolean> {
    await this.searchRole(roleName);
    return this.roleRowByName(roleName).getByRole("checkbox").isDisabled();
  }

  private async markPermissionGuideRead(options: { keepTourOpen?: boolean }) {
    await this.page.evaluate(({ keepOpen, key }) => {
      if (keepOpen) localStorage.removeItem(key);
      else localStorage.setItem(key, "true");
    }, { keepOpen: options.keepTourOpen === true, key: "menu_select_fullscreen_read" });
  }

  private async waitForRoleMutationResponse(method: "POST" | "PUT") {
    const response = await this.page.waitForResponse((target) => {
      const request = target.request();
      const path = new URL(target.url()).pathname.replace(/\/$/, "");
      if (request.method() !== method) return false;
      return method === "POST"
        ? path === "/api/v1/role"
        : /^\/api\/v1\/role\/[^/]+$/.test(path);
    }, { timeout: 15_000 });
    expect(response.ok()).toBeTruthy();
  }

  private async waitForPermissionTreeReady(drawer: Locator) {
    await drawer.getByTestId("role-drawer-form").waitFor({ state: "visible", timeout: 15_000 });
    await drawer.getByTestId("menu-permission-toolbar").waitFor({ state: "visible", timeout: 15_000 });
    await expect(
      drawer.getByTestId("menu-permission-tree").locator(".semi-tree-option").first(),
    ).toBeVisible({ timeout: 15_000 });
    await waitForBusyIndicatorsToClear(drawer, 15_000);
  }
}
