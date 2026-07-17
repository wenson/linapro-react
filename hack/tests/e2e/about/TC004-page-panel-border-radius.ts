import type { Locator, Page } from '@playwright/test';

import { test, expect } from '../../fixtures/auth';
import { waitForRouteReady } from '../../support/ui';

async function readBorderRadius(locator: Locator): Promise<string> {
  await expect(locator).toBeVisible();
  return locator.evaluate((el) => getComputedStyle(el).borderRadius);
}

test.describe('TC-4 后台页面板块圆角统一', () => {
  test('TC-4a: 系统信息 Semi Card 使用非尖角圆角', async ({
    adminPage,
  }) => {
    await adminPage.goto('/about/system-info');
    await waitForRouteReady(adminPage);

    const firstCard = adminPage.getByTestId('system-info-about');
    const radius = await readBorderRadius(firstCard);

    expect(radius).not.toBe('0px');
  });

  test('TC-4b: 同页系统信息卡片使用一致圆角', async ({
    adminPage,
  }) => {
    await adminPage.goto('/about/system-info');
    await waitForRouteReady(adminPage);
    const aboutRadius = await readBorderRadius(adminPage.getByTestId('system-info-about'));
    const backendRadius = await readBorderRadius(adminPage.getByTestId('system-info-backend'));
    const frontendRadius = await readBorderRadius(adminPage.getByTestId('system-info-frontend'));

    expect(backendRadius).toBe(aboutRadius);
    expect(frontendRadius).toBe(aboutRadius);
  });

});
