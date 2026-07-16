import type { Locator, Page } from '@host-tests/support/playwright';

import {
  closeDialogWithEscape,
  waitForBusyIndicatorsToClear,
  waitForDialogReady,
  waitForRouteReady,
  waitForTableReady,
} from '@host-tests/support/ui';

const DEPT_PAGE_READY_TIMEOUT = 90_000;

export class DeptPage {
  constructor(private page: Page) {}

  private topLevelDeptPattern = /顶级部门|Top-level Department/i;

  private get drawer() { return this.page.getByRole('dialog'); }
  private get table() { return this.page.getByTestId('org-dept-table'); }
  private rows(text?: string): Locator { const rows = this.table.locator('tbody tr:visible'); return text ? rows.filter({ hasText: text }) : rows; }

  private resolveLocalizedLabel(label: string) {
    const labelMap: Record<string, RegExp> = {
      部门名称: /部门名称|Dept Name/i,
      部门编码: /部门编码|Department Code/i,
      上级部门: /上级部门|Parent Dept\.?/i,
    };
    return this.page.getByLabel(labelMap[label] ?? label, { exact: !labelMap[label] }).first();
  }

  async goto() { await this.page.goto('/system/dept'); await waitForTableReady(this.page, '[data-testid="org-dept-table"]', DEPT_PAGE_READY_TIMEOUT); }
  async expandAll() { await this.page.getByRole('button', { name: /展\s*开|Expand/i }).first().click(); await waitForRouteReady(this.page); }
  async collapseAll() { await this.page.getByRole('button', { name: /折\s*叠|Collapse/i }).first().click(); await waitForRouteReady(this.page); }
  async fillSearchField(label: string, value: string) { const input = this.resolveLocalizedLabel(label); await input.waitFor({ state: 'visible', timeout: 10_000 }); await input.clear(); await input.fill(value); }
  async clickSearch() { await this.page.getByRole('button', { name: /搜\s*索|查\s*询|Search/i }).first().click(); await waitForRouteReady(this.page); }
  async clickReset() { await this.page.getByRole('button', { name: /重\s*置|Reset/i }).first().click(); await waitForRouteReady(this.page); }

  private async clickToolbarAdd() { const add = this.page.getByTestId('org-dept-add'); await add.waitFor({ state: 'visible', timeout: 10_000 }); await add.click(); }
  private async expectTopLevelParentSelected() { await this.drawer.getByText(this.topLevelDeptPattern).first().waitFor({ state: 'visible', timeout: 5_000 }); }
  private async closeDrawer() { await closeDialogWithEscape(this.page, this.drawer); }
  private async submitDrawer() { await this.drawer.getByRole('button', { name: /确\s*(认|定)|OK|Confirm/i }).click(); await this.waitForDrawerSubmitToSettle(); }

  async createRootDept(name: string, opts?: { code?: string }) {
    await this.clickToolbarAdd(); await waitForDialogReady(this.drawer); await this.expectTopLevelParentSelected();
    await this.drawer.getByRole('textbox', { name: /部门名称|Dept Name/i }).fill(name);
    if (opts?.code) await this.drawer.getByRole('textbox', { name: /部门编码|Department Code/i }).fill(opts.code);
    await this.submitDrawer();
  }

  async expectTopLevelParentOption() { await this.clickToolbarAdd(); await waitForDialogReady(this.drawer); await this.expectTopLevelParentSelected(); await this.closeDrawer(); }

  async createSubDept(parentName: string, name: string, opts?: { code?: string }) {
    await this.fillSearchField('部门名称', parentName); await this.clickSearch(); const row = this.rows(parentName).first(); await row.waitFor({ state: 'visible', timeout: 10_000 }); await row.getByRole('button', { name: /新\s*增|Add/i }).click(); await waitForDialogReady(this.drawer);
    await this.drawer.getByRole('textbox', { name: /部门名称|Dept Name/i }).fill(name); if (opts?.code) await this.drawer.getByRole('textbox', { name: /部门编码|Department Code/i }).fill(opts.code); await this.submitDrawer();
  }

  async editDept(deptName: string, newName: string, opts?: { code?: string }) {
    await this.fillSearchField('部门名称', deptName); await this.clickSearch(); const row = this.rows(deptName).first(); await row.waitFor({ state: 'visible', timeout: 10_000 }); await row.getByRole('button', { name: /编\s*辑|Edit/i }).click(); await waitForDialogReady(this.drawer);
    const name = this.drawer.getByRole('textbox', { name: /部门名称|Dept Name/i }); await name.clear(); await name.fill(newName); if (opts?.code) { const code = this.drawer.getByRole('textbox', { name: /部门编码|Department Code/i }); await code.clear(); await code.fill(opts.code); } await this.submitDrawer();
  }

  async deleteDept(deptName: string) {
    await this.expandAll(); await this.fillSearchField('部门名称', deptName); await this.clickSearch(); let row = this.rows(deptName).first(); if (!(await row.isVisible({ timeout: 1500 }).catch(() => false))) { await this.clickReset(); await this.expandAll(); await this.fillSearchField('部门名称', deptName); await this.clickSearch(); row = this.rows(deptName).first(); }
    await row.waitFor({ state: 'visible', timeout: 10_000 }); await row.getByRole('button', { name: /删\s*除|Delete/i }).click(); const overlay = this.page.locator('.semi-popover:visible').first(); await overlay.waitFor({ state: 'visible', timeout: 5_000 }); await overlay.getByRole('button', { name: /确\s*(认|定)|OK|Confirm/i }).click(); await waitForRouteReady(this.page);
  }

  async hasDept(deptName: string): Promise<boolean> { await this.fillSearchField('部门名称', deptName); await this.clickSearch(); return this.rows(deptName).first().isVisible({ timeout: 5_000 }).catch(() => false); }
  async hasDeptInExpandedTree(deptName: string): Promise<boolean> { await this.expandAll(); return this.rows(deptName).first().isVisible({ timeout: 5_000 }).catch(() => false); }
  async hasDeptWithCode(deptName: string, code: string): Promise<boolean> { await this.fillSearchField('部门名称', deptName); await this.clickSearch(); const row = this.rows(deptName).first(); if (!(await row.isVisible({ timeout: 5_000 }).catch(() => false))) return false; return (await row.textContent())?.includes(code) ?? false; }

  private async waitForDrawerSubmitToSettle() { await waitForRouteReady(this.page); const closed = await this.drawer.waitFor({ state: 'hidden', timeout: 1500 }).then(() => true).catch(() => false); if (!closed) await waitForBusyIndicatorsToClear(this.drawer); }
}
