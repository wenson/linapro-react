import type { DictOption } from "./notice-client";

export function dictLabel(options: readonly DictOption[], value: number | string): string {
  return options.find((item) => item.value === String(value))?.label || String(value);
}

type DictTagColor = "blue" | "cyan" | "green" | "grey" | "orange" | "purple" | "red";

export function dictColor(options: readonly DictOption[], value: number | string): DictTagColor {
  const style = options.find((item) => item.value === String(value))?.tagStyle?.toLowerCase() || "grey";
  if (["blue", "cyan", "green", "grey", "orange", "purple", "red"].includes(style)) return style as DictTagColor;
  return "grey";
}

export function formatTimestamp(value: number | null, locale: string): string {
  return value ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value)) : "-";
}

const allowedTags = new Set(["A", "BLOCKQUOTE", "BR", "CODE", "EM", "H1", "H2", "H3", "IMG", "LI", "OL", "P", "PRE", "S", "STRONG", "U", "UL"]);
const allowedAttributes: Record<string, ReadonlySet<string>> = {
  A: new Set(["href", "rel", "target"]),
  IMG: new Set(["alt", "height", "src", "width"]),
};

function safeUrl(value: string, image: boolean): boolean {
  const input = value.trim();
  if (!input) return false;
  if (image && /^data:image\/(?:gif|jpeg|png|webp);base64,/i.test(input)) return true;
  if (input.startsWith("/") && !input.startsWith("//")) return true;
  try { const url = new URL(input, window.location.origin); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; }
}

export function sanitizeNoticeHtml(source: string): string {
  if (typeof DOMParser === "undefined") return "";
  const document = new DOMParser().parseFromString(source || "", "text/html");
  for (const node of [...document.body.querySelectorAll("*")]) {
    if (!allowedTags.has(node.tagName)) { node.replaceWith(...node.childNodes); continue; }
    const attributes = allowedAttributes[node.tagName] ?? new Set<string>();
    for (const attribute of [...node.attributes]) if (!attributes.has(attribute.name.toLowerCase())) node.removeAttribute(attribute.name);
    if (node instanceof HTMLAnchorElement) {
      if (!safeUrl(node.getAttribute("href") || "", false)) node.removeAttribute("href");
      node.setAttribute("rel", "noopener noreferrer"); node.setAttribute("target", "_blank");
    }
    if (node instanceof HTMLImageElement && !safeUrl(node.getAttribute("src") || "", true)) node.removeAttribute("src");
  }
  return document.body.innerHTML;
}
