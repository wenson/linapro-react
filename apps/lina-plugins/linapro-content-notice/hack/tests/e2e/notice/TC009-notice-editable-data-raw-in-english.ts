import type { Page } from '@host-tests/support/playwright';

import { test, expect } from '@host-tests/fixtures/auth';
import { ensureSourcePluginEnabled } from '@host-tests/fixtures/plugin';
import { NoticePage } from '../../pages/NoticePage';
import {
  ensureSystemUpgradeNotice,
  systemUpgradeNoticeTitle,
} from '../../support/notice-seed';

test.describe('TC009 通知公告可编辑数据退出 i18n 投影专项回归', () => {
  test('TC-5a: 英文环境下通知管理页中的可编辑业务记录保持数据库原值', async ({
    adminPage,
    mainLayout,
  }) => {
    const noticePage = new NoticePage(adminPage);

    await ensureNoticeRawData(adminPage);
    await mainLayout.switchLanguage('English');

    await noticePage.goto();
    await expect(await noticePage.hasNotice(systemUpgradeNoticeTitle)).toBe(true);
  });
});

async function ensureNoticeRawData(page: Page) {
  await ensureSourcePluginEnabled(page, 'linapro-content-notice');
  await ensureSystemUpgradeNotice();
}
