import { expect, type Locator, type Page } from "@playwright/test";

import { waitForRouteReady, waitForTableReady } from "../support/ui";
import { captureEvidence } from "../support/evidence";

type ElementBox = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export class LayoutAuditPage {
  constructor(private page: Page) {}

  async mockConfigListForLayoutAudit() {
    await this.page.route("**/api/v1/config?*", async (route) => {
      await route.fulfill({
        json: {
          code: 0,
          data: {
            list: [
              {
                canEdit: true,
                canOverride: false,
                createdAt: Date.now(),
                id: 9001,
                isBuiltin: 0,
                isFallback: false,
                key: "e2e.ui.responsive",
                name: "响应式参数",
                options: [],
                overrideMode: "none",
                remark: "",
                sourceTenantId: 0,
                updatedAt: Date.now(),
                value: "enabled",
                valueType: "text",
              },
            ],
            total: 1,
          },
          message: "OK",
        },
      });
    });
  }

  async goto(path: string, options?: { tableSelector?: string }) {
    await this.page.goto(path);
    if (options?.tableSelector) {
      await waitForTableReady(this.page, options.tableSelector);
      return;
    }
    await waitForRouteReady(this.page);
  }

  panel(id: string): Locator {
    return this.page.locator(`#${id}`).first();
  }

  formLabel(text: RegExp | string, scope?: Locator): Locator {
    return (scope ?? this.page)
      .locator(".semi-form-field-label, .semi-form-field-label-text, label", {
        hasText: text,
      })
      .first();
  }

  searchForm(): Locator {
    return this.page
      .locator("form.iam-search-form")
      .filter({
        has: this.page.getByRole("button", { name: /搜\s*索|Search/u }),
      })
      .filter({
        has: this.page.getByRole("button", { name: /重\s*置|Reset/u }),
      })
      .first();
  }

  searchCollapseToggle(): Locator {
    return this.searchForm()
      .getByTestId("search-collapse-toggle")
      .first();
  }

  searchFormLabel(text: RegExp | string): Locator {
    return this.formLabel(text, this.searchForm());
  }

  searchResetButton(): Locator {
    return this.searchForm()
      .getByRole("button", { name: /重\s*置|Reset/u })
      .first();
  }

  searchSubmitButton(): Locator {
    return this.searchForm()
      .getByRole("button", { name: /搜\s*索|Search/u })
      .first();
  }

  async expectSearchCollapseHidden() {
    await expect(this.searchCollapseToggle()).toHaveCount(0);
  }

  async expectSearchCollapseVisible() {
    await expect(this.searchCollapseToggle()).toBeVisible();
  }

  async expectSearchLabelHidden(text: RegExp | string) {
    await expect(this.searchFormLabel(text)).toBeHidden();
  }

  async expectSearchLabelVisible(text: RegExp | string) {
    await expect(this.searchFormLabel(text)).toBeVisible();
  }

  async toggleSearchCollapse() {
    const toggle = this.searchCollapseToggle();
    await expect(toggle).toBeVisible();
    await toggle.click();
  }

  async expectSearchControlsOnOneRow(labels: string[]) {
    const controls = [
      ...labels.map((label) =>
        this.searchForm().getByLabel(label, { exact: true }).first(),
      ),
      this.searchResetButton(),
      this.searchSubmitButton(),
    ];

    const boxes = await Promise.all(
      controls.map((control, index) =>
        this.visibleBoundingBox(control, `search-control-${index}`),
      ),
    );
    const centerYList = boxes.map((box) => box.y + box.height / 2);
    expect(Math.max(...centerYList) - Math.min(...centerYList)).toBeLessThan(
      32,
    );

    for (let index = 0; index < boxes.length; index += 1) {
      for (
        let nextIndex = index + 1;
        nextIndex < boxes.length;
        nextIndex += 1
      ) {
        expect(this.boxesOverlap(boxes[index]!, boxes[nextIndex]!)).toBe(false);
      }
    }
  }

  tableHeader(text: RegExp | string, scope?: Locator): Locator {
    return (scope ?? this.page)
      .locator(".semi-table-row-head, th", { hasText: text })
      .first();
  }

  async setViewport(width: number, height: number) {
    await this.page.setViewportSize({ height, width });
  }

  async expectNoHorizontalOverflow() {
    await expect
      .poll(async () =>
        this.page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        })),
      )
      .toEqual(await this.page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.clientWidth,
      })));
  }

  async expectDesktopList(options: {
    headers: Array<RegExp | string>;
    mobileListTestId: string;
    tableTestId: string;
  }) {
    const table = this.page.getByTestId(options.tableTestId);
    await expect(table).toBeVisible();
    await expect(this.page.getByTestId(options.mobileListTestId)).toBeHidden();
    for (const header of options.headers) {
      await expect(this.tableHeader(header, table)).toBeVisible();
    }

    const box = await this.visibleBoundingBox(table, options.tableTestId);
    const viewport = this.page.viewportSize();
    expect(viewport).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport!.width + 1);
  }

  async expectMobileList(options: {
    action?: RegExp | string;
    fields: Array<RegExp | string>;
    mobileListTestId: string;
    tableTestId: string;
  }) {
    const list = this.page.getByTestId(options.mobileListTestId);
    await expect(this.page.getByTestId(options.tableTestId)).toBeHidden();
    await expect(list).toBeVisible();
    const card = list.locator(".mobile-record-card").first();
    await expect(card).toBeVisible();
    for (const field of options.fields) {
      await expect(card.getByText(field).first()).toBeVisible();
    }
    if (options.action) {
      await expect(list.getByRole("button", { name: options.action }).first()).toBeVisible();
    }
    await this.expectNoHorizontalOverflow();
  }

  async capture(name: string) {
    return captureEvidence(this.page, name);
  }

  private boxesOverlap(first: ElementBox, second: ElementBox) {
    return (
      first.x < second.x + second.width - 1 &&
      first.x + first.width > second.x + 1 &&
      first.y < second.y + second.height - 1 &&
      first.y + first.height > second.y + 1
    );
  }

  private async visibleBoundingBox(locator: Locator, name: string) {
    await expect(locator, `${name} should be visible`).toBeVisible();
    const box = await locator.boundingBox();
    expect(box, `${name} should have a bounding box`).not.toBeNull();
    return box!;
  }
}
