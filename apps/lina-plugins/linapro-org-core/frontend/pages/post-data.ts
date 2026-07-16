import type { TreeNodeData } from "@douyinfe/semi-ui/lib/es/tree/interface";

import type { PostDeptTreeNode } from "./post-client";

export function toPostDeptTree(items: PostDeptTreeNode[]): TreeNodeData[] {
  return items.map((item) => ({
    children: toPostDeptTree(item.children ?? []),
    key: String(item.id),
    label: /\(\d+\)$/.test(item.label) ? item.label : `${item.label} (${item.postCount})`,
    value: item.id,
  }));
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
