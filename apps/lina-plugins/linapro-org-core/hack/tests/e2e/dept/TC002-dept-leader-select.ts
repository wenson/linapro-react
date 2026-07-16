import { expect, test } from "@host-tests/fixtures/auth";
import { prepareSourcePluginsBaseline } from "@host-tests/fixtures/plugin";
import {
  closeDialogWithEscape,
  waitForDialogReady,
  waitForRouteReady,
  waitForTableReady,
} from "@host-tests/support/ui";

const DEPT_TABLE_READY_TIMEOUT = 90_000;

test.describe("TC002 部门负责人选择", () => {
  test.beforeAll(async () => {
    await prepareSourcePluginsBaseline(["linapro-org-core"]);
  });

  test('TC002a: 新增部门按钮文本为"新增"而非"新增部门"', async ({
    adminPage,
  }) => {
    await adminPage.goto("/system/dept");
    await waitForTableReady(adminPage, '[data-testid="org-dept-table"]', DEPT_TABLE_READY_TIMEOUT);

    // The primary button should say "新增" not "新增部门"
    const addBtn = adminPage
      .getByRole("button", { name: /新\s*增/ })
      .filter({ hasText: /^新\s*增$/ })
      .first();
    await expect(addBtn).toBeVisible();
    const btnText = await addBtn.textContent();
    expect(btnText?.replace(/\s/g, "")).toBe("新增");
  });

  test("TC002b: 新增部门时负责人下拉可用且支持搜索", async ({ adminPage }) => {
    await adminPage.goto("/system/dept");
    await waitForTableReady(adminPage, '[data-testid="org-dept-table"]', DEPT_TABLE_READY_TIMEOUT);

    // Click the toolbar "新增" primary button (first match, the non-ghost one)
    await adminPage.getByTestId('org-dept-add').click();

    const drawer = adminPage.locator('[role="dialog"]');
    await waitForDialogReady(drawer);

    // The leader combobox should be accessible
    const leaderCombobox = drawer.getByRole("combobox", { name: "负责人" });
    await expect(leaderCombobox).toBeVisible({ timeout: 5000 });
    await expect(leaderCombobox).toBeInViewport({ ratio: 0.5, timeout: 5000 });

    // It should NOT be disabled
    await expect(leaderCombobox).toBeEnabled();

    // Click to open dropdown
    await leaderCombobox.click();
    const dropdown = adminPage.getByRole('listbox').last();
    await expect(dropdown).toBeVisible({ timeout: 5000 });

    // Should show user options
    const options = dropdown.getByRole('option');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(10);

    await closeDialogWithEscape(adminPage, drawer);
  });

  test("TC002c: 编辑部门时未设置负责人显示为空白", async ({ adminPage }) => {
    await adminPage.goto("/system/dept");
    await waitForTableReady(adminPage, '[data-testid="org-dept-table"]', DEPT_TABLE_READY_TIMEOUT);

    // Click edit on the first dept row
    const firstRow = adminPage.getByTestId('org-dept-table').locator('tbody tr:visible').first();
    await firstRow
      .getByRole("button", { name: /编\s*辑/ })
      .first()
      .click();

    const drawer = adminPage.locator('[role="dialog"]');
    await waitForDialogReady(drawer);

    // The leader combobox should NOT show "0" value
    const leaderCombobox = drawer.getByRole("combobox", { name: "负责人" });
    await expect(leaderCombobox).toBeVisible({ timeout: 5000 });

    await expect(leaderCombobox).not.toHaveText(/^\s*0\s*$/u);

    await closeDialogWithEscape(adminPage, drawer);
  });

  test("TC002d: 编辑部门时负责人下拉支持搜索", async ({ adminPage }) => {
    await adminPage.goto("/system/dept");
    await waitForTableReady(adminPage, '[data-testid="org-dept-table"]', DEPT_TABLE_READY_TIMEOUT);

    // Click edit on the first dept row
    const firstRow = adminPage.getByTestId('org-dept-table').locator('tbody tr:visible').first();
    await firstRow
      .getByRole("button", { name: /编\s*辑/ })
      .first()
      .click();

    const drawer = adminPage.locator('[role="dialog"]');
    await waitForDialogReady(drawer);

    // Leader combobox should be enabled and searchable
    const leaderCombobox = drawer.getByRole("combobox", { name: "负责人" });
    await expect(leaderCombobox).toBeVisible({ timeout: 5000 });
    await expect(leaderCombobox).toBeInViewport({ ratio: 0.5, timeout: 5000 });
    await expect(leaderCombobox).toBeEnabled();

    // Semi Select exposes the combobox on a div and renders its editable input
    // inside the component only after opening it.
    await leaderCombobox.click();
    const searchInput = leaderCombobox.locator("input").first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill("admin");
    await waitForRouteReady(adminPage);

    // Should show filtered results
    const dropdown = adminPage.getByRole('listbox').last();
    await expect(dropdown).toBeVisible({ timeout: 5000 });
    const options = dropdown.getByRole('option');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);

    // The first option should contain "admin"
    const firstOption = await options.first().textContent();
    expect(firstOption?.toLowerCase()).toContain("admin");

    await closeDialogWithEscape(adminPage, drawer);
  });
});
