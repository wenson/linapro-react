import { expect, type Locator, type Page } from '@playwright/test';

const busySelector = [
  '.semi-spin-wrapper:visible',
  '[aria-busy="true"]:visible',
].join(', ');

const routeBlockingSelector = [
  '.semi-spin-wrapper:visible',
  '[aria-busy="true"]:visible',
].join(', ');

export async function waitForBusyIndicatorsToClear(
  scope: Locator | Page,
  timeout = 10000,
) {
  await expect(scope.locator(busySelector)).toHaveCount(0, { timeout });
}

export async function waitForRouteReady(page: Page, timeout = 10000) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  await expect(page.locator(routeBlockingSelector)).toHaveCount(0, { timeout });
}

export async function waitForTableReady(
  page: Page,
  selector = '.semi-table-container, .semi-table',
  timeout = 10000,
) {
  const table = page.locator(selector).first();
  await table.waitFor({ state: 'visible', timeout });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  await waitForBusyIndicatorsToClear(table, timeout);
}

export async function waitForDialogReady(dialog: Locator, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const count = await dialog.count();
    for (let index = 0; index < count; index += 1) {
      const target = dialog.nth(index);
      if (await target.isVisible().catch(() => false)) {
        await waitForBusyIndicatorsToClear(target, timeout);
        return target;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for dialog to become visible after ${timeout}ms`);
}

export async function waitForConfirmOverlay(page: Page, timeout = 5000) {
  const overlay = page
    .locator(
      '.semi-popover:visible, .semi-modal-content[role="dialog"]:visible',
    )
    .first();
  await overlay.waitFor({ state: 'visible', timeout });
  return overlay;
}

export async function dismissTourOverlayIfPresent(page: Page) {
  const endTourBtn = page.getByRole('button', {
    name: /结束导览|End Tour/i,
  });
  if (await endTourBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await endTourBtn.click({ force: true });
    await waitForBusyIndicatorsToClear(page);
  }
}

export async function waitForDropdown(page: Page, timeout = 5000) {
  const dropdown = page
    .locator(
      '.semi-select-option-list:visible, .semi-select-dropdown:visible',
    )
    .last();
  await dropdown.waitFor({ state: 'visible', timeout });
  return dropdown;
}

export async function closeDialogWithEscape(
  page: Page,
  dialog: Locator,
  timeout = 5000,
) {
  const closeButton = dialog
    .locator('.semi-sidesheet-close, .semi-modal-close')
    .first();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await dialog.waitFor({ state: 'hidden', timeout }).catch(() => {});
  await waitForBusyIndicatorsToClear(page, timeout);
}

export async function waitForUploadReady(
  scope: Locator | Page,
  timeout = 10000,
) {
  const uploadItem = scope
    .locator('.semi-upload-file-card')
    .last();
  await uploadItem.waitFor({ state: 'visible', timeout });
  await scope
    .locator(
      '.semi-upload-file-card-icon-loading, .semi-upload-picture-file-card-uploading',
    )
    .first()
    .waitFor({ state: 'hidden', timeout })
    .catch(() => {});
  await waitForBusyIndicatorsToClear(scope, timeout);
  return uploadItem;
}

export async function setSwitchChecked(
  switchEl: Locator,
  checked: boolean,
  timeout = 5000,
) {
  const expected = checked ? 'true' : 'false';
  if ((await switchEl.getAttribute('aria-checked')) !== expected) {
    await switchEl.click();
  }
  await expect(switchEl).toHaveAttribute('aria-checked', expected, { timeout });
}

export async function dismissResultDialog(
  page: Page,
  title: string | RegExp,
  timeout = 2000,
) {
  const dialog = page
    .locator('.semi-modal-content[role="dialog"]:visible')
    .filter({ hasText: title })
    .last();
  const appeared = await dialog
    .waitFor({ state: 'visible', timeout })
    .then(() => true)
    .catch(() => false);
  if (!appeared) {
    return false;
  }
  await dialog
    .getByRole('button', { name: /确\s*定|确\s*认|OK|Confirm|知道了/i })
    .last()
    .click();
  await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  await waitForBusyIndicatorsToClear(page, 5000);
  return true;
}
