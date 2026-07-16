import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { APIRequestContext } from '@playwright/test';

import { test, expect } from '../../../fixtures/auth';
import { FilePage } from '../../../pages/FilePage';
import {
  createAdminApiContext,
  expectSuccess,
} from '../../../support/api/job';
import {
  setSwitchChecked,
  waitForBusyIndicatorsToClear,
  waitForConfirmOverlay,
  waitForDropdown,
  waitForRouteReady,
} from '../../../support/ui';

type UploadResult = {
  id: number;
  original: string;
};

type FileListItem = {
  id: number;
  original: string;
};

type FileFixture = {
  id: number;
  name: string;
  path: string;
};

type FixtureOptions = {
  content?: Buffer | string;
  extension?: string;
  marker?: string;
  scene?: string;
};

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../../../../..');
let fixtureSequence = 0;

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

function pad(value: number, length = 2) {
  return String(value).padStart(length, '0');
}

function createTempFile(options: FixtureOptions = {}) {
  const now = new Date();
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(now.getMilliseconds(), 3)}`;
  const extension = (options.extension ?? 'txt').replace(/^\./, '');
  fixtureSequence += 1;
  const marker = options.marker ?? 'e2e_file';
  const name = `${time}-${marker}-${fixtureSequence}.${extension}`;
  const directory = path.join(projectRoot, 'temp', date);
  const filePath = path.join(directory, name);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(filePath, options.content ?? `LinaPro E2E fixture ${name}`);
  return { name, path: filePath };
}

function removeTempFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

async function uploadFile(
  api: APIRequestContext,
  local: { name: string; path: string },
  scene = 'other',
) {
  const result = await expectSuccess<UploadResult>(
    await api.post('file/upload', {
      multipart: {
        scene,
        file: fs.createReadStream(local.path),
      },
    }),
  );
  expect(result.original).toBe(local.name);
  return { ...local, id: result.id };
}

async function findFile(api: APIRequestContext, original: string) {
  const result = await expectSuccess<{ list: FileListItem[]; total: number }>(
    await api.get(
      `file?pageNum=1&pageSize=100&original=${encodeURIComponent(original)}`,
    ),
  );
  return result.list.find((item) => item.original === original);
}

async function withUploadedFiles<T>(
  options: FixtureOptions[],
  run: (fixtures: FileFixture[], api: APIRequestContext) => Promise<T>,
) {
  const api = await createAdminApiContext();
  const locals: Array<{ name: string; path: string }> = [];
  const fixtures: FileFixture[] = [];
  try {
    for (const option of options) {
      const local = createTempFile(option);
      locals.push(local);
      fixtures.push(await uploadFile(api, local, option.scene));
    }
    return await run(fixtures, api);
  } finally {
    for (const fixture of fixtures) {
      await api.delete(`file/${fixture.id}`).catch(() => {});
    }
    await api.dispose();
    locals.forEach((local) => removeTempFile(local.path));
  }
}

async function withUploadedFile<T>(
  options: FixtureOptions,
  run: (fixture: FileFixture, api: APIRequestContext) => Promise<T>,
) {
  return withUploadedFiles([options], ([fixture], api) => run(fixture, api));
}

test.describe('TC001 文件管理', () => {
  test('TC001a: 文件管理页面可正常访问', async ({ authenticatedPage: adminPage }) => {
    const filePage = new FilePage(adminPage);
    await filePage.goto();

    await expect(adminPage.getByTestId('file-page')).toBeVisible();
    await expect(adminPage.getByRole('heading', { name: '文件管理' })).toBeVisible();
    await expect(adminPage.getByText('文件列表', { exact: true })).toBeVisible();
    await expect(filePage.table).toBeVisible();
  });

  test('TC001b: 文件上传按钮打开 Semi 上传弹窗', async ({ authenticatedPage: adminPage }) => {
    const filePage = new FilePage(adminPage);
    await filePage.goto();

    const modal = await filePage.openFileUploadModal();
    await expect(modal.getByText('文件上传', { exact: true })).toBeVisible();
    await expect(modal.getByTestId('managed-upload')).toBeVisible();
    await expect(modal.locator('input.semi-upload-hidden-input')).toHaveCount(1);
  });

  test('TC001c: 图片上传按钮打开仅限图片的 Semi 上传弹窗', async ({ authenticatedPage: adminPage }) => {
    const filePage = new FilePage(adminPage);
    await filePage.goto();

    const modal = await filePage.openImageUploadModal();
    await expect(modal.getByText('图片上传', { exact: true })).toBeVisible();
    await expect(modal.getByTestId('managed-upload')).toBeVisible();
    await expect(modal.locator('input.semi-upload-hidden-input')).toHaveAttribute('accept', 'image/*');
  });

  test('TC001d: 通过页面上传文件后列表可见且显示成功反馈', async ({ authenticatedPage: adminPage }) => {
    const filePage = new FilePage(adminPage);
    const local = createTempFile({ marker: 'e2e_ui_upload' });
    const api = await createAdminApiContext();
    let uploadedID = 0;

    try {
      await filePage.goto();
      await filePage.openFileUploadModal();
      await filePage.uploadFile(local.path);
      await expect(
        adminPage.locator('.semi-toast-content-text:visible').filter({ hasText: /文件上传成功/ }).last(),
      ).toBeVisible({ timeout: 15000 });

      const uploaded = await findFile(api, local.name);
      expect(uploaded, 'UI upload must create an API-visible file record').toBeTruthy();
      uploadedID = uploaded!.id;

      await filePage.closeUploadDialog();
      await filePage.searchByOriginal(local.name);
      await expect(filePage.rowByOriginal(local.name)).toBeVisible();
      await expect(adminPage.getByTestId(`file-original-${uploadedID}`)).toHaveText(local.name);
    } finally {
      if (uploadedID > 0) {
        await api.delete(`file/${uploadedID}`).catch(() => {});
      }
      await api.dispose();
      removeTempFile(local.path);
    }
  });

  test('TC001e: 文件类型筛选只返回匹配后缀的文件', async ({ authenticatedPage: adminPage }) => {
    await withUploadedFile(
      { content: onePixelPng, extension: 'png', marker: 'e2e_suffix_filter' },
      async (fixture) => {
        const filePage = new FilePage(adminPage);
        await filePage.goto();
        await filePage.selectSearchOption(/文件类型|File type/i, 'png');
        await filePage.submitSearch();

        const suffixes = await filePage.table
          .locator('[data-testid^="file-suffix-"]')
          .allTextContents();
        expect(suffixes.length).toBeGreaterThan(0);
        expect(suffixes.every((suffix) => suffix.trim() === 'png')).toBeTruthy();
        await expect(adminPage.getByTestId(`file-suffix-${fixture.id}`)).toHaveText('png');
      },
    );
  });

  test('TC001p: 文件类型下拉项使用不带点号的纯后缀', async ({ authenticatedPage: adminPage }) => {
    await withUploadedFile({ extension: 'txt', marker: 'e2e_suffix_options' }, async () => {
      const filePage = new FilePage(adminPage);
      await filePage.goto();

      await filePage.searchForm.getByLabel(/文件类型|File type/i).first().click();
      const dropdown = await waitForDropdown(adminPage);
      const options = dropdown.locator('.semi-select-option');
      const texts = (await options.allTextContents()).map((text) => text.trim());
      expect(texts.length).toBeGreaterThan(0);
      for (const text of texts) {
        expect(text).toMatch(/^[a-zA-Z0-9_+-]+$/);
        expect(text).not.toMatch(/^\./);
      }
    });
  });

  test('TC001g: 图片、PDF 和普通文件使用各自的预览方式', async ({ authenticatedPage: adminPage }) => {
    await withUploadedFiles(
      [
        { content: onePixelPng, extension: 'png', marker: 'e2e_preview_image' },
        { content: '%PDF-1.4\n%%EOF\n', extension: 'pdf', marker: 'e2e_preview_pdf' },
        { extension: 'txt', marker: 'e2e_preview_url' },
      ],
      async ([image, pdf, textFile]) => {
        const filePage = new FilePage(adminPage);
        await filePage.goto();

        await filePage.searchByOriginal(image.name);
        await expect(adminPage.getByTestId(`file-image-preview-${image.id}`)).toBeVisible();

        await filePage.resetSearch();
        await filePage.searchByOriginal(pdf.name);
        await expect(adminPage.getByTestId(`file-pdf-preview-${pdf.id}`)).toHaveText('PDF 预览');

        await filePage.resetSearch();
        await filePage.searchByOriginal(textFile.name);
        await expect(adminPage.getByTestId(`file-url-${textFile.id}`)).toBeVisible();
      },
    );
  });

  test('TC001h: 下载按钮请求当前测试文件且接口成功', async ({ authenticatedPage: adminPage }) => {
    await withUploadedFile({ marker: 'e2e_download' }, async (fixture) => {
      const filePage = new FilePage(adminPage);
      await filePage.goto();
      await filePage.searchByOriginal(fixture.name);

      const responsePromise = adminPage.waitForResponse(
        (response) =>
          response.url().includes(`/file/download/${fixture.id}`) &&
          response.status() === 200,
        { timeout: 15000 },
      );
      await adminPage.getByTestId(`file-download-${fixture.id}`).click();
      expect((await responsePromise).status()).toBe(200);
    });
  });

  test('TC001i: 上传者列展示账号 admin 而不是昵称', async ({ authenticatedPage: adminPage }) => {
    await withUploadedFile({ marker: 'e2e_uploader' }, async (fixture) => {
      const filePage = new FilePage(adminPage);
      await filePage.goto();
      await filePage.searchByOriginal(fixture.name);

      await expect(adminPage.getByTestId(`file-uploader-${fixture.id}`)).toHaveText('admin');
    });
  });

  test('TC001j: 文件大小列排序会发送 size 排序参数', async ({ authenticatedPage: adminPage }) => {
    const filePage = new FilePage(adminPage);
    await filePage.goto();
    const requestPromise = adminPage.waitForRequest(
      (request) => {
        const url = new URL(request.url());
        return url.pathname.endsWith('/file') && url.searchParams.get('orderBy') === 'size';
      },
      { timeout: 10000 },
    );
    await filePage.table
      .locator('.semi-table-row-head-title[title="文件大小"]')
      .locator('..')
      .click();
    expect(new URL((await requestPromise).url()).searchParams.get('orderBy')).toBe('size');
  });

  test('TC001m: 上传时间列排序会发送 createdAt 排序参数', async ({ authenticatedPage: adminPage }) => {
    const filePage = new FilePage(adminPage);
    await filePage.goto();
    const requestPromise = adminPage.waitForRequest(
      (request) => {
        const url = new URL(request.url());
        return url.pathname.endsWith('/file') && url.searchParams.get('orderBy') === 'createdAt';
      },
      { timeout: 10000 },
    );
    await filePage.table
      .locator('.semi-table-row-head-title[title="上传时间"]')
      .locator('..')
      .click();
    expect(new URL((await requestPromise).url()).searchParams.get('orderBy')).toBe('createdAt');
  });

  test('TC001k: 详情按钮展示当前文件的完整本地化字段', async ({ authenticatedPage: adminPage }) => {
    await withUploadedFile({ marker: 'e2e_detail' }, async (fixture) => {
      const filePage = new FilePage(adminPage);
      await filePage.goto();
      await filePage.searchByOriginal(fixture.name);

      const modal = await filePage.openDetail(fixture.id);
      await expect(modal.getByText('详情', { exact: true })).toBeVisible();
      for (const label of ['原始文件名', '存储文件名', '文件大小', '上传者', '上传时间', '使用场景']) {
        await expect(modal.getByText(label, { exact: true })).toBeVisible();
      }
      await expect(modal.getByText(fixture.name, { exact: true })).toBeVisible();
      await expect(modal.getByText('admin', { exact: true })).toBeVisible();
    });
  });

  test('TC001l: 使用场景筛选条件始终可见', async ({ authenticatedPage: adminPage }) => {
    const filePage = new FilePage(adminPage);
    await filePage.goto();
    await expect(filePage.searchForm.getByLabel(/使用场景|Scene/i)).toBeVisible();
  });

  test('TC001o: 使用场景下拉框包含全部预定义选项', async ({ authenticatedPage: adminPage }) => {
    const filePage = new FilePage(adminPage);
    await filePage.goto();
    await filePage.searchForm.getByLabel(/使用场景|Scene/i).click();
    const dropdown = await waitForDropdown(adminPage);
    await waitForBusyIndicatorsToClear(dropdown);

    for (const option of ['用户头像', '通知公告图片', '通知公告附件', '其他']) {
      await expect(
        dropdown.locator('.semi-select-option').filter({ hasText: new RegExp(`^\\s*${option}\\s*$`) }),
      ).toBeVisible();
    }
  });

  test('TC001f: 删除只删除当前测试创建的文件并显示成功反馈', async ({ authenticatedPage: adminPage }) => {
    await withUploadedFile({ marker: 'e2e_delete' }, async (fixture, api) => {
      const filePage = new FilePage(adminPage);
      await filePage.goto();
      await filePage.searchByOriginal(fixture.name);

      const responsePromise = adminPage.waitForResponse(
        (response) =>
          response.url().endsWith(`/file/${fixture.id}`) &&
          response.request().method() === 'DELETE' &&
          response.status() === 200,
      );
      await filePage.deleteFile(fixture.name);
      expect((await responsePromise).status()).toBe(200);
      await expect(
        adminPage.locator('.semi-toast-content-text:visible').filter({ hasText: /删除成功/ }).last(),
      ).toBeVisible();
      await expect(filePage.rowByOriginal(fixture.name)).toHaveCount(0);
      expect(await findFile(api, fixture.name)).toBeUndefined();
    });
  });

  test('TC001n: 预览开关默认开启并可切换 URL 与图片预览', async ({ authenticatedPage: adminPage }) => {
    await withUploadedFile(
      { content: onePixelPng, extension: 'png', marker: 'e2e_preview_switch' },
      async (fixture) => {
        const filePage = new FilePage(adminPage);
        await filePage.goto();
        await filePage.searchByOriginal(fixture.name);

        await expect(filePage.previewSwitch).toHaveAttribute('aria-checked', 'true');
        await expect(adminPage.getByTestId(`file-image-preview-${fixture.id}`)).toBeVisible();

        await setSwitchChecked(filePage.previewSwitch, false);
        await expect(adminPage.getByTestId(`file-url-${fixture.id}`)).toBeVisible();

        await setSwitchChecked(filePage.previewSwitch, true);
        await expect(adminPage.getByTestId(`file-image-preview-${fixture.id}`)).toBeVisible();
      },
    );
  });

  test('TC001q: 批量删除确认后只删除选中的测试文件', async ({ authenticatedPage: adminPage }) => {
    const marker = `e2e_batch_${Date.now()}`;
    await withUploadedFiles(
      [{ marker }, { marker }],
      async (fixtures) => {
        const filePage = new FilePage(adminPage);
        await filePage.goto();
        await filePage.searchByOriginal(marker);
        for (const fixture of fixtures) {
          await expect(filePage.rowByOriginal(fixture.name)).toBeVisible();
          await filePage.selectFile(fixture.id);
        }

        const responsePromise = adminPage.waitForResponse((response) => {
          const ids = response.url().split('/file/').at(-1)?.split(',') ?? [];
          return (
            response.request().method() === 'DELETE' &&
            response.status() === 200 &&
            fixtures.every((fixture) => ids.includes(String(fixture.id)))
          );
        });
        await adminPage
          .locator('[data-testid="file-page"] .iam-toolbar')
          .getByRole('button', { name: /^删\s*除$/ })
          .click();
        const overlay = await waitForConfirmOverlay(adminPage);
        await expect(overlay).toContainText('2');
        await overlay.getByRole('button', { name: /确\s*认|确\s*定|OK|Confirm/i }).click();
        expect((await responsePromise).status()).toBe(200);
        await waitForRouteReady(adminPage);
        for (const fixture of fixtures) {
          await expect(filePage.rowByOriginal(fixture.name)).toHaveCount(0);
        }
      },
    );
  });

  test('TC001r: 重置会清空搜索条件并重新加载列表', async ({ authenticatedPage: adminPage }) => {
    await withUploadedFile({ marker: 'e2e_reset' }, async (fixture) => {
      const filePage = new FilePage(adminPage);
      await filePage.goto();
      await filePage.searchByOriginal(fixture.name);
      const input = filePage.searchForm.getByLabel(/原始文件名|Original file name/i);
      await expect(input).toHaveValue(fixture.name);
      await expect(filePage.rowByOriginal(fixture.name)).toBeVisible();

      await filePage.resetSearch();
      await expect(input).toHaveValue('');
    });
  });
});
