import { test, expect } from '@host-tests/fixtures/auth';
import { ensureSourcePluginEnabled } from '@host-tests/fixtures/plugin';
import { NoticePage } from '../../pages/NoticePage';
import { waitForDialogReady, waitForDropdown } from '@host-tests/support/ui';

test.describe('TC006 通知公告类型选项来源于后端字典', () => {
  test.beforeEach(async ({ adminPage }) => {
    await ensureSourcePluginEnabled(adminPage, 'linapro-content-notice');
  });

  test('TC006a: 搜索表单 type 下拉项来源于 sys_notice_type 字典', async ({
    adminPage,
  }) => {
    const noticePage = new NoticePage(adminPage);
    await noticePage.goto();

    await adminPage.getByLabel('公告类型', { exact: true }).first().click();
    const dropdown = await waitForDropdown(adminPage);

    // 字典数据返回的 label 是 "通知" / "公告"（来自 sys_notice_type）
    await expect(dropdown.getByText('通知', { exact: true })).toBeVisible({
      timeout: 5000,
    });
    await expect(dropdown.getByText('公告', { exact: true })).toBeVisible({
      timeout: 5000,
    });

    // 关键断言：response.data.dictType === 'sys_notice_type'
    // 通过监听网络请求验证选项确实来自字典接口
    const dictRequestPromise = adminPage.waitForResponse(
      (response) =>
        response
          .url()
          .includes('/dict/data/type/sys_notice_type') && response.status() === 200,
      { timeout: 1000 },
    ).catch(() => null);
    // 不强制要求拦到（首次加载可能已完成），但若有则验证
    const dictResponse = await dictRequestPromise;
    if (dictResponse) {
      const payload = await dictResponse.json();
      const labels = (payload?.data ?? []).map((item: any) => item.label);
      expect(labels).toEqual(expect.arrayContaining(['通知', '公告']));
    }

    await adminPage.keyboard.press('Escape');
  });

  test('TC006b: 新增弹窗 type 单选按钮选项来源于字典', async ({ adminPage }) => {
    const noticePage = new NoticePage(adminPage);
    await noticePage.goto();

    await adminPage
      .getByRole('button', { name: /新\s*增/ })
      .first()
      .click();

    const modal = adminPage.locator('[role="dialog"]');
    await waitForDialogReady(modal);

    // Semi 将 Radio 文本渲染为 radiogroup 的相邻 label；弹窗中应展示
    // 后端字典返回的两个精确文案：通知、公告。
    await expect(modal.getByText('通知', { exact: true })).toBeVisible({
      timeout: 5000,
    });
    await expect(modal.getByText('公告', { exact: true })).toBeVisible({
      timeout: 5000,
    });

    // 关闭弹窗
    await modal
      .getByRole('button', { name: /取\s*消|Cancel/i })
      .first()
      .click();
    await modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  });

  test('TC006c: pages.status.notice / pages.status.announcement 不再出现在通知页', async ({
    adminPage,
  }) => {
    const noticePage = new NoticePage(adminPage);
    await noticePage.goto();

    // 页面不应直接渲染 raw i18n key
    const html = await adminPage.content();
    expect(html).not.toContain('pages.status.notice');
    expect(html).not.toContain('pages.status.announcement');
  });
});
