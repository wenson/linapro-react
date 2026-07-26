import type { APIRequestContext, Page, Route } from "@playwright/test";

import { mkdir } from "node:fs/promises";
import path from "node:path";

import { test, expect } from "../../../fixtures/auth";
import { config } from "../../../fixtures/config";
import { ConfigPage } from "../../../pages/ConfigPage";
import { LoginPage } from "../../../pages/LoginPage";
import { logoutAccessToken } from "../../../support/auth-session";

const publicFrontendParams = [
  { key: "sys.app.name", name: "品牌展示-应用名称" },
  { key: "sys.app.logo", name: "品牌展示-应用 Logo" },
  { key: "sys.app.logoDark", name: "品牌展示-深色 Logo" },
  { key: "sys.user.defaultAvatar", name: "用户管理-默认头像" },
  { key: "sys.auth.pageTitle", name: "登录展示-页面标题" },
  { key: "sys.auth.pageDesc", name: "登录展示-页面说明" },
  { key: "sys.auth.loginSubtitle", name: "登录展示-登录副标题" },
  { key: "sys.auth.loginPanelLayout", name: "登录展示-登录框位置" },
  { key: "sys.auth.sloganImage", name: "登录展示-Slogan 插画" },
  { key: "sys.ui.theme.mode", name: "界面风格-主题模式" },
  { key: "sys.ui.layout", name: "界面风格-工作台布局" },
  { key: "sys.ui.watermark.enabled", name: "界面风格-是否启用水印" },
  { key: "sys.ui.watermark.content", name: "界面风格-水印文案" },
];

async function loginAsAdmin(request: APIRequestContext): Promise<string> {
  const response = await request.post("/api/v1/auth/login", {
    data: {
      password: config.adminPass,
      username: config.adminUser,
      clientType: "web",
    },
  });
  expect(response.ok()).toBeTruthy();

  const payload = await response.json();
  expect(payload.code).toBe(0);
  return payload.data.accessToken as string;
}

async function getConfigByKey(
  request: APIRequestContext,
  accessToken: string,
  key: string,
) {
  const response = await request.get(
    `/api/v1/config/key/${encodeURIComponent(key)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  expect(response.ok()).toBeTruthy();

  const payload = await response.json();
  expect(payload.code).toBe(0);
  return payload.data as {
    id: number;
    key: string;
    value: string;
  };
}

async function updateConfigValue(
  request: APIRequestContext,
  accessToken: string,
  id: number,
  value: string,
) {
  const response = await request.put(`/api/v1/config/${id}`, {
    data: { value },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  expect(response.ok()).toBeTruthy();

  const payload = await response.json();
  expect(payload.code).toBe(0);
}

function normalizeFontFamily(value: string): string {
  return value
    .replaceAll(/["']/g, "")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function captureEvidence(page: Page, name: string) {
  const now = new Date();
  const day = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric",
  })
    .format(now)
    .replaceAll("-", "");
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Shanghai",
  })
    .format(now)
    .replaceAll(":", "");
  const dir = path.resolve(process.cwd(), "..", "..", "temp", day);
  await mkdir(dir, { recursive: true });
  await page.screenshot({
    fullPage: true,
    path: path.join(dir, `${time}-${name}.png`),
  });
}

async function captureLoadingTitleFontOnRefresh(
  page: Page,
  loginPage: LoginPage,
): Promise<string> {
  const mainScriptPattern = "**/src/main.tsx";
  let releaseMainScript: (() => void) | null = null;
  let markMainScriptIntercepted: (() => void) | null = null;
  const mainScriptIntercepted = new Promise<void>((resolve) => {
    markMainScriptIntercepted = resolve;
  });

  const releaseInterceptedMainScript = () => {
    const release = releaseMainScript;
    releaseMainScript = null;
    release?.();
  };

  const routeHandler = async (route: Route) => {
    markMainScriptIntercepted?.();
    await new Promise<void>((resolve) => {
      releaseMainScript = resolve;
    });
    await route.continue();
  };

  await page.route(mainScriptPattern, routeHandler);

  try {
    await page.reload({ waitUntil: "commit" });

    await expect(loginPage.loadingTitle).toBeVisible();
    await mainScriptIntercepted;

    const loadingFontFamily = await loginPage.getLoadingTitleFontFamily();

    releaseInterceptedMainScript();
    await page.waitForLoadState("domcontentloaded");

    return loadingFontFamily;
  } finally {
    releaseInterceptedMainScript();
    await page.waitForLoadState("domcontentloaded").catch(() => null);
    await page.unroute(mainScriptPattern, routeHandler);
  }
}

async function persistUserThemePreference(
  page: Page,
  mode: "auto" | "dark" | "light",
) {
  await page.evaluate((themeMode) => {
    localStorage.setItem(
      "linapro:web:preferences-theme",
      JSON.stringify({ value: themeMode }),
    );
  }, mode);
}

test.describe("TC004 公开前端配置系统参数", () => {
  test("TC004a: 参数设置页可检索到公开前端配置内置参数", async ({
    adminPage,
  }) => {
    const configPage = new ConfigPage(adminPage);
    await configPage.goto();

    for (const item of publicFrontendParams) {
      await configPage.fillSearchField("参数键名", item.key);
      await configPage.clickSearch();

      const targetRow = configPage.findRowByExactKey(item.key);
      await expect(targetRow).toBeVisible();
      await expect(targetRow).toContainText(item.name);
    }
  });

  test("TC004b: 登录页和主题可消费公开前端配置", async ({ page, request }) => {
    const accessToken = await loginAsAdmin(request);
    const overrides = {
      "sys.app.name": `LinaPro 品牌测试 ${Date.now()}`,
      "sys.auth.pageTitle": "统一品牌登录入口",
      "sys.auth.pageDesc": "宿主工作台与插件能力统一从系统参数读取展示信息",
      "sys.auth.loginSubtitle": "请使用管理员账号登录当前宿主工作区",
      "sys.auth.loginPanelLayout": "panel-right",
      "sys.auth.sloganImage": "/logo.webp",
      "sys.user.defaultAvatar": "/avatar.webp",
      "sys.ui.theme.mode": "dark",
      "sys.ui.layout": "header-nav",
      "sys.ui.watermark.enabled": "true",
      "sys.ui.watermark.content": "品牌测试水印",
    } as const;

    const originals = await Promise.all(
      Object.keys(overrides).map(async (key) => {
        return await getConfigByKey(request, accessToken, key);
      }),
    );

    try {
      for (const original of originals) {
        await updateConfigValue(
          request,
          accessToken,
          original.id,
          overrides[original.key as keyof typeof overrides],
        );
      }

      const publicResponse = await request.get(
        "/api/v1/config/public/frontend",
      );
      expect(publicResponse.ok()).toBeTruthy();
      const publicPayload = await publicResponse.json();
      expect(publicPayload.code).toBe(0);
      expect(publicPayload.data.app.name).toBe(overrides["sys.app.name"]);
      expect(publicPayload.data.auth.pageTitle).toBe(
        overrides["sys.auth.pageTitle"],
      );
      expect(publicPayload.data.auth.panelLayout).toBe("panel-right");
      expect(publicPayload.data.auth.sloganImage).toBe(
        overrides["sys.auth.sloganImage"],
      );
      expect(publicPayload.data.user.defaultAvatar).toBe(
        overrides["sys.user.defaultAvatar"],
      );
      expect(publicPayload.data.ui.themeMode).toBe("dark");
      expect(publicPayload.data.ui.layout).toBe("header-nav");
      expect(publicPayload.data.ui.watermarkEnabled).toBe(true);
      expect(publicPayload.data.ui.watermarkContent).toBe("品牌测试水印");

      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await expect(
        loginPage.getText(overrides["sys.auth.pageTitle"]),
      ).toBeVisible();
      await expect(
        loginPage.getText(overrides["sys.auth.pageDesc"]),
      ).toBeVisible();
      await expect(
        loginPage.getText(overrides["sys.auth.loginSubtitle"]),
      ).toBeVisible();
      await expect(loginPage.getText(overrides["sys.app.name"])).toBeVisible();
      await expect(loginPage.rightAuthPanel).toBeVisible();
      await expect(loginPage.centerAuthPanel).toBeHidden();
      await expect(loginPage.sloganImage).toBeVisible();
      await expect(loginPage.sloganImage).toHaveAttribute(
        "src",
        new RegExp(
          `${overrides["sys.auth.sloganImage"].replace(".", "\\.")}(?:\\?.*)?$`,
        ),
      );

      // Empty sloganImage means hide the side illustration.
      const sloganConfig = originals.find(
        (item) => item.key === "sys.auth.sloganImage",
      );
      if (!sloganConfig) {
        throw new Error("expected sys.auth.sloganImage original config");
      }
      await updateConfigValue(request, accessToken, sloganConfig.id, "");
      await loginPage.goto();
      await expect(loginPage.rightAuthPanel).toBeVisible();
      await expect(loginPage.sloganImage).toHaveCount(0);
      await expect
        .poll(async () => await loginPage.getDocumentTitle())
        .toContain(overrides["sys.app.name"]);
      await expect
        .poll(async () =>
          page.evaluate(() =>
            document.documentElement.classList.contains("dark"),
          ),
        )
        .toBe(true);
      await expect
        .poll(async () =>
          page.evaluate(() => document.body.getAttribute("theme-mode") || ""),
        )
        .toBe("dark");
      await expect
        .poll(async () =>
          page.evaluate(() => {
            const loginSurface = document.querySelector(".login-page");
            const loginPanel = document.querySelector(".login-panel");
            return {
              loginBackground: loginSurface
                ? getComputedStyle(loginSurface).backgroundColor
                : "",
              panelBackground: loginPanel
                ? getComputedStyle(loginPanel).backgroundColor
                : "",
            };
          }),
        )
        .toEqual({
          loginBackground: "rgb(35, 36, 41)",
          panelBackground: "rgb(22, 22, 26)",
        });
      await captureEvidence(page, "config-public-dark-login");

      await loginPage.loginAndWaitForRedirect(
        config.adminUser,
        config.adminPass,
      );
      await expect
        .poll(async () =>
          page.evaluate(() =>
            document.documentElement.classList.contains("dark"),
          ),
        )
        .toBe(true);
    } finally {
      try {
        for (const original of originals) {
          await updateConfigValue(
            request,
            accessToken,
            original.id,
            original.value,
          );
        }
      } finally {
        await logoutAccessToken(accessToken);
      }
    }
  });

  test("TC004c: 同一浏览器重新访问时会拉取最新的后台主题配置", async ({
    page,
    request,
  }) => {
    const accessToken = await loginAsAdmin(request);
    const original = await getConfigByKey(
      request,
      accessToken,
      "sys.ui.theme.mode",
    );
    const loginPage = new LoginPage(page);

    try {
      await updateConfigValue(request, accessToken, original.id, "light");

      await loginPage.goto();
      await expect
        .poll(async () =>
          page.evaluate(() =>
            document.documentElement.classList.contains("dark"),
          ),
        )
        .toBe(false);

      await updateConfigValue(request, accessToken, original.id, "dark");

      await loginPage.goto();
      await expect
        .poll(async () =>
          page.evaluate(() =>
            document.documentElement.classList.contains("dark"),
          ),
        )
        .toBe(true);
    } finally {
      try {
        await updateConfigValue(
          request,
          accessToken,
          original.id,
          original.value,
        );
      } finally {
        await logoutAccessToken(accessToken);
      }
    }
  });

  test("TC004d: 页面刷新时启动 Loading 品牌字体与应用字体保持一致", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const appFontFamily = await loginPage.getRootFontFamily();
    const loadingFontFamily = await captureLoadingTitleFontOnRefresh(
      page,
      loginPage,
    );

    expect(normalizeFontFamily(loadingFontFamily)).toBe(
      normalizeFontFamily(appFontFamily),
    );
  });

  test("TC004e: 系统参数页支持保存 500 字符的登录页说明文案", async ({
    adminPage,
    page,
    request,
  }) => {
    const accessToken = await loginAsAdmin(request);
    const original = await getConfigByKey(
      request,
      accessToken,
      "sys.auth.pageDesc",
    );
    const longDescription = "能力".repeat(250);
    const configPage = new ConfigPage(adminPage);
    const loginPage = new LoginPage(page);

    try {
      await configPage.goto();
      await configPage.edit("登录展示-页面说明", {
        value: longDescription,
      });

      const saved = await getConfigByKey(
        request,
        accessToken,
        "sys.auth.pageDesc",
      );
      expect(saved.value).toBe(longDescription);

      const publicResponse = await request.get(
        "/api/v1/config/public/frontend",
      );
      expect(publicResponse.ok()).toBeTruthy();
      const publicPayload = await publicResponse.json();
      expect(publicPayload.code).toBe(0);
      expect(publicPayload.data.auth.pageDesc).toBe(longDescription);

      await loginPage.goto();
      await expect(loginPage.usernameInput).toBeVisible();
    } finally {
      try {
        await updateConfigValue(
          request,
          accessToken,
          original.id,
          original.value,
        );
      } finally {
        await logoutAccessToken(accessToken);
      }
    }
  });

  test("TC004f: 用户主题偏好优先于公开前端默认主题", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await persistUserThemePreference(page, "dark");

    await page.route("**/api/v1/config/public/frontend", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          code: 0,
          data: {
            app: {},
            auth: {},
            cron: {},
            ui: {
              themeMode: "light",
            },
            user: {},
          },
          message: "OK",
        }),
        contentType: "application/json",
        status: 200,
      });
    });

    await page.reload({ waitUntil: "domcontentloaded" });
    await loginPage.usernameInput.waitFor({ state: "visible" });

    await expect
      .poll(async () =>
        page.evaluate(() =>
          document.documentElement.classList.contains("dark"),
        ),
      )
      .toBe(true);
    await expect
      .poll(async () =>
        page.evaluate(() => {
          return JSON.parse(
            localStorage.getItem("linapro:web:preferences-theme") || "{}",
          )?.value || "";
        }),
      )
      .toBe("dark");
  });
});
