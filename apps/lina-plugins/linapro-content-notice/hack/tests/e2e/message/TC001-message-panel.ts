import { test, expect } from '@host-tests/fixtures/auth';
import { ensureSourcePluginEnabled } from '@host-tests/fixtures/plugin';
import { MessagePage } from '@host-tests/pages/MessagePage';

test.describe('TC001 消息面板操作', () => {
  test.beforeEach(async ({ adminPage }) => {
    await ensureSourcePluginEnabled(adminPage, 'linapro-content-notice');
  });

  test('TC001a: 消息铃铛和未读数投影可见', async ({ adminPage }) => {
    const messagePage = new MessagePage(adminPage);
    await expect(messagePage.indicatorTrigger).toBeVisible({ timeout: 5000 });
    await expect(messagePage.indicatorTrigger).toHaveAttribute(
      'aria-label',
      '打开我的消息',
    );
    await expect(adminPage.getByTestId('message-indicator-unread-count')).toBeAttached();
  });

  test('TC001b: 点击铃铛显示 Semi 消息面板', async ({ adminPage }) => {
    const messagePage = new MessagePage(adminPage);
    await messagePage.openIndicator();

    await expect(messagePage.indicatorPopover).toBeVisible();
    await expect(
      messagePage.indicatorPopover.getByText('通知', { exact: true }),
    ).toBeVisible();
    await expect(
      messagePage.indicatorPopover.getByTestId('message-popover-view-all'),
    ).toHaveText('查看所有消息');
  });

  test('TC001c: 查看所有消息进入 React 消息列表', async ({ adminPage }) => {
    const messagePage = new MessagePage(adminPage);
    await messagePage.openIndicator();
    await messagePage.viewAllFromIndicator();

    await expect(messagePage.root).toBeVisible({ timeout: 10000 });
    await expect(
      messagePage.root.getByRole('heading', { name: '我的消息' }),
    ).toBeVisible();
  });
});
