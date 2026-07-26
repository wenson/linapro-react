import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

import { waitForRouteReady } from "../support/ui";
import { captureEvidence } from "../support/evidence";

type SidebarMenuLabel = RegExp | string;

export class MainLayout {
  constructor(private page: Page) {}

  private async waitForLocalePersistence(locale: string) {
    await expect
      .poll(async () => {
        try {
          return await this.page.evaluate(() => {
            const key = Object.keys(localStorage).find((item) =>
              item.endsWith("preferences-locale"),
            );
            if (!key) {
              return "";
            }
            try {
              return JSON.parse(localStorage.getItem(key) || "{}")?.value || "";
            } catch {
              return "";
            }
          });
        } catch {
          return "";
        }
      })
      .toBe(locale);
  }

  get sidebar() {
    return this.page.locator('.workbench-sider').first();
  }

  get header() {
    return this.page.locator(".workbench-header").first();
  }

  get mobileNavigationTrigger() {
    return this.page.locator(".mobile-navigation-trigger").first();
  }

  get mobileNavigationDrawer() {
    return this.page.locator('.semi-sidesheet-inner[role="dialog"]').filter({
      has: this.page.locator('.workbench-navigation'),
    }).first();
  }

  get tabs() {
    return this.page.getByTestId("workbench-tabs");
  }

  get languageToggleTrigger() {
    return this.page.getByTestId("language-toggle-trigger").first();
  }

  get brandLogoImage() {
    return this.page.locator('img[alt^="LinaPro"]:visible').first();
  }

  get brandLogoMark() {
    return this.page.locator(".workbench-brand-mark:visible").first();
  }

  sidebarMenuItem(label: SidebarMenuLabel) {
    if (typeof label !== "string") {
      return this.sidebar.getByText(label).first();
    }
    return this.sidebar.getByText(label, { exact: true }).first();
  }

  sidebarMenuIcon(label: SidebarMenuLabel) {
    return this.sidebarMenuItem(label)
      .locator("xpath=ancestor::li[contains(@class, 'semi-navigation-item')][1]")
      .getByRole("img")
      .first();
  }

  private sidebarSubmenuTitle(label: SidebarMenuLabel) {
    return this.sidebar.getByText(label).first();
  }

  async expandSidebarGroup(label: SidebarMenuLabel) {
    await this.page.evaluate(() => window.scrollTo(0, 0));
    const title = this.sidebarSubmenuTitle(label);
    await expect(title).toBeVisible();
    const expandable = title.locator("xpath=ancestor-or-self::*[@aria-expanded][1]");
    if ((await expandable.count()) > 0) {
      const ariaExpanded = await expandable.getAttribute("aria-expanded");
      if (ariaExpanded !== "true") {
        await expandable.click();
      }
      return;
    }
    await title.click();
  }

  async expectSidebarMenuVisible(label: SidebarMenuLabel) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const menuItem = this.sidebarMenuItem(label);
      if (await menuItem.isVisible().catch(() => false)) {
        await expect(menuItem).toBeVisible();
        return menuItem;
      }

      await this.expandSidebarGroup(/Extension Center|Extensions|扩展中心/);
      if (await menuItem.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(menuItem).toBeVisible();
        return menuItem;
      }

      if (attempt < 3) {
        await this.page.reload({ waitUntil: "domcontentloaded" });
        await waitForRouteReady(this.page, 15000);
      }
    }

    const menuItem = this.sidebarMenuItem(label);
    await expect(menuItem).toBeVisible();
    return menuItem;
  }

  tabTitle(label: string) {
    return this.page
      .locator('[data-tab-item="true"] span[title]')
      .filter({ hasText: label })
      .first();
  }

  breadcrumbItem(label: string) {
    return this.page
      .locator('nav[aria-label="breadcrumb"]')
      .getByText(label, { exact: true })
      .first();
  }

  activeTabTitle() {
    return this.page
      .locator('[data-tab-item="true"].is-active span[title]')
      .first();
  }

  get userDropdownTrigger() {
    return this.page.getByTestId("layout-user-dropdown-trigger").first();
  }

  get userDropdownMenu() {
    return this.page.getByTestId("layout-user-dropdown-menu");
  }

  get userDropdownProfile() {
    return this.page.getByTestId("layout-user-dropdown-profile");
  }

  get userDropdownName() {
    return this.page.getByTestId("layout-user-dropdown-name");
  }

  get userDropdownHandle() {
    return this.page.getByTestId("layout-user-dropdown-tag");
  }

  get userDropdownEmail() {
    return this.page.getByTestId("layout-user-dropdown-description");
  }

  get userDropdownAvatar() {
    return this.page.getByTestId("layout-user-dropdown-trigger-avatar");
  }

  get preferencesTrigger() {
    return this.page.getByTestId("preferences-trigger").first();
  }

  get preferencesDrawerTitle() {
    return this.page.getByTestId("preferences-drawer-title").first();
  }

  get preferencesDrawerSubtitle() {
    return this.page.getByTestId("preferences-drawer-subtitle").first();
  }

  get preferencesDrawer() {
    return this.page
      .locator('[role="dialog"], [data-slot="sheet-content"]')
      .filter({
        has: this.page.locator('[data-testid="preferences-drawer-title"]'),
      })
      .first();
  }

  get tenantSwitcher() {
    return this.page.getByTestId("tenant-switcher");
  }

  get workspaceFooterCopyright() {
    return this.page
      .locator("footer")
      .filter({ hasText: "Copyright ©" })
      .first()
      .getByText(/Copyright ©/);
  }

  async navigateTo(menuGroup: string, menuItem: string) {
    await this.page.getByText(menuGroup).click();
    await this.page.getByText(menuItem).click();
    await this.page.waitForLoadState("networkidle");
  }

  async openWorkbenchRoute(path: string) {
    await this.page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(this.page.getByTestId("workbench-tabs")).toBeVisible();
  }


  async switchLanguage(label: "English" | "简体中文") {
    const localeMap = {
      English: "en-US",
      简体中文: "zh-CN",
    } as const;
    const locale = localeMap[label];
    await this.languageToggleTrigger.click();
    await this.page.getByText(label, { exact: true }).last().click();
    await this.waitForLocalePersistence(locale);
    await expect
      .poll(async () => await this.page.locator("html").getAttribute("lang"))
      .toBe(locale);
    await this.page.waitForLoadState("networkidle");
    await waitForRouteReady(this.page);
  }

  async switchLanguageFromPreferences(
    label: "English" | "简体中文",
  ) {
    const localeMap = {
      English: "en-US",
      简体中文: "zh-CN",
    } as const;
    const locale = localeMap[label];
    if (!(await this.preferencesDrawer.isVisible().catch(() => false))) {
      await this.openPreferences();
    }
    await this.preferencesDrawer.getByRole("tab", { name: /General|通用/ }).click();
    await this.preferencesDrawer.getByRole("combobox").first().click();
    await this.page.getByRole("option", { name: label }).click();
    await this.waitForLocalePersistence(locale);
    await expect
      .poll(async () => await this.page.locator("html").getAttribute("lang"))
      .toBe(locale);
    await waitForRouteReady(this.page);
  }

  async getBrandLogoInfo() {
    await expect(this.brandLogoImage).toBeVisible();
    await expect
      .poll(async () =>
        this.brandLogoImage.evaluate(
          (img) => (img as HTMLImageElement).naturalWidth,
        ),
      )
      .toBeGreaterThan(0);

    return this.brandLogoImage.evaluate((node) => {
      const img = node as HTMLImageElement;
      return {
        currentSrc: img.currentSrc,
        height: img.clientHeight,
        naturalHeight: img.naturalHeight,
        naturalWidth: img.naturalWidth,
        parentText:
          (img.closest(".workbench-brand") ?? img.closest("a") ?? img.parentElement)
            ?.textContent?.trim() ?? "",
        src: img.getAttribute("src") ?? "",
        width: img.clientWidth,
      };
    });
  }

  async getBrandLogoGlowInfo() {
    await expect(this.brandLogoMark).toBeVisible();

    return this.brandLogoMark.evaluate((mark) => {
      const root = mark.closest(".workbench-brand");
      const link = root;
      const image = mark.querySelector("img") as HTMLElement;
      const beforeStyle = window.getComputedStyle(mark, "::before");
      const imageStyle = image ? window.getComputedStyle(image) : null;
      const markRect = mark.getBoundingClientRect();
      const linkRect = link?.getBoundingClientRect();

      return {
        beforeBackgroundImage: beforeStyle.backgroundImage,
        beforeFilter: beforeStyle.filter,
        beforeOpacity: beforeStyle.opacity,
        imageClientHeight: image?.clientHeight ?? 0,
        imageClientWidth: image?.clientWidth ?? 0,
        imageFilter: imageStyle?.filter ?? "",
        isDarkRoot: document.documentElement.classList.contains("dark"),
        linkHeight: linkRect?.height ?? 0,
        linkOverflow: link ? window.getComputedStyle(link).overflow : "",
        markHeight: markRect.height,
        markWidth: markRect.width,
      };
    });
  }

  async ensureThemeMode(mode: "dark" | "light") {
    const shouldBeDark = mode === "dark";
    const isDark = await this.page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );

    if (isDark !== shouldBeDark) {
      await this.page
        .locator(`button[aria-label="${mode}"]:visible`)
        .first()
        .click();
    }

    await expect
      .poll(async () =>
        this.page.evaluate(() =>
          document.documentElement.classList.contains("dark"),
        ),
      )
      .toBe(shouldBeDark);
    await waitForRouteReady(this.page);
  }

  async openUserDropdown() {
    await this.userDropdownTrigger.click();
    await expect(this.userDropdownMenu).toBeVisible();
  }

  async openMobileNavigation() {
    await this.mobileNavigationTrigger.click();
    await expect(this.mobileNavigationDrawer).toBeVisible();
  }

  async expectMobileNavigationItem(label: RegExp | string) {
    await expect(
      this.mobileNavigationDrawer
        .getByRole("list")
        .getByText(label, { exact: typeof label === "string" })
        .first(),
    ).toBeVisible();
  }

  async closeMobileNavigation() {
    const close = this.mobileNavigationDrawer.locator(".semi-sidesheet-close").first();
    if (await close.isVisible().catch(() => false)) {
      await close.click();
    } else {
      await this.page.keyboard.press("Escape");
    }
    await expect(this.mobileNavigationDrawer).toBeHidden();
  }

  async navigateDirect(path: string) {
    await this.page.goto(path);
    await waitForRouteReady(this.page, 15_000);
  }

  async expectHeaderWithinViewport() {
    await expect(this.header).toBeVisible();
    const overflow = await this.page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(overflow.scrollWidth).toBe(overflow.clientWidth);
    const box = await this.header.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(overflow.clientWidth + 1);
  }

  async expectTabsSingleRow() {
    await expect(this.tabs).toBeVisible();
    const inspect = () => this.tabs.evaluate((node) => {
      const items = [...node.querySelectorAll<HTMLElement>('[data-tab-item="true"]')]
        .filter((item) => item.offsetParent !== null);
      const rows = new Set(items.map((item) => Math.round(item.getBoundingClientRect().top)));
      const active = node.querySelector<HTMLElement>('[data-tab-item="true"].is-active');
      const activeLabel = active?.querySelector<HTMLElement>(".tab-label span[title]");
      const activeBox = activeLabel?.getBoundingClientRect();
      const visibleWidth = activeBox
        ? Math.max(0, Math.min(activeBox.right, window.innerWidth) - Math.max(activeBox.left, 0))
        : 0;
      return {
        activeVisible: Boolean(
          activeBox && visibleWidth / Math.max(activeBox.width, 1) >= 0.95,
        ),
        itemCount: items.length,
        rowCount: rows.size,
      };
    });
    const result = await inspect();
    expect(result.itemCount).toBeGreaterThanOrEqual(3);
    expect(result.rowCount).toBe(1);
    await expect.poll(async () => (await inspect()).activeVisible).toBe(true);
  }

  async capture(name: string) {
    return captureEvidence(this.page, name);
  }

  async openPreferences() {
    await expect(this.preferencesTrigger).toBeVisible();
    await this.preferencesTrigger.click();
    await expect(this.preferencesDrawerTitle).toBeVisible();
    await expect(this.preferencesDrawer).toBeVisible();
  }

  async openPreferencesTab(label: string | RegExp) {
    await this.openPreferences();
    await this.preferencesDrawer.getByRole("tab", { name: label }).click();
  }

  async logout() {
    await this.openUserDropdown();
    await this.page.getByTestId("layout-user-dropdown-logout").click();
    await this.page.waitForURL(/auth\/login/, { timeout: 10000 });
  }
}
