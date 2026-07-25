import type { Page } from '@playwright/test';

import {
  waitForBusyIndicatorsToClear,
  waitForConfirmOverlay,
  waitForDialogReady,
  waitForDropdown,
  waitForRouteReady,
  waitForTableReady,
} from '../support/ui';

export class FilePage {
  constructor(private page: Page) {}

  get root() {
    return this.page.getByTestId('file-page');
  }

  get table() {
    return this.page.getByTestId('file-table');
  }

  get rows() {
    return this.table.locator('.semi-table-tbody > .semi-table-row');
  }

  get searchForm() {
    return this.page.getByTestId('file-page').locator('.iam-search-form').first();
  }

  get previewSwitch() {
    return this.page.getByTestId('file-preview-switch').getByRole('switch');
  }

  get uploadDialog() {
    return this.page.locator('.semi-modal-content[role="dialog"]:visible').last();
  }

  get detailDialog() {
    return this.page
      .locator('.semi-modal-content[role="dialog"]:visible')
      .filter({ hasText: /详情|Details/i })
      .last();
  }

  async goto() {
    await this.page.goto('/system/file');
    await waitForTableReady(this.page, '[data-testid="file-table"]');
  }

  async gotoForListFeedback() {
    await this.page.goto('/system/file', { waitUntil: 'domcontentloaded' });
    await this.root.waitFor({ state: 'visible', timeout: 10000 });
  }

  /** Get the count of rows in the file list table */
  async getRowCount(): Promise<number> {
    return this.rows.count();
  }

  rowByOriginal(originalName: string) {
    return this.rows
      .filter({
        has: this.page
          .locator('[data-testid^="file-original-"]')
          .filter({ hasText: new RegExp(`^\\s*${this.escapeRegex(originalName)}\\s*$`) }),
      })
      .first();
  }

  async rowIdByOriginal(originalName: string): Promise<number> {
    const original = this.rowByOriginal(originalName).locator(
      '[data-testid^="file-original-"]',
    );
    await original.waitFor({ state: 'visible', timeout: 10000 });
    const testId = await original.getAttribute('data-testid');
    const id = Number(testId?.replace('file-original-', ''));
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(`Unable to resolve file id for ${originalName}`);
    }
    return id;
  }

  /** Check if a file with the given name exists in the table. */
  async hasFile(originalName: string): Promise<boolean> {
    return this.rowByOriginal(originalName)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  /** Click the file upload button to open upload modal */
  async openFileUploadModal() {
    await this.page
      .getByRole('button', { name: /文件上传|Upload file/i })
      .click();
    return waitForDialogReady(this.uploadDialog);
  }

  /** Click the image upload button to open upload modal */
  async openImageUploadModal() {
    await this.page
      .getByRole('button', { name: /图片上传|Upload image/i })
      .click();
    return waitForDialogReady(this.uploadDialog);
  }

  async uploadFile(filePath: string) {
    const input = this.uploadDialog.locator('input.semi-upload-hidden-input').first();
    await input.setInputFiles(filePath);
    await waitForBusyIndicatorsToClear(this.uploadDialog, 15000);
  }

  async closeUploadDialog() {
    const closeButton = this.uploadDialog.locator('.semi-modal-close').first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
    await this.uploadDialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  async searchByOriginal(originalName: string) {
    const input = this.searchForm.getByLabel(/原始文件名|Original file name/i).first();
    await input.fill(originalName);
    await this.searchForm
      .getByRole('button', { name: /搜\s*索|Search/i })
      .click();
    await waitForRouteReady(this.page);
  }

  async resetSearch() {
    await this.searchForm
      .getByRole('button', { name: /重\s*置|Reset/i })
      .click();
    await waitForRouteReady(this.page);
  }

  async selectSearchOption(label: RegExp, optionText: string) {
    await this.searchForm.getByLabel(label).first().click();
    const dropdown = await waitForDropdown(this.page);
    const option = dropdown
      .locator('.semi-select-option:visible')
      .filter({ hasText: new RegExp(`^\\s*${this.escapeRegex(optionText)}\\s*$`) })
      .first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
    return dropdown;
  }

  async submitSearch() {
    await this.searchForm
      .getByRole('button', { name: /搜\s*索|Search/i })
      .click();
    await waitForRouteReady(this.page);
  }

  async openDetail(id: number) {
    await this.page.getByTestId(`file-detail-${id}`).click();
    return waitForDialogReady(this.detailDialog);
  }

  async selectFile(id: number) {
    const row = this.table.locator('.semi-table-row', {
      has: this.page.getByTestId(`file-original-${id}`),
    });
    await row.locator('.semi-checkbox').first().click();
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Delete a file row by original name */
  async deleteFile(originalName: string) {
    const id = await this.rowIdByOriginal(originalName);
    await this.page.getByTestId(`file-delete-${id}`).click();
    const overlay = await waitForConfirmOverlay(this.page);
    await overlay
      .getByRole('button', { name: /确\s*定|确\s*认|OK|Confirm|Yes/i })
      .click();
    await waitForRouteReady(this.page);
  }
}
