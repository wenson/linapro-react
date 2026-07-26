import { expect, type Locator, type Page } from '@playwright/test';

import { workspacePath } from '../fixtures/config';
import { captureEvidence } from '../support/evidence';

export class DashboardPage {
  constructor(private page: Page) {}

  get analyticsPage(): Locator {
    return this.page.getByTestId('dashboard-analytics-page');
  }

  get workspacePage(): Locator {
    return this.page.getByTestId('dashboard-workspace-page');
  }

  get workspaceDescription(): Locator {
    return this.page.getByTestId('dashboard-workspace-description');
  }

  get workspaceProjects(): Locator {
    return this.page.getByTestId('dashboard-workspace-projects');
  }

  get workspaceQuickNav(): Locator {
    return this.page.getByTestId('dashboard-workspace-quick-nav');
  }

  get workspaceTodos(): Locator {
    return this.page.getByTestId('dashboard-workspace-todos');
  }

  get workspaceTrends(): Locator {
    return this.page.getByTestId('dashboard-workspace-trends');
  }

  analyticsMetric(title: string): Locator {
    return this.page.getByTestId('dashboard-analytics-overview').getByText(title, { exact: true });
  }

  analyticsTab(label: string): Locator {
    return this.page
      .getByTestId('dashboard-analytics-tabs')
      .getByRole('button', { name: label, exact: true });
  }

  analyticsCardTitle(title: string): Locator {
    return this.page.getByRole('heading', { name: title }).first();
  }

  get analyticsCanvases(): Locator {
    return this.analyticsPage.locator("canvas");
  }

  async expectChartsRendered(expectedCount = 4) {
    await this.analyticsCanvases.first().waitFor({ state: "visible" });
    const count = await this.analyticsCanvases.count();
    if (count !== expectedCount) {
      throw new Error(`分析页图表数量错误：期望 ${expectedCount}，实际 ${count}`);
    }
    const sizes = await this.analyticsCanvases.evaluateAll((items) =>
      items.map((item) => ({
        height: (item as HTMLCanvasElement).height,
        width: (item as HTMLCanvasElement).width,
      })),
    );
    if (sizes.some((size) => size.height <= 0 || size.width <= 0)) {
      throw new Error(`分析页存在空画布：${JSON.stringify(sizes)}`);
    }

    let previousSignature = "";
    let stableRounds = 0;
    await expect.poll(async () => {
      const hashes = await this.analyticsCanvases.evaluateAll((items) =>
        items.map((item) => {
          const dataUrl = (item as HTMLCanvasElement).toDataURL("image/png");
          let hash = 2_166_136_261;
          for (let index = 0; index < dataUrl.length; index += 32) {
            hash ^= dataUrl.charCodeAt(index);
            hash = Math.imul(hash, 16_777_619);
          }
          return hash >>> 0;
        }),
      );
      const signature = hashes.join(":");
      if (signature === previousSignature) {
        stableRounds += 1;
      } else {
        previousSignature = signature;
        stableRounds = 0;
      }
      return stableRounds;
    }, { timeout: 7_000 }).toBeGreaterThanOrEqual(2);

    const colorfulPixels = await this.analyticsCanvases.evaluateAll((items) =>
      items.map((item) => {
        const canvas = item as HTMLCanvasElement;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return 0;
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let count = 0;
        for (let y = 0; y < canvas.height; y += 3) {
          for (let x = 0; x < canvas.width; x += 3) {
            const offset = (y * canvas.width + x) * 4;
            const red = pixels[offset] ?? 0;
            const green = pixels[offset + 1] ?? 0;
            const blue = pixels[offset + 2] ?? 0;
            const alpha = pixels[offset + 3] ?? 0;
            if (
              alpha > 0
              && Math.max(red, green, blue) - Math.min(red, green, blue) >= 32
              && Math.max(red, green, blue) >= 90
            ) {
              count += 1;
            }
          }
        }
        return count;
      }),
    );
    if (colorfulPixels.some((count) => count < 8)) {
      throw new Error(`分析页存在未绘制数据的图表：${JSON.stringify(colorfulPixels)}`);
    }
  }

  async capture(name: string) {
    return captureEvidence(this.page, name);
  }

  workspaceQuickNavItem(title: string): Locator {
    return this.workspaceQuickNav.getByText(title, { exact: true }).first();
  }

  async gotoAnalytics() {
    await this.page.goto(workspacePath('/dashboard/analytics'));
    await this.page.waitForLoadState('networkidle');
    await this.analyticsPage.waitFor({ state: 'visible' });
  }

  async gotoWorkspace() {
    await this.page.goto(workspacePath('/dashboard/workspace'));
    await this.page.waitForLoadState('networkidle');
    await this.workspacePage.waitFor({ state: 'visible' });
  }

  async clickWorkspaceQuickNav(title: string) {
    await this.workspaceQuickNavItem(title).click();
    await this.page.waitForLoadState('networkidle');
  }
}
