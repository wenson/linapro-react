import { test, expect } from '../../../fixtures/auth';
import { DictPage } from '../../../pages/DictPage';
import { createAdminApiContext, expectSuccess } from '../../../support/api/job';
import { waitForConfirmOverlay } from '../../../support/ui';

type DictDataList = {
  list: Array<{ id: number }>;
  total: number;
};

function makeRecord(label: string) {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    code: `cascade_${label}_${suffix}`,
    dataLabel: `级联数据_${label}_${suffix}`,
    name: `级联测试_${label}_${suffix}`,
  };
}

test.describe('TC007 字典类型级联删除', () => {
  test('TC007a: 删除字典类型时显示级联删除提示', async ({ adminPage }) => {
    const dictPage = new DictPage(adminPage);
    const record = makeRecord('prompt');
    await dictPage.goto();

    try {
      await dictPage.createType(record.name, record.code);
      await dictPage.clickTypeRow(record.name);
      await dictPage.createData(record.dataLabel, 'option_a');
      await dictPage.fillTypeSearchField('字典名称', record.name);
      await dictPage.clickTypeSearch();
      await dictPage.clickCurrentTypeDeleteAction(record.name);

      const modal = await waitForConfirmOverlay(adminPage);
      await expect(modal.getByText(/同时删除.*字典数据/)).toBeVisible();
      await modal.getByRole('button', { name: /取\s*消|Cancel/i }).click();
      await modal.waitFor({ state: 'hidden', timeout: 5000 });
      expect(await dictPage.hasType(record.name)).toBeTruthy();
    } finally {
      if (await dictPage.hasType(record.name)) {
        await dictPage.deleteType(record.name);
      }
    }
  });

  test('TC007b: 删除字典类型时级联删除关联的字典数据', async ({ adminPage }) => {
    const dictPage = new DictPage(adminPage);
    const record = makeRecord('delete');
    const api = await createAdminApiContext();
    await dictPage.goto();

    try {
      await dictPage.createType(record.name, record.code);
      await dictPage.clickTypeRow(record.name);
      await dictPage.createData(record.dataLabel, 'data_a');
      expect(await dictPage.hasData(record.dataLabel)).toBeTruthy();

      await dictPage.fillTypeSearchField('字典名称', record.name);
      await dictPage.clickTypeSearch();
      await dictPage.clickCurrentTypeDeleteAction(record.name);
      const modal = await waitForConfirmOverlay(adminPage);
      await expect(modal.getByText(/同时删除.*字典数据/)).toBeVisible();
      const confirm = modal.getByRole('button', { name: /确\s*定|确\s*认|OK|Confirm/i });
      const [response] = await Promise.all([
        adminPage.waitForResponse(
          (candidate) =>
            candidate.url().includes('/dict/type/') &&
            candidate.request().method() === 'DELETE',
          { timeout: 10000 },
        ),
        confirm.click(),
      ]);
      expect(response.status()).toBe(200);
      await modal.waitFor({ state: 'hidden', timeout: 5000 });
      await expect(dictPage.toast(/删除成功|Deleted successfully/i)).toBeVisible();
      expect(await dictPage.hasType(record.name)).toBeFalsy();

      const remaining = await expectSuccess<DictDataList>(
        await api.get(
          `dict/data?pageNum=1&pageSize=20&dictType=${encodeURIComponent(record.code)}`,
        ),
      );
      expect(remaining.total).toBe(0);
      expect(remaining.list).toHaveLength(0);
    } finally {
      if (await dictPage.hasType(record.name)) {
        await dictPage.deleteType(record.name);
      }
      await api.dispose();
    }
  });

  test('TC007c: 批量删除字典类型时显示级联删除提示', async ({ adminPage }) => {
    const dictPage = new DictPage(adminPage);
    const first = makeRecord('batch_1');
    const second = makeRecord('batch_2');
    await dictPage.goto();

    try {
      await dictPage.createType(first.name, first.code);
      await dictPage.createType(second.name, second.code);
      await dictPage.fillTypeSearchField('字典名称', '级联测试_batch');
      await dictPage.clickTypeSearch();
      await dictPage.selectTypeRowByText(first.name);
      await dictPage.selectTypeRowByText(second.name);

      await adminPage
        .locator('#dict-type .iam-toolbar')
        .getByRole('button', { name: /删\s*除|Delete/i })
        .click();
      const modal = await waitForConfirmOverlay(adminPage);
      await expect(modal.getByText(/同时删除.*字典数据/)).toBeVisible();
      const confirm = modal.getByRole('button', { name: /确\s*定|确\s*认|OK|Confirm/i });
      await Promise.all([
        adminPage.waitForResponse(
          (candidate) =>
            candidate.url().includes('/dict/type/') &&
            candidate.request().method() === 'DELETE',
          { timeout: 15000 },
        ),
        confirm.click(),
      ]);
      await modal.waitFor({ state: 'hidden', timeout: 5000 });
      await expect(dictPage.toast(/删除成功|Deleted successfully/i)).toBeVisible();
      expect(await dictPage.hasType(first.name)).toBeFalsy();
      expect(await dictPage.hasType(second.name)).toBeFalsy();
    } finally {
      for (const record of [first, second]) {
        if (await dictPage.hasType(record.name)) {
          await dictPage.deleteType(record.name);
        }
      }
    }
  });
});
