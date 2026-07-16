import type { Locator, Page } from '@playwright/test';

import {
  waitForBusyIndicatorsToClear,
  waitForRouteReady,
  waitForTableReady,
} from '../support/ui';

export class RoleAuthUserPage {
  constructor(private page: Page) {}

  private get root(): Locator {
    return this.page.getByTestId('role-auth-page');
  }

  private get usernameSearchInput(): Locator {
    return this.root
      .locator('.iam-search-form')
      .getByLabel(/用户账号|User Account|Account/i)
      .first();
  }

  userRow(username: string): Locator {
    return this.root.locator('.semi-table-tbody > .semi-table-row', { hasText: username }).first();
  }

  async goto(roleId: number) {
    await this.page.goto(`/system/role-auth/user/${roleId}`);
    await waitForTableReady(
      this.page,
      '[data-testid="role-auth-table"] .semi-table-container, [data-testid="role-auth-table"] .semi-table',
    );
    await this.usernameSearchInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  async searchByUsername(username: string) {
    await this.root.getByRole('button', { name: /重\s*置|Reset/i }).first().click();
    await waitForRouteReady(this.page);
    await waitForBusyIndicatorsToClear(this.root);
    await this.usernameSearchInput.clear();
    await this.usernameSearchInput.fill(username);
    await this.root.getByRole('button', { name: /搜\s*索|Search/i }).first().click();
    await waitForRouteReady(this.page);
    await waitForBusyIndicatorsToClear(this.root);
  }
}
