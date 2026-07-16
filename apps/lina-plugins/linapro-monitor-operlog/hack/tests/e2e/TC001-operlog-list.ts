import { test, expect } from '@host-tests/fixtures/auth';
import { prepareSourcePluginsBaseline } from '@host-tests/fixtures/plugin';
import {
  waitForBusyIndicatorsToClear,
  waitForRouteReady,
} from '@host-tests/support/ui';

async function expectPageHeightStable(page: any, pageName: string) {
  const samples = await page.evaluate(async () => {
    const values: number[] = [];
    for (let index = 0; index < 4; index += 1) {
      values.push(document.documentElement.scrollHeight);
      if (index < 3) {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
      }
    }
    return values;
  });

  expect(
    Math.max(...samples) - Math.min(...samples),
    `${pageName}高度未稳定，采样结果: ${samples.join(', ')}`,
  ).toBeLessThanOrEqual(16);
}

test.describe('TC001 操作日志列表查询与筛选', () => {
  test.beforeAll(async () => {
    await prepareSourcePluginsBaseline(['linapro-monitor-operlog']);
  });

  test.beforeEach(async ({ adminPage }) => {
    // Navigate to operlog page and wait for data to load
    const responsePromise = adminPage.waitForResponse(
      (res) =>
        res.url().includes('/x/linapro-monitor-operlog/api/v1/operlog') &&
        res.request().method() === 'GET' &&
        res.status() === 200,
      { timeout: 15000 },
    );
    await adminPage.goto('/monitor/operlog');
    await responsePromise;
    await waitForRouteReady(adminPage);
  });

  test('TC001a: 操作日志页面加载并展示表格', async ({ adminPage }) => {
    // Table should be visible
    await expect(adminPage.getByTestId('operlog-table')).toBeVisible();

    // Should have toolbar with clean and export buttons
    await expect(
      adminPage.getByRole('button', { name: /清\s*空/ }),
    ).toBeVisible();
    await expect(
      adminPage.getByRole('button', { name: /导\s*出/ }),
    ).toBeVisible();
    await expectPageHeightStable(adminPage, '操作日志页');
  });

  test('TC001b: 按模块名称搜索', async ({ adminPage }) => {
    // Fill module name search field
    await adminPage.getByLabel('模块名称', { exact: true }).first().fill('认证');

    // Wait for API request containing the search param
    const requestPromise = adminPage.waitForRequest(
      (req) =>
        req.url().includes('/x/linapro-monitor-operlog/api/v1/operlog') &&
        req.method() === 'GET' &&
        req.url().includes('title='),
      { timeout: 10000 },
    );

    await adminPage.getByRole('button', { name: /搜\s*索/ }).first().click();
    const request = await requestPromise;

    expect(request.url()).toContain('title=');
    await waitForRouteReady(adminPage);
  });

  test('TC001c: 按操作人员搜索', async ({ adminPage }) => {
    // Fill operator name search field
    await adminPage
      .getByLabel('操作人员', { exact: true })
      .first()
      .fill('admin');

    const requestPromise = adminPage.waitForRequest(
      (req) =>
        req.url().includes('/x/linapro-monitor-operlog/api/v1/operlog') &&
        req.method() === 'GET' &&
        req.url().includes('operName='),
      { timeout: 10000 },
    );

    await adminPage.getByRole('button', { name: /搜\s*索/ }).first().click();
    const request = await requestPromise;

    expect(request.url()).toContain('operName=');
    await waitForRouteReady(adminPage);
  });

  test('TC001d: 按操作类型下拉选择搜索', async ({ adminPage }) => {
    const selectTrigger = adminPage.getByTestId('operlog-type-filter');
    await selectTrigger.click();

    // Select the first available option
    const firstOption = adminPage.getByRole('option').first();
    await expect(firstOption).toBeVisible();
    await firstOption.click();
    await waitForBusyIndicatorsToClear(adminPage);

    // Click search and verify request includes operType parameter
    const requestPromise = adminPage.waitForRequest(
      (req) =>
        req.url().includes('/x/linapro-monitor-operlog/api/v1/operlog') &&
        req.method() === 'GET' &&
        req.url().includes('operType='),
      { timeout: 10000 },
    );

    await adminPage.getByRole('button', { name: /搜\s*索/ }).first().click();
    const request = await requestPromise;

    expect(request.url()).toContain('operType=');
  });

  test('TC001e: 按操作结果下拉选择搜索', async ({ adminPage }) => {
    // Click the status Select (labeled 操作结果)
    const selectTrigger = adminPage.getByTestId('operlog-status-filter');
    await selectTrigger.click();

    // Select the first available option
    const firstOption = adminPage.getByRole('option').first();
    await expect(firstOption).toBeVisible();
    await firstOption.click();
    await waitForBusyIndicatorsToClear(adminPage);

    // Click search and verify request includes status parameter
    const requestPromise = adminPage.waitForRequest(
      (req) =>
        req.url().includes('/x/linapro-monitor-operlog/api/v1/operlog') &&
        req.method() === 'GET' &&
        req.url().includes('status='),
      { timeout: 10000 },
    );

    await adminPage.getByRole('button', { name: /搜\s*索/ }).first().click();
    const request = await requestPromise;

    expect(request.url()).toContain('status=');
  });

  test('TC001f: 搜索后重置恢复全部数据', async ({ adminPage }) => {
    // Get initial row count
    const rows = adminPage.getByTestId('operlog-table').locator('tbody tr');
    const initialCount = await rows.count();

    // Fill a search field
    await adminPage
      .getByLabel('模块名称', { exact: true })
      .first()
      .fill('不存在的模块名称');
    await adminPage.getByRole('button', { name: /搜\s*索/ }).first().click();
    await waitForRouteReady(adminPage);

    // After filtering, row count should be different (likely 0)
    const filteredCount = await rows.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Reset
    const resetResponsePromise = adminPage.waitForResponse(
      (res) =>
        res.url().includes('/x/linapro-monitor-operlog/api/v1/operlog') &&
        res.request().method() === 'GET' &&
        res.status() === 200,
      { timeout: 10000 },
    );
    await adminPage.getByRole('button', { name: /重\s*置/ }).first().click();
    await resetResponsePromise;
    await waitForRouteReady(adminPage);

    // Row count should restore
    const resetCount = await rows.count();
    expect(resetCount).toBe(initialCount);
  });

  test('TC001g: 搜索请求包含操作时间范围参数', async ({ adminPage }) => {
    const dateInputs = adminPage
      .getByTestId('operlog-management-page')
      .locator('form input[type="date"]');
    await dateInputs.first().fill('2026-07-01');
    await dateInputs.nth(1).fill('2026-07-12');

    // Click search and verify request includes time range params
    const requestPromise = adminPage.waitForRequest(
      (req) =>
        req.url().includes('/x/linapro-monitor-operlog/api/v1/operlog') &&
        req.method() === 'GET' &&
        (req.url().includes('beginTime=') ||
          req.url().includes('endTime=')),
      { timeout: 10000 },
    );

    await adminPage.getByRole('button', { name: /搜\s*索/ }).first().click();
    const request = await requestPromise;

    const url = request.url();
    expect(url).toContain('beginTime=');
    expect(url).toContain('endTime=');
  });
});
