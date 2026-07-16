import type { Locator, Page } from "@playwright/test";

import { expect, test } from "../../../fixtures/auth";
import { MenuPage } from "../../../pages/MenuPage";
import { waitForBusyIndicatorsToClear } from "../../../support/ui";

async function openParentTree(page: Page, drawer: Locator) {
  await drawer
    .getByRole("combobox", { name: /上级菜单|Parent menu/i })
    .click();
  const tree = page.getByRole("tree").last();
  await expect(tree).toBeVisible({ timeout: 5_000 });
  return tree;
}

async function revealTreeLabel(tree: Locator, label: string) {
  const target = tree.getByText(label, { exact: true });
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (await target.isVisible().catch(() => false)) return target;
    const expander = tree
      .locator(".semi-tree-option-expand-icon:not(.semi-tree-option-expand-icon-empty)")
      .filter({ visible: true })
      .first();
    if (!(await expander.isVisible().catch(() => false))) break;
    await expander.click();
  }
  await expect(target).toBeVisible({ timeout: 3_000 });
  return target;
}

test.describe("TC001 菜单管理 CRUD", () => {
  test("TC001a: 菜单列表页面正常加载", async ({ authenticatedPage: page }) => {
    const menuPage = new MenuPage(page);
    await menuPage.goto();

    await expect(menuPage.table.getByRole("treegrid")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^新\s*增$|^Add$/i }).first(),
    ).toBeVisible();
    await expect(
      page
        .getByRole("button", { name: /展开全部|Expand all|展\s*开/i })
        .first(),
    ).toBeVisible();
    await menuPage.expectLayoutHeightStable();
  });

  test("TC001b: 创建菜单对话框打开", async ({ authenticatedPage: page }) => {
    const menuPage = new MenuPage(page);
    await menuPage.goto();
    const drawer = await menuPage.openCreateDrawer();

    await expect(
      drawer.getByRole("textbox", { name: /菜单名称|Menu name/i }),
    ).toBeVisible();
    await menuPage.closeDrawer();
  });

  test("TC001c: 级联删除开关功能", async ({ authenticatedPage: page }) => {
    const menuPage = new MenuPage(page);
    await menuPage.goto();
    const checkbox = menuPage.cascadeDeleteCheckbox;
    await expect(checkbox).toBeVisible({ timeout: 5_000 });
    const initialState = await checkbox.isChecked();

    await menuPage.cascadeDeleteControl.click();
    await expect(checkbox).toBeChecked({ checked: !initialState });
  });

  test("TC001d: 折叠按钮功能", async ({ authenticatedPage: page }) => {
    const menuPage = new MenuPage(page);
    await menuPage.goto();

    await menuPage.expandAll();
    await expect(
      page
        .getByRole("button", { name: /折叠全部|Collapse all|折\s*叠/i })
        .first(),
    ).toBeVisible();
    await menuPage.collapseAll();
    await expect(
      page
        .getByRole("button", { name: /展开全部|Expand all|展\s*开/i })
        .first(),
    ).toBeVisible();
  });

  test("TC001e: 表单字段验证", async ({ authenticatedPage: page }) => {
    const menuPage = new MenuPage(page);
    await menuPage.goto();
    const drawer = await menuPage.openCreateDrawer();

    await expect(
      drawer.getByRole("textbox", { name: /菜单名称|Menu name/i }),
    ).toBeVisible();
    await expect(
      drawer.getByRole("combobox", { name: /上级菜单|Parent menu/i }),
    ).toBeVisible();
    await menuPage.closeDrawer();
  });

  test("TC001f: 创建根菜单流程", async ({ authenticatedPage: page }) => {
    const menuPage = new MenuPage(page);
    await menuPage.goto();
    const menuName = `e2e_test_${Date.now()}`;

    try {
      await menuPage.createRootMenu({
        name: menuName,
        path: `e2e-test-${Date.now()}`,
        sort: 999,
        type: "D",
      });
      await menuPage.searchMenu(menuName);
      await expect(menuPage.table).toContainText(menuName);
    } finally {
      if (await menuPage.hasMenu(menuName)) {
        await menuPage.deleteMenu(menuName);
      }
    }
  });

  test("TC001g: 编辑菜单时表单应展示被编辑菜单的内容", async ({
    authenticatedPage: page,
  }) => {
    const menuPage = new MenuPage(page);
    await menuPage.goto();
    await menuPage.searchMenu("权限管理");
    const drawer = await menuPage.openEditDrawer("权限管理");
    const nameInput = drawer.getByRole("textbox", {
      name: /菜单名称|Menu name/i,
    });

    await expect(nameInput).toHaveValue("权限管理");
    await menuPage.closeDrawer();
  });

  test("TC001h: 上级菜单下拉树应展示子级菜单", async ({ authenticatedPage: page }) => {
    const menuPage = new MenuPage(page);
    await menuPage.goto();
    const drawer = await menuPage.openCreateDrawer();
    const tree = await openParentTree(page, drawer);

    await revealTreeLabel(tree, "权限管理");
    const expanders = tree.locator(
      ".semi-tree-option-expand-icon:not(.semi-tree-option-expand-icon-empty)",
    );
    expect(await expanders.count()).toBeGreaterThan(0);
    await page.keyboard.press("Escape");
    await menuPage.closeDrawer();
  });

  test("TC001i: 编辑菜单时上级菜单应禁用当前菜单及其子孙节点", async ({
    authenticatedPage: page,
  }) => {
    const menuPage = new MenuPage(page);
    await menuPage.goto();
    await menuPage.searchMenu("权限管理");
    const drawer = await menuPage.openEditDrawer("权限管理");
    const tree = await openParentTree(page, drawer);

    await expect(tree.getByText("权限管理", { exact: true })).toHaveCount(0);
    await expect(tree.getByText("用户管理", { exact: true })).toHaveCount(0);
    await expect(tree.getByText("角色管理", { exact: true })).toHaveCount(0);
    await expect(tree.getByText("菜单管理", { exact: true })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await menuPage.closeDrawer();
  });

  test("TC001j: 新增菜单时上级菜单无禁用节点", async ({ authenticatedPage: page }) => {
    const menuPage = new MenuPage(page);
    await menuPage.goto();
    const drawer = await menuPage.openCreateDrawer();
    const tree = await openParentTree(page, drawer);

    await revealTreeLabel(tree, "权限管理");
    await expect(tree.locator('[aria-disabled="true"]')).toHaveCount(0);
    await page.keyboard.press("Escape");
    await menuPage.closeDrawer();
  });

  test("TC001k: 备注字段应为 Textarea 组件", async ({ authenticatedPage: page }) => {
    const menuPage = new MenuPage(page);
    await menuPage.goto();
    const drawer = await menuPage.openCreateDrawer();
    const remark = drawer.getByRole("textbox", { name: /备注|Remark/i });

    await expect(remark).toBeVisible();
    expect(await remark.evaluate((element) => element.tagName.toLowerCase())).toBe(
      "textarea",
    );
    await expect(remark).toHaveAttribute("rows", "3");
    await menuPage.closeDrawer();
  });

  test("TC001l: 点击菜单行的新增按钮，上级菜单应默认选中当前菜单", async ({
    authenticatedPage: page,
  }) => {
    const menuPage = new MenuPage(page);
    await menuPage.goto();
    await menuPage.searchMenu("权限管理");
    const drawer = await menuPage.openAddChildDrawer("权限管理");

    await expect(
      drawer.getByRole("combobox", { name: /上级菜单|Parent menu/i }),
    ).toContainText("权限管理");
    await menuPage.closeDrawer();
  });

  test("TC001m: 权限标识输入框应显示在菜单名称下方", async ({
    authenticatedPage: page,
  }) => {
    const menuPage = new MenuPage(page);
    await menuPage.goto();
    const drawer = await menuPage.openCreateDrawer();
    await menuPage.selectMenuType("M");
    const nameInput = drawer.getByRole("textbox", {
      name: /菜单名称|Menu name/i,
    });
    const permissionInput = drawer.getByRole("textbox", {
      name: /权限标识|Permission/i,
    });

    const nameBox = await nameInput.boundingBox();
    const permissionBox = await permissionInput.boundingBox();
    expect(nameBox).not.toBeNull();
    expect(permissionBox).not.toBeNull();
    expect(permissionBox!.y).toBeGreaterThan(nameBox!.y);
    await menuPage.closeDrawer();
  });

  test("TC001n: 菜单类型未填写权限标识时不允许提交", async ({
    authenticatedPage: page,
  }) => {
    const menuPage = new MenuPage(page);
    await menuPage.goto();
    const drawer = await menuPage.openCreateDrawer();
    await menuPage.selectMenuType("M");
    await drawer
      .getByRole("textbox", { name: /菜单名称|Menu name/i })
      .fill(`e2e-menu-${Date.now()}`);
    await drawer
      .getByRole("textbox", { name: /路由路径|Route path/i })
      .fill(`e2e-menu-${Date.now()}`);
    await drawer
      .getByRole("textbox", { name: /组件路径|Component path/i })
      .fill("system/menu/index");

    await drawer
      .getByRole("button", { name: /^保\s*存$|^Save$/i })
      .click();
    await expect(drawer.getByText("请输入权限标识")).toBeVisible();
    await expect(drawer).toBeVisible();
    await menuPage.closeDrawer();
  });

  test("TC001o: 按钮类型未填写权限标识时不允许提交", async ({
    authenticatedPage: page,
  }) => {
    const menuPage = new MenuPage(page);
    await menuPage.goto();
    const drawer = await menuPage.openCreateDrawer();
    await menuPage.selectMenuType("B");
    await drawer
      .getByRole("textbox", { name: /菜单名称|Menu name/i })
      .fill(`e2e-button-${Date.now()}`);

    await drawer
      .getByRole("button", { name: /^保\s*存$|^Save$/i })
      .click();
    await expect(drawer.getByText("请输入权限标识")).toBeVisible();
    await expect(drawer).toBeVisible();
    await menuPage.closeDrawer();
  });

  test("TC001p: 菜单改为隐藏后左侧导航应立即刷新", async ({
    authenticatedPage: page,
  }) => {
    const menuPage = new MenuPage(page);
    const menuName = "角色管理";
    await menuPage.goto();
    await menuPage.expectSidebarContains(menuName);

    try {
      await menuPage.updateMenuVisibility(menuName, 0);
      await menuPage.expectSidebarNotContains(menuName);
    } finally {
      await menuPage.updateMenuVisibility(menuName, 1);
      await menuPage.expectSidebarContains(menuName);
    }
  });

  test("TC001q: 菜单图标重复时不允许保存", async ({ authenticatedPage: page }) => {
    const menuPage = new MenuPage(page);
    await menuPage.goto();
    const drawer = await menuPage.openCreateDrawer();
    await drawer
      .getByRole("textbox", { name: /菜单名称|Menu name/i })
      .fill(`e2e-duplicate-icon-${Date.now()}`);
    await drawer
      .getByRole("textbox", { name: /菜单图标|Menu icon/i })
      .fill("lucide:layout-dashboard");
    await drawer
      .getByRole("textbox", { name: /路由路径|Route path/i })
      .fill(`e2e-duplicate-icon-${Date.now()}`);

    await drawer
      .getByRole("button", { name: /^保\s*存$|^Save$/i })
      .click();
    await waitForBusyIndicatorsToClear(page);
    await expect(
      page.getByText(/菜单图标.*已被其他目录或菜单使用/),
    ).toBeVisible({ timeout: 5_000 });
    await expect(drawer).toBeVisible();
    await menuPage.closeDrawer();
  });
});
