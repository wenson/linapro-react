import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { test, expect } from '@host-tests/fixtures/auth';
import { ensureSourcePluginEnabled } from '@host-tests/fixtures/plugin';
import { waitForRouteReady } from '@host-tests/support/ui';

const remediationScreenshotDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../../../temp/20260725/ui-audit-remediation',
);

test.describe('TC003 在线用户强制下线', () => {
  test.beforeEach(async ({ adminPage }) => {
    await ensureSourcePluginEnabled(adminPage, 'linapro-monitor-online');
  });

  test.beforeEach(async ({ adminPage }) => {
    const responsePromise = adminPage.waitForResponse(
      (res) =>
        res.url().includes('/x/linapro-monitor-online/api/v1/monitor/online/list') &&
        res.request().method() === 'GET' &&
        res.status() === 200,
      { timeout: 15000 },
    );
    await adminPage.goto('/monitor/online');
    await responsePromise;
    await waitForRouteReady(adminPage);
  });

  test('TC003a: 强制下线按钮显示确认弹窗', async ({ adminPage }) => {
    // Click the force logout button
    const forceLogoutBtn = adminPage
      .getByRole('button', { name: /强制下线/ })
      .first();
    await expect(forceLogoutBtn).toBeVisible();
    await forceLogoutBtn.click();

    // Popconfirm should appear
    await expect(
      adminPage.getByText(/确认强制下线/),
    ).toBeVisible();
  });

  test('TC003b: 取消强制下线不执行操作', async ({ adminPage }) => {
    const rows = adminPage.getByTestId('online-user-table').locator('tbody tr');
    const rowsBefore = await rows.count();

    // Click force logout
    const forceLogoutButton = adminPage
      .getByRole('button', { name: /强制下线/ })
      .first();
    await forceLogoutButton.click();

    // Cancel the popconfirm
    const overlay = adminPage.locator('.semi-popover:visible').first();
    await expect(overlay).toBeVisible();
    const cancelBtn = overlay.getByRole('button', { name: /取\s*消/ });
    await cancelBtn.first().click();
    await overlay.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    // Row count should remain the same
    const rowsAfter = await rows.count();
    expect(rowsAfter).toBe(rowsBefore);
    await expect(forceLogoutButton).toBeFocused();
    await adminPage.screenshot({
      path: resolve(
        remediationScreenshotDirectory,
        `${new Date().toISOString().replace(/[:.]/gu, '-').slice(0, 19)}-online-force-logout-cancelled.png`,
      ),
    });
  });
});
