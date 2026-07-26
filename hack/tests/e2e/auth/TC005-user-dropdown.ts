import { mkdirSync } from 'node:fs';
import path from 'node:path';

import type { APIRequestContext } from '@playwright/test';

import { request as playwrightRequest } from '@playwright/test';

import { test, expect } from '../../fixtures/auth';
import { config } from '../../fixtures/config';

const apiBaseURL = config.apiBaseURL;

type CurrentUserProfile = {
  avatar: string;
  email: string;
  realName: string;
  username: string;
};

function unwrapApiData(payload: any) {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
}

async function createAdminApiContext(): Promise<APIRequestContext> {
  const loginApi = await playwrightRequest.newContext({ baseURL: apiBaseURL });
  const loginResponse = await loginApi.post('auth/login', {
    data: {
      password: config.adminPass,
      username: config.adminUser,
      clientType: 'web',
    },
  });
  expect(
    loginResponse.ok(),
    `管理员登录 API 失败, status=${loginResponse.status()}`,
  ).toBeTruthy();

  const loginResult = unwrapApiData(await loginResponse.json());
  const accessToken = loginResult?.accessToken;
  expect(accessToken, '未获取到 accessToken').toBeTruthy();
  await loginApi.dispose();

  return playwrightRequest.newContext({
    baseURL: apiBaseURL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function fetchCurrentUserProfile(
  adminApi: APIRequestContext,
): Promise<CurrentUserProfile> {
  const response = await adminApi.get('user/info');
  expect(response.ok(), `查询当前用户信息失败, status=${response.status()}`).toBe(
    true,
  );
  const payload = unwrapApiData(await response.json());
  return {
    avatar: payload?.avatar ?? '',
    email: payload?.email ?? '',
    realName: payload?.realName ?? '',
    username: payload?.username ?? '',
  };
}

function getAvatarFallbackText(profile: CurrentUserProfile) {
  const text = (profile.realName || profile.username).trim();
  return text ? text.slice(-2).toUpperCase() : '';
}

test.describe('TC005 用户头像下拉菜单', () => {
  let adminApi: APIRequestContext;
  let currentUserProfile: CurrentUserProfile;

  test.beforeAll(async () => {
    adminApi = await createAdminApiContext();
    currentUserProfile = await fetchCurrentUserProfile(adminApi);
  });

  test.afterAll(async () => {
    await adminApi.dispose();
  });

  test('TC005a: 下拉菜单不显示文档、Github、问题&帮助', async ({
    mainLayout,
  }) => {
    await mainLayout.openUserDropdown();

    const menuItems = mainLayout.userDropdownMenu.locator('[role="menuitem"]');
    const count = await menuItems.count();
    const menuTexts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await menuItems.nth(i).textContent();
      if (text) menuTexts.push(text.trim());
    }

    // Verify removed menu items do NOT exist
    expect(menuTexts.join(',')).not.toContain('文档');
    expect(menuTexts.join(',')).not.toContain('GitHub');
    expect(menuTexts.join(',')).not.toMatch(/问题/);

    // Verify "个人中心" still exists even when the UI inserts visual spacing.
    expect(menuTexts.join(',')).toMatch(/个\s*人\s*中\s*心/);
  });

  test('TC005b: 下拉菜单显示正确的用户昵称和邮箱', async ({
    adminPage, mainLayout,
  }) => {
    await mainLayout.openUserDropdown();

    await expect(
      adminPage.getByText('ann.vben@gmail.com'),
    ).toHaveCount(0);

    await expect(mainLayout.userDropdownName).toHaveText(
      currentUserProfile.realName,
    );
    if (currentUserProfile.username) {
      await expect(mainLayout.userDropdownHandle).toHaveText(`@${currentUserProfile.username}`);
    } else {
      await expect(mainLayout.userDropdownHandle).toHaveCount(0);
    }
    if (currentUserProfile.email) {
      await expect(mainLayout.userDropdownEmail).toHaveText(currentUserProfile.email);
    } else {
      await expect(mainLayout.userDropdownEmail).toHaveCount(0);
    }

    const name = await mainLayout.userDropdownName.boundingBox();
    expect(name).not.toBeNull();
    if (currentUserProfile.username) {
      const handle = await mainLayout.userDropdownHandle.boundingBox();
      expect(handle).not.toBeNull();
      expect(handle!.y).toBeGreaterThan(name!.y);
    }
    if (currentUserProfile.email) {
      const handle = currentUserProfile.username
        ? await mainLayout.userDropdownHandle.boundingBox()
        : null;
      const email = await mainLayout.userDropdownEmail.boundingBox();
      expect(email).not.toBeNull();
      expect(email!.y).toBeGreaterThan((handle ?? name)!.y);
    }

    const timestamp = new Date();
    const date = timestamp.toISOString().slice(0, 10).replaceAll('-', '');
    const time = timestamp.toTimeString().slice(0, 8).replaceAll(':', '');
    const screenshotDirectory = path.resolve('../../temp', date);
    mkdirSync(screenshotDirectory, { recursive: true });
    await adminPage.screenshot({
      path: path.join(screenshotDirectory, `${time}-workbench-user-menu.png`),
      fullPage: false,
    });
  });

  test('TC005c: 页面右上角应展示用户头像或默认头像', async ({
    mainLayout,
  }) => {
    await expect(mainLayout.userDropdownTrigger).toBeVisible();
    await expect(mainLayout.userDropdownAvatar).toBeVisible();

    const avatarImages = mainLayout.userDropdownAvatar.locator('img[alt]');
    const hasVisibleAvatarImage =
      (await avatarImages.count()) > 0 &&
      (await avatarImages.first().isVisible());
    const avatarFallbackText = getAvatarFallbackText(currentUserProfile);
    const hasVisibleAvatarFallback = avatarFallbackText
      ? await mainLayout.userDropdownAvatar
          .getByText(avatarFallbackText, { exact: true })
          .first()
          .isVisible()
          .catch(() => false)
      : false;

    expect(hasVisibleAvatarImage || hasVisibleAvatarFallback).toBeTruthy();

    if (hasVisibleAvatarImage) {
      await expect(avatarImages.first()).toHaveAttribute(
        'alt',
        currentUserProfile.realName,
      );
      const src = await avatarImages.first().getAttribute('src');
      expect(src).toBeTruthy();
      expect(src!.length).toBeGreaterThan(0);
      if (!currentUserProfile.avatar) {
        expect(src).toContain('/avatar.webp');
      }
    }
  });
});
