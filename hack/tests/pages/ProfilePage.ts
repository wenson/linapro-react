import type { Locator, Page } from '@playwright/test';

import { waitForRouteReady } from '../support/ui';
import { captureEvidence } from '../support/evidence';

export class ProfilePage {
  constructor(private page: Page) {}

  get profilePanel(): Locator {
    return this.page.getByTestId('profile-page').locator('.semi-card').first();
  }

  get loadingSkeleton(): Locator {
    return this.page.getByTestId('profile-loading-skeleton');
  }

  get nicknameInput(): Locator {
    return this.page.getByLabel(/昵称|Display name/i).first();
  }

  get passwordTab(): Locator {
    return this.page.getByRole('tab', { name: /密码|Password/i }).first();
  }

  get passwordForm(): Locator {
    return this.page.getByTestId('profile-password-form');
  }

  get oldPasswordInput(): Locator {
    return this.passwordForm.getByLabel(/当前密码|Current password/i).first();
  }

  get newPasswordInput(): Locator {
    return this.passwordForm.getByLabel(/新密码|New password/i).first();
  }

  get confirmPasswordInput(): Locator {
    return this.passwordForm.getByLabel(/确认密码|Confirm password/i).first();
  }

  get submitPasswordButton(): Locator {
    return this.passwordForm
      .getByRole('button', {
        name: /修\s*改\s*密\s*码|更\s*新\s*密\s*码|Update password|Change password|Submit/i,
      })
      .first();
  }

  panelDisplayName(name: string): Locator {
    return this.profilePanel.getByText(name, { exact: true }).first();
  }

  async goto() {
    await this.page.goto('/profile');
    await waitForRouteReady(this.page);
    await this.nicknameInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  async gotoAndObserveLoading(delayMs = 800) {
    let requestCount = 0;
    await this.page.route('**/api/v1/user/profile', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      requestCount += 1;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.continue();
    });
    await this.page.goto('/profile', { waitUntil: 'domcontentloaded' });
    await this.loadingSkeleton.waitFor({ state: 'visible', timeout: 10_000 });
    return {
      requestCount: () => requestCount,
      waitForLoaded: async () => {
        await this.nicknameInput.waitFor({ state: 'visible', timeout: 15_000 });
        await this.page.unroute('**/api/v1/user/profile');
      },
    };
  }

  async capture(name: string) {
    return captureEvidence(this.page, name);
  }

  async openPasswordTab() {
    await this.passwordTab.click();
    await waitForRouteReady(this.page);
    await this.passwordForm.waitFor({ state: 'visible', timeout: 10000 });
  }

  async submitPasswordChange(oldPassword: string, newPassword: string) {
    await this.oldPasswordInput.fill(oldPassword);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(newPassword);
    await this.submitPasswordButton.click();
  }
}
