import type { Page } from '@playwright/test';

import { workspacePath } from '../fixtures/config';
import {
  waitForBusyIndicatorsToClear,
  waitForConfirmOverlay,
  waitForDialogReady,
  waitForRouteReady,
} from '../support/ui';

export class MessagePage {
  constructor(private page: Page) {}

  get root() {
    return this.page.getByTestId('message-page');
  }

  get list() {
    return this.page.getByTestId('message-list');
  }

  get detailDialog() {
    return this.page
      .locator('.semi-modal-content[role="dialog"]:visible')
      .filter({ has: this.page.getByTestId('message-detail-dialog') })
      .last();
  }

  get indicatorTrigger() {
    return this.page.getByTestId('message-indicator-trigger');
  }

  get indicatorPopover() {
    return this.page.getByTestId('message-popover');
  }

  async goto() {
    await this.page.goto(workspacePath('/system/message'));
    await this.root.waitFor({ state: 'visible', timeout: 10000 });
    await waitForBusyIndicatorsToClear(this.root, 10000);
  }

  async gotoForListFeedback() {
    await this.page.goto(workspacePath('/system/message'), {
      waitUntil: 'domcontentloaded',
    });
    await this.root.waitFor({ state: 'visible', timeout: 10000 });
  }

  itemByTitle(title: string) {
    const exactTitle = new RegExp(`^\\s*${this.escapeRegex(title)}\\s*$`);
    return this.list
      .locator('.semi-list-item')
      .filter({
        has: this.page
          .locator('[data-testid^="message-title-"]')
          .filter({ hasText: exactTitle }),
      })
      .first();
  }

  async messageIdByTitle(title: string) {
    const titleElement = this.itemByTitle(title).locator(
      '[data-testid^="message-title-"]',
    );
    await titleElement.waitFor({ state: 'visible', timeout: 10000 });
    const testId = await titleElement.getAttribute('data-testid');
    const id = Number(testId?.replace('message-title-', ''));
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(`Unable to resolve message id for ${title}`);
    }
    return id;
  }

  async openMessage(title: string) {
    const id = await this.messageIdByTitle(title);
    await this.page.getByTestId(`message-row-${id}`).click();
    await waitForDialogReady(this.detailDialog);
    return { dialog: this.detailDialog, id };
  }

  async deleteMessage(title: string) {
    const id = await this.messageIdByTitle(title);
    await this.page.getByTestId(`message-delete-${id}`).click();
    await waitForRouteReady(this.page);
    return id;
  }

  async markAllRead() {
    await this.page.getByTestId('message-read-all').click();
    await waitForRouteReady(this.page);
  }

  async clearAll() {
    await this.page.getByTestId('message-clear').click();
    const overlay = await waitForConfirmOverlay(this.page);
    await overlay
      .getByRole('button', { name: /确\s*认|确\s*定|OK|Confirm/i })
      .click();
    await waitForRouteReady(this.page);
  }

  async openIndicator() {
    await this.indicatorTrigger.click();
    await this.indicatorPopover.waitFor({ state: 'visible', timeout: 5000 });
    await waitForBusyIndicatorsToClear(this.indicatorPopover, 10000);
  }

  async viewAllFromIndicator() {
    await this.indicatorPopover.getByTestId('message-popover-view-all').click();
    await waitForRouteReady(this.page);
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
