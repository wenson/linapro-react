import { expect, it } from "vitest";

import type { MenuTreeNode } from "#/api/system/menu";
import { shouldUseAssociatedMenuSelection } from "#/features/iam/role/menu-selection";

const menus: MenuTreeNode[] = [{
  children: [{
    children: [{ id: 3, label: "Search", parentId: 2, type: "B" }],
    id: 2,
    label: "Users",
    parentId: 1,
    type: "M",
  }],
  id: 1,
  label: "Access control",
  parentId: 0,
  type: "D",
}];

it("detects independently persisted menu nodes without adding ancestors", () => {
  expect(shouldUseAssociatedMenuSelection(menus, [3])).toBe(false);
  expect(shouldUseAssociatedMenuSelection(menus, [1, 2, 3])).toBe(true);
});
