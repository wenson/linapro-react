import type {
  APIRequestContext,
  Browser,
  BrowserContext,
  Page,
} from '@host-tests/support/playwright';

import { test, expect } from '@host-tests/fixtures/auth';
import { ensureSourcePluginEnabled } from '@host-tests/fixtures/plugin';
import { config, pluginApiPath } from '@host-tests/fixtures/config';
import { LoginPage } from '@host-tests/pages/LoginPage';
import { MessagePage } from '@host-tests/pages/MessagePage';
import {
  createAdminApiContext,
  expectSuccess,
} from '@host-tests/support/api/job';

import {
  createMessageRecipient,
  unreadCount,
  type MessageRecipient,
} from '../../support/message-recipient';

const pluginID = 'linapro-content-notice';

type MessageItem = {
  id: number;
  isRead: number;
  title: string;
};

type Scenario = {
  adminApi: APIRequestContext;
  context: BrowserContext;
  messagePage: MessagePage;
  noticeIDs: number[];
  page: Page;
  recipient: MessageRecipient;
  titles: string[];
};

async function listMessages(
  api: APIRequestContext,
  pageNum = 1,
  pageSize = 100,
) {
  return expectSuccess<{ list: MessageItem[]; total: number }>(
    await api.get(`user/message?pageNum=${pageNum}&pageSize=${pageSize}`),
  );
}

async function createPublishedNotice(
  api: APIRequestContext,
  title: string,
  content: string,
) {
  return expectSuccess<{ id: number }>(
    await api.post(pluginApiPath(pluginID, 'notice'), {
      data: {
        content,
        status: 1,
        title,
        type: 1,
      },
    }),
  );
}

async function openRecipientPage(
  browser: Browser,
  recipient: MessageRecipient,
) {
  const context = await browser.newContext({ baseURL: config.baseURL });
  const page = await context.newPage();
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginAndWaitForRedirect(
    recipient.username,
    recipient.password,
  );
  return { context, messagePage: new MessagePage(page), page };
}

async function withMessageScenario(
  browser: Browser,
  label: string,
  noticeCount: number,
  run: (scenario: Scenario) => Promise<void>,
) {
  const adminApi = await createAdminApiContext();
  const recipient = await createMessageRecipient(label);
  const noticeIDs: number[] = [];
  const titles: string[] = [];
  let context: BrowserContext | undefined;

  try {
    for (let index = 0; index < noticeCount; index += 1) {
      const title = `${label}_消息_${Date.now()}_${index + 1}`;
      titles.push(title);
      noticeIDs.push(
        (
          await createPublishedNotice(
            adminApi,
            title,
            `${label} 消息内容 ${index + 1}`,
          )
        ).id,
      );
    }

    await expect
      .poll(() => unreadCount(recipient.api), {
        message: `expected ${noticeCount} unread messages for ${recipient.username}`,
        timeout: 15_000,
      })
      .toBeGreaterThanOrEqual(noticeCount);

    const opened = await openRecipientPage(browser, recipient);
    context = opened.context;
    await opened.messagePage.goto();
    await run({
      adminApi,
      context,
      messagePage: opened.messagePage,
      noticeIDs,
      page: opened.page,
      recipient,
      titles,
    });
  } finally {
    for (const noticeID of noticeIDs) {
      await adminApi
        .delete(pluginApiPath(pluginID, `notice/${noticeID}`))
        .catch(() => {});
    }
    await recipient.cleanup();
    await adminApi.dispose();
    await context?.close();
  }
}

test.describe('TC002 用户消息列表页面', () => {
  test.beforeEach(async ({ adminPage }) => {
    await ensureSourcePluginEnabled(adminPage, pluginID);
  });

  test('TC002a: 消息列表页面可访问且空态操作禁用', async ({ browser }) => {
    const recipient = await createMessageRecipient('tc002a');
    const { context, messagePage } = await openRecipientPage(browser, recipient);

    try {
      await messagePage.goto();
      await expect(messagePage.root).toBeVisible();
      await expect(
        messagePage.root.getByRole('heading', { name: '我的消息' }),
      ).toBeVisible();
      await expect(messagePage.root.getByTestId('message-read-all')).toBeDisabled();
      await expect(messagePage.root.getByTestId('message-clear')).toBeDisabled();
    } finally {
      await recipient.cleanup();
      await context.close();
    }
  });

  test('TC002b: 打开未读消息展示详情并标记当前消息已读', async ({ browser }) => {
    await withMessageScenario(browser, 'tc002b', 1, async ({
      messagePage,
      page,
      recipient,
      titles: [title],
    }) => {
      const messageID = await messagePage.messageIdByTitle(title);
      await expect(page.getByTestId(`message-unread-${messageID}`)).toBeVisible();

      const { dialog } = await messagePage.openMessage(title);
      await expect(dialog).toContainText(title);
      await expect(dialog).toContainText('tc002b 消息内容 1');
      await expect.poll(() => unreadCount(recipient.api)).toBe(0);
      await expect(page.getByTestId(`message-unread-${messageID}`)).toHaveCount(0);
    });
  });

  test('TC002c: 全部已读会更新列表和未读数并显示反馈', async ({ browser }) => {
    await withMessageScenario(browser, 'tc002c', 2, async ({
      messagePage,
      page,
      recipient,
      titles,
    }) => {
      const messageIDs = await Promise.all(
        titles.map((title) => messagePage.messageIdByTitle(title)),
      );
      await messagePage.markAllRead();

      await expect(
        page.locator('.semi-toast-content-text:visible').filter({ hasText: /全部消息已标记为已读/ }).last(),
      ).toBeVisible();
      await expect.poll(() => unreadCount(recipient.api)).toBe(0);
      for (const messageID of messageIDs) {
        await expect(page.getByTestId(`message-unread-${messageID}`)).toHaveCount(0);
      }
    });
  });

  test('TC002d: 单条删除只移除当前测试消息并显示反馈', async ({ browser }) => {
    await withMessageScenario(browser, 'tc002d', 2, async ({
      messagePage,
      page,
      recipient,
      titles: [deletedTitle, retainedTitle],
    }) => {
      const deletedID = await messagePage.messageIdByTitle(deletedTitle);
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/user/message/${deletedID}`) &&
          response.request().method() === 'DELETE' &&
          response.status() === 200,
      );
      await messagePage.deleteMessage(deletedTitle);
      expect((await responsePromise).status()).toBe(200);

      await expect(
        page.locator('.semi-toast-content-text:visible').filter({ hasText: /删除成功/ }).last(),
      ).toBeVisible();
      await expect(messagePage.itemByTitle(deletedTitle)).toHaveCount(0);
      await expect(messagePage.itemByTitle(retainedTitle)).toBeVisible();
      const messages = await listMessages(recipient.api);
      expect(messages.list.map((item) => item.title)).not.toContain(deletedTitle);
      expect(messages.list.map((item) => item.title)).toContain(retainedTitle);
    });
  });

  test('TC002e: 清空确认后删除当前用户全部消息', async ({ browser }) => {
    await withMessageScenario(browser, 'tc002e', 2, async ({
      messagePage,
      page,
      recipient,
    }) => {
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith('/user/message/clear') &&
          response.request().method() === 'DELETE' &&
          response.status() === 200,
      );
      await messagePage.clearAll();
      expect((await responsePromise).status()).toBe(200);

      await expect(
        page.locator('.semi-toast-content-text:visible').filter({ hasText: /消息已清空/ }).last(),
      ).toBeVisible();
      await expect(messagePage.list.locator('.semi-list-item')).toHaveCount(0);
      expect((await listMessages(recipient.api)).total).toBe(0);
    });
  });

  test('TC002f: 超过一页的消息可通过 Semi 分页访问', async ({ browser }) => {
    await withMessageScenario(browser, 'tc002f', 11, async ({
      messagePage,
      page,
      recipient,
    }) => {
      const secondPage = await listMessages(recipient.api, 2, 10);
      expect(secondPage.list).toHaveLength(1);
      const secondPageTitle = secondPage.list[0].title;

      await expect(page.getByTestId('message-pagination')).toBeVisible();
      await page.getByLabel('Page 2', { exact: true }).click();
      await expect(messagePage.itemByTitle(secondPageTitle)).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
