function hasPathEscape(value: string): boolean {
  try {
    const path = decodeURIComponent(value.split(/[?#]/, 1)[0] ?? "").replaceAll("\\", "/");
    return path.split("/").some((segment) => segment === "." || segment === "..");
  } catch {
    return true;
  }
}

export function safeNavigationTarget(value: string): string | null {
  const input = value.trim();
  if (!input || input.startsWith("//") || hasPathEscape(input)) {
    return null;
  }
  try {
    const url = new URL(input, window.location.origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return input.startsWith("/") ? `${url.pathname}${url.search}${url.hash}` : url.href;
  } catch {
    return null;
  }
}
