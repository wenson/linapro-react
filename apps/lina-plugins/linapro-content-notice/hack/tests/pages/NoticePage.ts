import { expect, type Page } from "@host-tests/support/playwright";
import { captureEvidence } from "@host-tests/support/evidence";

import {
  waitForConfirmOverlay,
  waitForDialogReady,
  waitForRouteReady,
  waitForTableReady,
} from "@host-tests/support/ui";

export class NoticePage {
  constructor(private page: Page) {}

  private resolveLocalizedLabel(label: string) {
    const labelMap: Record<string, RegExp> = {
      公告标题: /公告标题|Title|plugin\.linapro-content-notice\.fields\.title/i,
      公告类型: /公告类型|Type|plugin\.linapro-content-notice\.fields\.type/i,
      创建者:
        /创建者|Created By|plugin\.linapro-content-notice\.fields\.createdBy/i,
    };
    const localizedLabel = labelMap[label];
    if (localizedLabel) {
      return this.page.getByLabel(localizedLabel).first();
    }
    return this.page.getByLabel(label, { exact: true }).first();
  }

  /** The Vben modal container */
  private get modal() {
    return this.page.locator('[role="dialog"]');
  }

  async goto() {
    await this.page.goto("/system/notice");
    await waitForTableReady(this.page);
  }

  /** Create a new notice */
  async createNotice(
    title: string,
    type: "通知" | "公告",
    status: "草稿" | "已发布",
    content?: string,
  ) {
    await this.page
      .getByRole("button", { name: /新\s*增/ })
      .first()
      .click();

    await waitForDialogReady(this.modal);
    await expect(this.modal.getByRole("button", { name: "加粗" })).toBeVisible();
    await expect(this.modal.getByRole("button", { name: "斜体" })).toBeVisible();
    await expect(this.modal.getByRole("button", { name: "下划线" })).toBeVisible();
    await expect(this.modal.getByRole("button", { name: "Bold" })).toHaveCount(0);

    // Fill title - use placeholder to find the input inside the modal
    const titleInput = this.modal.getByPlaceholder("请输入公告标题").first();
    await titleInput.fill(title);

    // Select status (RadioButton) - using label text since they're button-style radios
    await this.modal.getByRole("radio", { name: status }).click();

    // Select type (RadioButton)
    await this.modal.getByRole("radio", { name: type }).click();

    // Type content in Tiptap editor if provided
    if (content) {
      const editor = this.modal.locator('.tiptap[contenteditable="true"]');
      await editor.waitFor({ state: "visible", timeout: 5000 });
      await editor.click();
      await this.page.keyboard.type(content, { delay: 20 });
    }

    // Click confirm button (modal footer)
    await this.modal.getByRole("button", { name: /确\s*认/ }).click();

    await waitForRouteReady(this.page);
    await this.modal
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  }

  /** Edit a notice: search by title, click edit, update title */
  async editNotice(searchTitle: string, newTitle: string) {
    await this.fillSearchField("公告标题", searchTitle);
    await this.clickSearch();

    const row = this.page.getByTestId("notice-table").locator("tbody tr:visible", {
      hasText: searchTitle,
    });
    await row.first().waitFor({ state: "visible", timeout: 10000 });
    await row
      .locator("button:visible")
      .filter({ hasText: /编\s*辑/ })
      .first()
      .click();

    await waitForDialogReady(this.modal);

    const titleInput = this.modal.getByPlaceholder("请输入公告标题").first();
    await titleInput.clear();
    await titleInput.fill(newTitle);

    await this.modal.getByRole("button", { name: /确\s*认/ }).click();

    await waitForRouteReady(this.page);
    await this.modal
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  }

  /** Delete a notice: search by title, click delete, confirm */
  async deleteNotice(title: string) {
    await this.fillSearchField("公告标题", title);
    await this.clickSearch();

    const row = this.page.getByTestId("notice-table").locator("tbody tr:visible", { hasText: title });
    await row.first().waitFor({ state: "visible", timeout: 10000 });
    await row
      .locator("button:visible")
      .filter({ hasText: /删\s*除/ })
      .first()
      .click();

    const popconfirm = await waitForConfirmOverlay(this.page);
    const confirmBtn = popconfirm.getByRole("button", {
      name: /确\s*定|OK|是/i,
    });
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    await waitForRouteReady(this.page);
  }

  async deleteNoticeIfExists(title: string) {
    if (await this.hasNotice(title)) {
      await this.deleteNotice(title);
    }
  }

  /** Check if a notice with the given title is visible */
  async hasNotice(title: string): Promise<boolean> {
    await this.fillSearchField("公告标题", title);
    await this.clickSearch();
    return this.page
      .getByTestId("notice-table").locator("tbody tr:visible", { hasText: title })
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
  }

  /** Preview a notice: search by title, click preview button */
  async previewNotice(title: string) {
    await this.fillSearchField("公告标题", title);
    await this.clickSearch();

    await this.page
      .getByRole("button", { name: /预\s*览/ })
      .first()
      .click();

    await waitForDialogReady(this.modal);
  }

  /** Fill search form field by label */
  async fillSearchField(label: string, value: string) {
    const input = this.resolveLocalizedLabel(label);
    await input.clear();
    await input.fill(value);
  }

  /** Click search button */
  async clickSearch() {
    await this.page
      .getByRole("button", { name: /搜\s*索|Search/i })
      .first()
      .click();
    await waitForRouteReady(this.page);
  }

  /** Click reset button */
  async clickReset() {
    await this.page
      .getByRole("button", { name: /重\s*置|Reset/i })
      .first()
      .click();
    await waitForRouteReady(this.page);
  }

  /** Get total count from pager */
  async getTotalCount(): Promise<number> {
    const pager = this.page.locator(".semi-page-total");
    if (await pager.count() === 0) return 0;
    const text = await pager.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async assertResponsiveLayout() {
    await this.page.setViewportSize({ height: 768, width: 1366 });
    await waitForTableReady(this.page, '[data-testid="notice-table"]');

    const form = this.page.locator("form.notice-search-form");
    const searchButton = form.getByRole("button", { name: /搜索|Search/i });
    const resetButton = form.getByRole("button", { name: /重置|Reset/i });
    await expect(searchButton).toBeVisible();
    await expect(resetButton).toBeVisible();
    const [searchBox, resetBox] = await Promise.all([
      searchButton.boundingBox(),
      resetButton.boundingBox(),
    ]);
    expect(searchBox).not.toBeNull();
    expect(resetBox).not.toBeNull();
    expect(searchBox!.width).toBeLessThan(160);
    expect(resetBox!.width).toBeLessThan(160);
    expect(resetBox!.x + resetBox!.width).toBeLessThanOrEqual(searchBox!.x + 1);

    const table = this.page.getByTestId("notice-table");
    const mobileList = this.page.getByTestId("notice-mobile-list");
    await expect(table).toBeVisible();
    await expect(mobileList).toBeHidden();
    for (const header of [
      /公告标题|Notice Title/i,
      /公告类型|Notice Type/i,
      /状态|Status/i,
      /创建人|Created By/i,
      /创建时间|Created At/i,
      /操作|Actions/i,
    ]) {
      await expect(
        table.locator(".semi-table-row-head, th", { hasText: header }).first(),
      ).toBeVisible();
    }
    await captureEvidence(
      this.page,
      "ui-remediation-notice-1366x768-desktop-e2e",
    );

    await this.page.setViewportSize({ height: 844, width: 390 });
    await expect(table).toBeHidden();
    await expect(mobileList).toBeVisible();
    const card = mobileList.locator(".mobile-record-card").first();
    await expect(card).toBeVisible();
    for (const field of [
      /公告类型|Notice Type/i,
      /状态|Status/i,
      /创建人|Created By/i,
      /创建时间|Created At/i,
    ]) {
      await expect(card.getByText(field).first()).toBeVisible();
    }
    for (const action of [/预览|Preview/i, /编辑|Edit/i]) {
      await expect(card.getByRole("button", { name: action })).toBeVisible();
    }
    await expect
      .poll(async () =>
        this.page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        })),
      )
      .toEqual({ clientWidth: 390, scrollWidth: 390 });
    await captureEvidence(
      this.page,
      "ui-remediation-notice-390x844-mobile-e2e",
    );
  }
}
