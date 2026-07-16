import type { TagColor } from "@douyinfe/semi-ui/lib/es/tag/interface";
import type { TreeNodeData } from "@douyinfe/semi-ui/lib/es/tree/interface";

import type { Dept, DeptTree, DictOption } from "./dept-client";

export interface DeptRow extends Dept {
  children?: DeptRow[];
}

export function buildDeptRows(items: Dept[]): DeptRow[] {
  const nodes = new Map<number, DeptRow>(items.map((item) => [item.id, { ...item, children: [] }]));
  const roots: DeptRow[] = [];
  for (const item of items) {
    const node = nodes.get(item.id);
    if (!node) continue;
    const parent = item.parentId ? nodes.get(item.parentId) : undefined;
    if (parent) parent.children?.push(node); else roots.push(node);
  }
  const sort = (rows: DeptRow[]) => { rows.sort((left, right) => left.orderNum - right.orderNum || left.id - right.id); for (const row of rows) { if (row.children?.length) sort(row.children); else delete row.children; } };
  sort(roots);
  return roots;
}

export function deptRowKeys(rows: DeptRow[]): number[] {
  const output: number[] = [];
  const visit = (items: DeptRow[]) => { for (const item of items) { output.push(item.id); if (item.children) visit(item.children); } };
  visit(rows);
  return output;
}

export function toDeptSelectTree(items: DeptTree[], parentPath = ""): TreeNodeData[] {
  return items.map((item) => {
    const fullName = parentPath ? `${parentPath} / ${item.label}` : item.label;
    return { children: toDeptSelectTree(item.children ?? [], fullName), key: String(item.id), label: fullName, value: item.id };
  });
}

export function toDeptSelectTreeFromRows(items: Dept[], parentPath = ""): TreeNodeData[] {
  return buildDeptRows(items).map(function convert(item): TreeNodeData {
    const fullName = parentPath ? `${parentPath} / ${item.name}` : item.name;
    return { children: (item.children ?? []).map((child) => convertWithPath(child, fullName)), key: String(item.id), label: fullName, value: item.id };
  });
}

function convertWithPath(item: DeptRow, parentPath: string): TreeNodeData {
  const fullName = `${parentPath} / ${item.name}`;
  return { children: (item.children ?? []).map((child) => convertWithPath(child, fullName)), key: String(item.id), label: fullName, value: item.id };
}

export function dictColor(options: DictOption[], value: number): TagColor {
  const style = options.find((item) => Number(item.value) === value)?.tagStyle;
  const colors = new Set<TagColor>(["amber", "blue", "cyan", "green", "grey", "indigo", "light-blue", "light-green", "lime", "orange", "pink", "purple", "red", "teal", "violet", "white", "yellow"]);
  return colors.has(style as TagColor) ? style as TagColor : "blue";
}

export function dictLabel(options: DictOption[], value: number): string {
  return options.find((item) => Number(item.value) === value)?.label ?? String(value);
}

export function formatTimestamp(value: number | null, locale: string): string {
  return value ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value)) : "-";
}
