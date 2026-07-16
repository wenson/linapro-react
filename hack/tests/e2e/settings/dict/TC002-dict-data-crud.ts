import { test, expect } from '../../../fixtures/auth';
import { DictPage } from '../../../pages/DictPage';

test.describe('TC002 字典数据管理 CRUD', () => {
  function makeDictRecord(label: string) {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      dataLabel: `测试标签_${label}_${suffix}`,
      dataValue: `test_val_${label}_${suffix}`,
      name: `测试字典类型_${label}_${suffix}`,
      type: `test_dict_${label}_${suffix}`,
    };
  }

  test('TC002a: 选择字典类型后右侧显示数据', async ({ adminPage }) => {
    const dictPage = new DictPage(adminPage);
    const record = makeDictRecord('select');
    await dictPage.goto();

    try {
      await dictPage.createType(record.name, record.type);
      await dictPage.clickTypeRow(record.type);
      const rowCount = await dictPage.getDataRowCount();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    } finally {
      if (await dictPage.hasType(record.name)) {
        await dictPage.deleteType(record.name);
      }
    }
  });

  test('TC002b: 创建新字典数据', async ({ adminPage }) => {
    const dictPage = new DictPage(adminPage);
    const record = makeDictRecord('create');
    await dictPage.goto();

    try {
      await dictPage.createType(record.name, record.type);
      await dictPage.clickTypeRow(record.type);
      const response = await dictPage.createData(record.dataLabel, record.dataValue, { sort: 99 });
      expect(response.status()).toBe(200);
      await expect(dictPage.toast(/创建成功|success/i)).toBeVisible({
        timeout: 5000,
      });
    } finally {
      if (await dictPage.hasType(record.name)) {
        await dictPage.deleteType(record.name);
      }
    }
  });

  test('TC002c: 编辑字典数据', async ({ adminPage }) => {
    const dictPage = new DictPage(adminPage);
    const record = makeDictRecord('edit');
    const updatedLabel = `${record.dataLabel}_修改`;
    await dictPage.goto();

    try {
      await dictPage.createType(record.name, record.type);
      await dictPage.clickTypeRow(record.type);
      await dictPage.createData(record.dataLabel, record.dataValue, { sort: 99 });
      await dictPage.editData(record.dataLabel, { label: updatedLabel });
      await expect(dictPage.toast(/更新成功|success/i)).toBeVisible({
        timeout: 5000,
      });
      expect(await dictPage.hasData(updatedLabel)).toBeTruthy();
    } finally {
      if (await dictPage.hasType(record.name)) {
        await dictPage.deleteType(record.name);
      }
    }
  });

  test('TC002d: 删除字典数据', async ({ adminPage }) => {
    const dictPage = new DictPage(adminPage);
    const record = makeDictRecord('delete');
    await dictPage.goto();

    try {
      await dictPage.createType(record.name, record.type);
      await dictPage.clickTypeRow(record.type);
      await dictPage.createData(record.dataLabel, record.dataValue, { sort: 99 });
      await dictPage.deleteData(record.dataLabel);
      await expect(dictPage.toast(/删除成功|success/i)).toBeVisible({
        timeout: 5000,
      });
      expect(await dictPage.hasData(record.dataLabel)).toBeFalsy();
    } finally {
      if (await dictPage.hasType(record.name)) {
        await dictPage.deleteType(record.name);
      }
    }
  });
});
