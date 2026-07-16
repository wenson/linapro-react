import type { Locator, Page } from '@host-tests/support/playwright';

import { waitForBusyIndicatorsToClear, waitForDialogReady, waitForRouteReady, waitForTableReady } from '@host-tests/support/ui';

export class PostPage {
  constructor(private page: Page) {}
  private get drawer() { return this.page.getByRole('dialog'); }
  private get table() { return this.page.getByTestId('org-post-table'); }
  private rows(text?: string): Locator { const rows = this.table.locator('tbody tr:visible'); return text ? rows.filter({ hasText: text }) : rows; }

  async goto() { await this.page.goto('/system/post'); await waitForTableReady(this.page, '[data-testid="org-post-table"]'); }
  async selectDept(deptName: string) { await this.page.getByTestId('org-post-dept-tree').getByRole('treeitem', { name: new RegExp(deptName) }).click(); await waitForRouteReady(this.page); }
  async hasVisibleDeptNode(deptName: string): Promise<boolean> { return this.page.getByTestId('org-post-dept-tree').getByRole('treeitem', { name: new RegExp(deptName) }).isVisible({ timeout: 5_000 }).catch(() => false); }

  async createPost(deptName: string, code: string, name: string) {
    await this.page.getByTestId('org-post-add').click(); await waitForDialogReady(this.drawer); await this.drawer.getByRole('combobox', { name: /所属部门|Department/i }).click(); const tree = this.page.getByRole('tree').last(); await tree.getByRole('treeitem', { name: new RegExp(deptName) }).click(); await waitForBusyIndicatorsToClear(this.page); await this.drawer.getByRole('textbox', { name: /岗位名称|Name/i }).fill(name); await this.drawer.getByRole('textbox', { name: /岗位编码|Code/i }).fill(code); await this.drawer.getByRole('button', { name: /确\s*(认|定)|OK|Confirm/i }).click(); await waitForRouteReady(this.page); await this.drawer.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async editPost(code: string, newName: string) { await this.fillSearchField('岗位编码', code); await this.clickSearch(); const row = this.rows(code).first(); await row.getByRole('button', { name: /编\s*辑|Edit/i }).click(); await waitForDialogReady(this.drawer); const name = this.drawer.getByRole('textbox', { name: /岗位名称|Name/i }); await name.clear(); await name.fill(newName); await this.drawer.getByRole('button', { name: /确\s*(认|定)|OK|Confirm/i }).click(); await waitForRouteReady(this.page); await this.drawer.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {}); }

  async deletePost(code: string) { await this.fillSearchField('岗位编码', code); await this.clickSearch(); const row = this.rows(code).first(); await row.getByRole('button', { name: /删\s*除|Delete/i }).click(); const overlay = this.page.locator('.semi-popover:visible').first(); await overlay.waitFor({ state: 'visible', timeout: 5_000 }); await overlay.getByRole('button', { name: /确\s*(认|定)|OK|Confirm/i }).click(); await waitForRouteReady(this.page); }
  async hasPost(code: string): Promise<boolean> { await this.fillSearchField('岗位编码', code); await this.clickSearch(); return this.rows(code).first().isVisible({ timeout: 5_000 }).catch(() => false); }
  async hasPostName(name: string): Promise<boolean> { return this.rows(name).first().isVisible({ timeout: 5_000 }).catch(() => false); }
  async clickExport() { await this.page.getByRole('button', { name: /导\s*出|Export/i }).click(); await waitForDialogReady(this.page.getByRole('dialog')); }
  async selectRow(code: string) { await this.fillSearchField('岗位编码', code); await this.clickSearch(); await this.rows(code).first().getByRole('checkbox').click(); await waitForBusyIndicatorsToClear(this.page); }
  async batchDelete() { await this.page.getByTestId('org-post-batch-delete').click(); const dialog = await waitForDialogReady(this.page.getByRole('dialog')); await dialog.getByRole('button', { name: /确\s*(认|定)|OK|Confirm/i }).click(); await waitForRouteReady(this.page); }
  async fillSearchField(label: string, value: string) { const input = this.page.getByLabel(label, { exact: true }).first(); await input.clear(); await input.fill(value); }
  async clickSearch() { await this.page.getByRole('button', { name: /搜\s*索|查\s*询|Search/i }).first().click(); await waitForRouteReady(this.page); }
  async clickReset() { await this.page.getByRole('button', { name: /重\s*置|Reset/i }).first().click(); await waitForRouteReady(this.page); }
  async getTotalCount(): Promise<number> { const text = await this.table.locator('.semi-page-total').textContent(); return Number(text?.match(/\d+/)?.[0] ?? 0); }
}
