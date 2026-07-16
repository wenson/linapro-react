import type { MenuTreeNode } from "#/api/system/menu";

export function shouldUseAssociatedMenuSelection(
  menus: MenuTreeNode[],
  checkedKeys: number[],
): boolean {
  const checked = new Set(checkedKeys);
  let missingAncestor = false;

  function visit(nodes: MenuTreeNode[], ancestors: number[]) {
    for (const node of nodes) {
      if (checked.has(node.id) && ancestors.some((id) => !checked.has(id))) {
        missingAncestor = true;
        return;
      }
      visit(node.children ?? [], [...ancestors, node.id]);
      if (missingAncestor) return;
    }
  }

  visit(menus, []);
  return !missingAncestor;
}
