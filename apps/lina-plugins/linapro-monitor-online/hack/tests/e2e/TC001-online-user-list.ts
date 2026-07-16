import { test, expect } from '@host-tests/fixtures/auth';
import { ensureSourcePluginEnabled } from '@host-tests/fixtures/plugin';
import { waitForRouteReady } from '@host-tests/support/ui';

test.describe('TC001 在线用户列表展示', () => {
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

  test('TC001a: 在线用户页面加载并展示表格', async ({ adminPage }) => {
    // Table should be visible
    await expect(adminPage.getByTestId('online-user-table')).toBeVisible();
  });

  test('TC001b: 工具栏显示在线人数统计', async ({ adminPage }) => {
    // Should show online count text
    await expect(
      adminPage.getByText(/在线用户列表.*共.*人在线/),
    ).toBeVisible();
  });

  test('TC001c: 表格包含必要的列', async ({ adminPage }) => {
    // Check for expected column headers in the entire header area
    const headerArea = adminPage.getByTestId('online-user-table').locator('thead');
    await expect(headerArea).toContainText('登录账号');
    await expect(headerArea).toContainText('IP地址');
    await expect(headerArea).toContainText('浏览器');
    await expect(headerArea).toContainText('登录时间');
    await expect(headerArea).toContainText('操作');
  });

  test('TC001d: 当前登录用户出现在列表中', async ({ adminPage }) => {
    // The logged-in admin user should appear in the online list
    const rows = adminPage.getByTestId('online-user-table').locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // At least one row should contain 'admin'
    await expect(rows.first()).toContainText(
      'admin',
    );
  });

  test('TC001e: 后端分页请求包含分页参数', async ({ adminPage }) => {
    // Trigger a query and verify the request includes pagination params
    const requestPromise = adminPage.waitForRequest(
      (req) =>
        req.url().includes('/x/linapro-monitor-online/api/v1/monitor/online/list') &&
        req.url().includes('pageNum=') &&
        req.url().includes('pageSize='),
    );
    await adminPage.getByRole('button', { name: /搜\s*索/ }).click();
    const request = await requestPromise;

    // Verify pagination params exist
    const url = new URL(request.url());
    expect(url.searchParams.get('pageNum')).not.toBeNull();
    expect(url.searchParams.get('pageSize')).not.toBeNull();
  });
});
