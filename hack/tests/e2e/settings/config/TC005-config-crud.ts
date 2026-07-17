import { mkdir } from "node:fs/promises";
import path from "node:path";

import type { APIRequestContext, Page } from "@playwright/test";

import { test, expect } from "../../../fixtures/auth";
import { ConfigPage } from "../../../pages/ConfigPage";
import { createAdminApiContext, expectSuccess } from "../../../support/api/job";

type ConfigListItem = {
  id: number;
  key: string;
};

type ConfigListResult = {
  list: ConfigListItem[];
};

function configIdentity(scenario: string) {
  const nonce = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    key: `e2e.config.${scenario}.${nonce}`,
    name: `E2E参数_${scenario}_${nonce}`,
  };
}

async function createConfigByApi(
  api: APIRequestContext,
  config: { key: string; name: string },
) {
  await expectSuccess(
    await api.post("config", {
      data: {
        key: config.key,
        name: config.name,
        remark: "E2E 参数设置测试",
        value: "test_value",
      },
    }),
  );
}

async function cleanupConfigByKey(api: APIRequestContext, key: string) {
  const response = await api.get(
    `config?pageNum=1&pageSize=100&key=${encodeURIComponent(key)}`,
  );
  if (!response.ok()) return;
  const payload = (await response.json()) as {
    code?: number;
    data?: ConfigListResult;
  };
  if (payload.code !== 0) return;
  for (const item of payload.data?.list ?? []) {
    if (item.key === key) {
      await api.delete(`config/${item.id}`);
    }
  }
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

test.describe("TC005 参数设置管理", () => {
  test("TC005a: 页面加载并展示数据列表", async ({ adminPage }) => {
    const configPage = new ConfigPage(adminPage);
    await configPage.goto();

    // Verify the page renders a non-empty table before interacting with filters.
    const rowCount = await configPage.getRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    // Search for a stable seed config instead of assuming it stays on the first page.
    await configPage.fillSearchField("参数键名", "sys.jwt.expire");
    await configPage.clickSearch();
    const hasJwtExpire = await configPage.hasConfig("sys.jwt.expire");
    expect(hasJwtExpire).toBeTruthy();
  });

  test("TC005b: 按参数名称搜索", async ({ adminPage }) => {
    const configPage = new ConfigPage(adminPage);
    await configPage.goto();

    await configPage.fillSearchField("参数名称", "用户登录");
    await configPage.clickSearch();

    const rowCount = await configPage.getRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    const hasResult = await configPage.hasConfig("sys.login.blackIPList");
    expect(hasResult).toBeTruthy();
  });

  test("TC005c: 按参数键名搜索", async ({ adminPage }) => {
    const configPage = new ConfigPage(adminPage);
    await configPage.goto();

    await configPage.fillSearchField("参数键名", "sys.login");
    await configPage.clickSearch();

    const rowCount = await configPage.getRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    const hasResult = await configPage.hasConfig("sys.login.blackIPList");
    expect(hasResult).toBeTruthy();
  });

  test("TC005d: 重置搜索条件", async ({ adminPage }) => {
    const configPage = new ConfigPage(adminPage);
    await configPage.goto();

    // Search to narrow results
    await configPage.fillSearchField("参数名称", "用户登录");
    await configPage.clickSearch();
    const filteredCount = await configPage.getRowCount();

    // Reset and verify all data shows
    await configPage.clickReset();
    const allCount = await configPage.getRowCount();
    expect(allCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test("TC005e: 创建新参数设置", async ({ adminPage }) => {
    const identity = configIdentity("create");
    const api = await createAdminApiContext();
    const configPage = new ConfigPage(adminPage);
    try {
      await configPage.goto();
      await configPage.create(identity.name, identity.key, "test_value", "测试备注");

      await expect(adminPage.getByText(/创建成功|Created successfully/i)).toBeVisible({
        timeout: 5000,
      });
      await configPage.fillSearchField("参数键名", identity.key);
      await configPage.clickSearch();
      await expect(configPage.findRowByExactKey(identity.key)).toContainText(identity.name);
      await captureEvidence(adminPage, "config-create-success");
    } finally {
      await cleanupConfigByKey(api, identity.key);
      await api.dispose();
    }
  });

  test("TC005f: 新创建的参数可搜索到", async ({ adminPage }) => {
    const identity = configIdentity("search-created");
    const api = await createAdminApiContext();
    const configPage = new ConfigPage(adminPage);
    try {
      await configPage.goto();
      await configPage.create(identity.name, identity.key, "search_value", "可搜索验证");
      await configPage.fillSearchField("参数名称", identity.name);
      await configPage.clickSearch();

      await expect(configPage.findRowByExactKey(identity.key)).toContainText(identity.name);
    } finally {
      await cleanupConfigByKey(api, identity.key);
      await api.dispose();
    }
  });

  test("TC005g: 编辑参数设置", async ({ adminPage }) => {
    const identity = configIdentity("edit");
    const updatedName = `${identity.name}_修改`;
    const api = await createAdminApiContext();
    const configPage = new ConfigPage(adminPage);
    try {
      await createConfigByApi(api, identity);
      await configPage.goto();
      await configPage.edit(identity.name, {
        name: updatedName,
        value: "updated_value",
      });

      await expect(adminPage.getByText(/更新成功|Updated successfully/i)).toBeVisible({
        timeout: 5000,
      });
      await configPage.clickReset();
      await configPage.fillSearchField("参数键名", identity.key);
      await configPage.clickSearch();
      const updatedRow = configPage.findRowByExactKey(identity.key);
      await expect(updatedRow).toContainText(updatedName);
      await expect(updatedRow).toContainText("updated_value");
      await captureEvidence(adminPage, "config-update-success");
    } finally {
      await cleanupConfigByKey(api, identity.key);
      await api.dispose();
    }
  });

  test("TC005h: 删除参数设置", async ({ adminPage }) => {
    const identity = configIdentity("delete");
    const api = await createAdminApiContext();
    const configPage = new ConfigPage(adminPage);
    try {
      await createConfigByApi(api, identity);
      await configPage.goto();
      await configPage.delete(identity.name);

      await expect(adminPage.getByText(/删除成功|Deleted successfully/i)).toBeVisible({
        timeout: 5000,
      });
      await expect(configPage.findRowByExactKey(identity.key)).toBeHidden();
      await captureEvidence(adminPage, "config-delete-success");
    } finally {
      await cleanupConfigByKey(api, identity.key);
      await api.dispose();
    }
  });

  test("TC005i: 导出按钮功能正常", async ({ adminPage }) => {
    const configPage = new ConfigPage(adminPage);
    await configPage.goto();

    // Click export button
    const exportBtn = adminPage.getByRole("button", { name: /导\s*出/ });
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    // Verify modal appears
    const modalContent = adminPage.locator('.semi-modal-content[role="dialog"]:visible').last();
    await expect(modalContent).toBeVisible({ timeout: 5000 });
    await expect(modalContent.getByText("确认导出当前筛选结果？", { exact: true })).toBeVisible();
    await captureEvidence(adminPage, "config-export-confirm");

    // Set up response listener
    const responsePromise = adminPage.waitForResponse(
      (resp) => resp.url().includes("config/export"),
      { timeout: 15000 },
    );

    // Click confirm button
    const confirmBtn = modalContent.getByRole("button", { name: /确\s*定|Confirm|OK/i });
    await confirmBtn.click();

    // Wait for response and verify
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });

  test('TC005j: 参数名称与参数键名列左对齐', async ({ adminPage }) => {
    const configPage = new ConfigPage(adminPage);
    await configPage.goto();

    const rowCount = await configPage.getRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    const nameAlign = await configPage.getColumnAlignment('参数名称');
    expect(nameAlign.headerLeft).toBe(true);
    expect(nameAlign.bodyLeft).toBe(true);

    const keyAlign = await configPage.getColumnAlignment('参数键名');
    expect(keyAlign.headerLeft).toBe(true);
    expect(keyAlign.bodyLeft).toBe(true);
  });
});
