import type { Locator } from '@host-tests/support/playwright';

import { test, expect } from '@host-tests/fixtures/auth';
import { ensureSourcePluginEnabled } from '@host-tests/fixtures/plugin';
import {
  waitForDialogReady,
  waitForRouteReady,
  waitForTableReady,
} from '@host-tests/support/ui';

async function fillModalRange(dialog: Locator, start: string, end: string) {
  const rangeInputs = dialog.locator('input[type="date"]');
  for (const [index, value] of [start, end].entries()) {
    const input = rangeInputs.nth(index);
    await input.fill(value);
  }
  await expect(rangeInputs.first()).toHaveValue(start);
  await expect(rangeInputs.nth(1)).toHaveValue(end);
}

async function expectRangeSectionSeparated(
  dialog: Locator,
  alertTestId: string,
  rangeTestId: string,
) {
  const alertBox = await dialog.getByTestId(alertTestId).boundingBox();
  const rangeBox = await dialog.getByTestId(rangeTestId).boundingBox();
  expect(alertBox).not.toBeNull();
  expect(rangeBox).not.toBeNull();
  if (!alertBox || !rangeBox) {
    return;
  }
  expect(rangeBox.y - alertBox.y - alertBox.height).toBeGreaterThanOrEqual(12);
}

test.describe('TC006 登录日志范围删除', () => {
  test.beforeEach(async ({ adminPage }) => {
    await ensureSourcePluginEnabled(adminPage, 'linapro-monitor-loginlog');
  });

  test('TC006a: 页面不显示多选框且空范围删除被阻止', async ({ adminPage }) => {
    await adminPage.goto('/monitor/loginlog');
    await waitForTableReady(adminPage, '[data-testid="loginlog-table"]');

    await expect(
      adminPage.getByTestId('loginlog-table').getByRole('checkbox'),
    ).toHaveCount(0);

    const deleteBtn = adminPage.getByTestId('loginlog-range-delete');
    await expect(deleteBtn).toBeEnabled();

    await deleteBtn.click();
    const dialog = await waitForDialogReady(
      adminPage.getByRole('dialog').filter({
        hasText: '删除登录日志',
      }),
    );

    await expect(dialog).toContainText('删除登录日志');
    await expect(dialog).toContainText('请选择登录日志删除方式');
    await expect(dialog).toContainText('删除所有登录日志');
    await expect(dialog.locator('input[type="date"]')).toHaveCount(2);
    await expectRangeSectionSeparated(
      dialog,
      'loginlog-delete-alert',
      'loginlog-delete-range-section',
    );

    await dialog.getByRole('button', { name: /确\s*(认|定)/ }).click();
    await expect(adminPage.getByText('请选择完整的登录日志日期范围')).toBeVisible();

    await dialog.getByRole('button', { name: /取\s*消/ }).click();
  });

  test('TC006b: 选择范围后按范围清理登录日志', async ({ adminPage }) => {
    await adminPage.goto('/monitor/loginlog');
    await waitForTableReady(adminPage, '[data-testid="loginlog-table"]');

    await adminPage.getByTestId('loginlog-range-delete').click();
    const dialog = await waitForDialogReady(
      adminPage.getByRole('dialog').filter({
        hasText: '删除登录日志',
      }),
    );

    await fillModalRange(dialog, '2099-01-01', '2099-01-02');

    const responsePromise = adminPage.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname.includes(
          '/x/linapro-monitor-loginlog/api/v1/loginlog/clean',
        ) &&
        url.searchParams.get('beginTime') === '2099-01-01' &&
        url.searchParams.get('endTime') === '2099-01-02' &&
        response.request().method() === 'DELETE'
      );
    });

    await dialog.getByRole('button', { name: /确\s*(认|定)/ }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    await waitForRouteReady(adminPage);
  });

  test('TC006c: 选择全部日志后清理登录日志不传日期范围', async ({ adminPage }) => {
    await adminPage.goto('/monitor/loginlog');
    await waitForTableReady(adminPage, '[data-testid="loginlog-table"]');

    let cleanRequestUrl = '';
    await adminPage.route(
      '**/x/linapro-monitor-loginlog/api/v1/loginlog/clean**',
      async (route) => {
        if (route.request().method() !== 'DELETE') {
          await route.continue();
          return;
        }
        cleanRequestUrl = route.request().url();
        await route.fulfill({
          body: JSON.stringify({ code: 0, data: { deleted: 0 }, message: 'OK' }),
          contentType: 'application/json',
          status: 200,
        });
      },
    );

    await adminPage.getByTestId('loginlog-range-delete').click();
    const dialog = await waitForDialogReady(
      adminPage.getByRole('dialog').filter({
        hasText: '删除登录日志',
      }),
    );

    await dialog.getByText('删除所有登录日志').click();
    await expect(
      dialog.locator('input[type="date"]').first(),
    ).toBeDisabled();

    await dialog.getByRole('button', { name: /确\s*(认|定)/ }).click();
    await expect.poll(() => cleanRequestUrl).not.toBe('');

    const url = new URL(cleanRequestUrl);
    expect(url.searchParams.has('beginTime')).toBe(false);
    expect(url.searchParams.has('endTime')).toBe(false);
    await waitForRouteReady(adminPage);
  });
});
