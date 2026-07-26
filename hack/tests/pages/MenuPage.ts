import type { Locator, Page } from "@playwright/test";

import { expect } from "@playwright/test";

import {
  waitForBusyIndicatorsToClear,
  waitForDialogReady,
  waitForRouteReady,
  waitForTableReady,
} from "../support/ui";

type MenuType = "B" | "D" | "M";

type MenuFormParams = {
  component?: string;
  icon?: string;
  name: string;
  path?: string;
  perms?: string;
  sort?: number;
  status?: number;
  type: MenuType;
  visible?: number;
};

const menuTypeLabels: Record<MenuType, RegExp> = {
  B: /^按\s*钮$|^Button$/i,
  D: /^目\s*录$|^Directory$/i,
  M: /^菜\s*单$|^Menu$/i,
};

export class MenuPage {
  constructor(private page: Page) {}

  get table() {
    return this.page.getByTestId("menu-table");
  }

  get drawer() {
    return this.page.locator('.semi-sidesheet-inner[role="dialog"]').last();
  }

  get cascadeDeleteControl() {
    return this.page
      .locator(".iam-toolbar .semi-checkbox")
      .filter({ hasText: /级联删除|Cascade delete/i });
  }

  get cascadeDeleteCheckbox() {
    return this.cascadeDeleteControl.getByRole("checkbox");
  }

  private get rows() {
    return this.table.locator(".semi-table-tbody > .semi-table-row");
  }

  private row(menuName: string) {
    return this.rows.filter({ hasText: menuName }).first();
  }

  private formField(label: RegExp) {
    return this.drawer
      .locator(".semi-form-field")
      .filter({ hasText: label })
      .first();
  }

  async goto() {
    await this.page.goto("/system/menu");
    await waitForTableReady(this.page, '[data-testid="menu-table"]');
  }

  async openCreateDrawer() {
    await this.page
      .getByRole("button", { name: /^新\s*增$|^Add$/i })
      .first()
      .click();
    return waitForDialogReady(this.drawer);
  }

  async openEditDrawer(menuName: string) {
    await this.row(menuName)
      .getByRole("button", { name: /^编\s*辑$|^Edit$/i })
      .click();
    return waitForDialogReady(this.drawer);
  }

  async openAddChildDrawer(parentName: string) {
    await this.row(parentName)
      .getByRole("button", { name: /新增子项|Add child/i })
      .click();
    return waitForDialogReady(this.drawer);
  }

  async closeDrawer() {
    await this.drawer
      .getByRole("button", { name: /^取\s*消$|^Cancel$/i })
      .click();
    await this.drawer.waitFor({ state: "hidden", timeout: 5_000 });
  }

  async selectMenuType(type: MenuType) {
    const control = this.formField(/菜单类型|Menu type/i)
      .locator(".semi-radio")
      .filter({ hasText: menuTypeLabels[type] });
    await expect(control).toBeVisible({ timeout: 5_000 });
    await control.click({ timeout: 5_000 });
    await waitForBusyIndicatorsToClear(this.drawer);
  }

  async expandAll() {
    const expandButton = this.page
      .getByRole("button", { name: /展开全部|Expand all|展\s*开/i })
      .first();
    if (await expandButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await expandButton.click();
      await waitForBusyIndicatorsToClear(this.page);
    }
  }

  async collapseAll() {
    const collapseButton = this.page
      .getByRole("button", { name: /折叠全部|Collapse all|折\s*叠/i })
      .first();
    if (await collapseButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await collapseButton.click();
      await waitForBusyIndicatorsToClear(this.page);
    }
  }

  async revealMenuRow(menuName: string) {
    const target = this.row(menuName);
    if (!(await target.isVisible().catch(() => false))) {
      await this.searchMenu(menuName);
    }
    await expect(this.row(menuName)).toBeVisible({ timeout: 10_000 });
  }

  async expandMenuRow(menuName: string) {
    const target = this.row(menuName);
    await expect(target).toBeVisible();
    const trigger = target
      .locator('.semi-table-row-expand-icon, button[aria-label*="expand" i]')
      .first();
    if (await trigger.isVisible().catch(() => false)) {
      const expanded = await trigger.getAttribute("aria-expanded");
      if (expanded !== "true") {
        await trigger.click();
        await waitForBusyIndicatorsToClear(this.table);
      }
    }
  }

  statusSwitch(menuName: string) {
    return this.row(menuName).getByTestId("menu-status-switch").getByRole("switch");
  }

  visibleSwitch(menuName: string) {
    return this.row(menuName).getByTestId("menu-visible-switch").getByRole("switch");
  }

  async toggleStatus(menuName: string) {
    await this.statusSwitch(menuName).click();
    await waitForBusyIndicatorsToClear(this.table);
  }

  async toggleVisible(menuName: string) {
    await this.visibleSwitch(menuName).click();
    await waitForBusyIndicatorsToClear(this.table);
  }

  async createRootMenu(params: MenuFormParams) {
    await this.openCreateDrawer();
    await this.fillMenuForm(params);
    await this.saveDrawer();
  }

  async createSubMenu(parentName: string, params: MenuFormParams) {
    await this.expandAll();
    await this.openAddChildDrawer(parentName);
    await this.fillMenuForm(params);
    await this.saveDrawer();
  }

  async editMenu(menuName: string, newName: string) {
    await this.openEditDrawer(menuName);
    const nameInput = this.drawer.getByRole("textbox", {
      name: /菜单名称|Menu name/i,
    });
    await nameInput.fill(newName);
    await this.saveDrawer();
  }

  async deleteMenu(menuName: string, cascade = false) {
    await this.setCascadeDelete(cascade);
    await this.row(menuName)
      .getByRole("button", { name: /^删\s*除$|^Delete$/i })
      .click();
    const popconfirm = this.page.locator(".semi-popover:visible").last();
    await popconfirm.waitFor({ state: "visible", timeout: 5_000 });
    await popconfirm
      .getByRole("button", {
        name: /^确\s*认$|^确\s*定$|^Confirm$|^OK$/i,
      })
      .click();
    await waitForRouteReady(this.page);
    await waitForTableReady(this.page, '[data-testid="menu-table"]');
  }

  async deleteMenuByName(menuName: string, cascade = false) {
    await this.searchMenu(menuName);
    await this.deleteMenu(menuName, cascade);
    await this.resetSearch();
  }

  async hasMenu(menuName: string): Promise<boolean> {
    return this.row(menuName)
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async searchMenu(name: string) {
    await this.page
      .getByRole("textbox", { name: /菜单名称|Menu name/i })
      .first()
      .fill(name);
    await this.page
      .getByRole("button", { name: /^搜\s*索$|^Search$/i })
      .first()
      .click();
    await waitForTableReady(this.page, '[data-testid="menu-table"]');
  }

  async resetSearch() {
    await this.page
      .getByRole("button", { name: /^重\s*置$|^Reset$/i })
      .first()
      .click();
    await waitForTableReady(this.page, '[data-testid="menu-table"]');
  }

  async navigateTo() {
    await this.goto();
  }

  async updateMenuVisibility(menuName: string, visible: 0 | 1) {
    await this.searchMenu(menuName);
    try {
      await this.openEditDrawer(menuName);
      const visibleField = this.formField(/是否显示|Visible/i);
      await visibleField
        .locator(".semi-radio")
        .filter({
          hasText: visible === 1 ? /^是$|^Yes$/i : /^否$|^No$/i,
        })
        .click();
      await this.saveDrawer();
    } finally {
      if (!this.page.isClosed()) {
        await this.resetSearch().catch(() => {});
      }
    }
  }

  async expectSidebarContains(label: string, timeout = 10_000) {
    await expect(this.page.locator("aside").first()).toContainText(label, {
      timeout,
    });
  }

  async expectSidebarNotContains(label: string, timeout = 10_000) {
    await expect(this.page.locator("aside").first()).not.toContainText(label, {
      timeout,
    });
  }

  async expectLayoutHeightStable(sampleCount = 4, intervalMs = 400) {
    const samples: number[] = [];
    await expect
      .poll(
        async () => {
          samples.push(
            await this.page.evaluate(
              () => document.documentElement.scrollHeight,
            ),
          );
          if (samples.length > sampleCount) samples.shift();
          if (samples.length < sampleCount) return Number.MAX_SAFE_INTEGER;
          return Math.max(...samples) - Math.min(...samples);
        },
        {
          intervals: Array(sampleCount + 2).fill(intervalMs),
          message: `菜单管理页高度未稳定，采样结果: ${samples.join(", ")}`,
          timeout: intervalMs * (sampleCount + 3),
        },
      )
      .toBeLessThanOrEqual(16);
  }

  private async fillMenuForm(params: MenuFormParams) {
    if (params.type !== "D") {
      await this.selectMenuType(params.type);
    }
    await this.drawer
      .getByRole("textbox", { name: /菜单名称|Menu name/i })
      .fill(params.name);
    if (params.icon && params.type !== "B") {
      await this.drawer
        .getByRole("textbox", { name: /菜单图标|Menu icon/i })
        .fill(params.icon);
    }
    if (params.perms && params.type !== "D") {
      await this.drawer
        .getByRole("textbox", { name: /权限标识|Permission/i })
        .fill(params.perms);
    }
    if (params.path && params.type !== "B") {
      await this.drawer
        .getByRole("textbox", { name: /路由路径|Route path/i })
        .fill(params.path);
    }
    if (params.component && params.type === "M") {
      await this.drawer
        .getByRole("textbox", { name: /组件路径|Component path/i })
        .fill(params.component);
    }
    if (params.sort !== undefined) {
      await this.drawer
        .getByRole("spinbutton", { name: /排序|Sort/i })
        .fill(String(params.sort));
    }
    if (params.visible !== undefined && params.type !== "B") {
      const field = this.formField(/是否显示|Visible/i);
      await field
        .locator(".semi-radio")
        .filter({
          hasText:
            params.visible === 1 ? /^是$|^Yes$/i : /^否$|^No$/i,
        })
        .click();
    }
    if (params.status !== undefined) {
      const field = this.formField(/^状态|Status/i);
      await field
        .locator(".semi-radio")
        .filter({
          hasText:
            params.status === 1
              ? /^启\s*用$|^Enabled$/i
              : /^禁\s*用$|^Disabled$/i,
        })
        .click();
    }
  }

  private async saveDrawer() {
    await this.drawer
      .getByRole("button", { name: /^保\s*存$|^Save$/i })
      .click();
    await this.drawer.waitFor({ state: "hidden", timeout: 15_000 });
    await waitForRouteReady(this.page);
    await waitForTableReady(this.page, '[data-testid="menu-table"]');
  }

  private async setCascadeDelete(checked: boolean) {
    if ((await this.cascadeDeleteCheckbox.isChecked()) !== checked) {
      await this.cascadeDeleteControl.click();
    }
    await expect(this.cascadeDeleteCheckbox).toBeChecked({ checked });
  }
}
