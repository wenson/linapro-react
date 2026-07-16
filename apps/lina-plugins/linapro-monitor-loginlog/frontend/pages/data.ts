import type { TagColor } from "@douyinfe/semi-ui/lib/es/tag/interface";

import type { DictOption } from "./loginlog-client";

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

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
