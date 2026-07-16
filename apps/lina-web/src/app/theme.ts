export type ThemeMode = "dark" | "light";
export type ConfiguredThemeMode = "auto" | ThemeMode;

export const themePreferenceStorageKey = "linapro:web:preferences-theme";

function isConfiguredThemeMode(value: unknown): value is ConfiguredThemeMode {
  return value === "auto" || value === "dark" || value === "light";
}

export function readThemePreference(storage: null | Storage): ConfiguredThemeMode | undefined {
  try {
    const parsed = JSON.parse(storage?.getItem(themePreferenceStorageKey) || "{}") as {
      value?: unknown;
    };
    return isConfiguredThemeMode(parsed.value) ? parsed.value : undefined;
  } catch {
    return undefined;
  }
}

export function resolvePreferredTheme(media = window.matchMedia?.("(prefers-color-scheme: dark)")): ThemeMode {
  return media?.matches ? "dark" : "light";
}

export function applyTheme(mode: ThemeMode, target = document.body): void {
  target.setAttribute("theme-mode", mode);
  document.documentElement.classList.toggle("dark", mode === "dark");
}

export function resolveConfiguredTheme(
  mode: ConfiguredThemeMode,
  media = window.matchMedia?.("(prefers-color-scheme: dark)"),
): ThemeMode {
  return mode === "auto" ? resolvePreferredTheme(media) : mode;
}

export function resolveEffectiveTheme(
  configuredMode: ConfiguredThemeMode,
  storage: null | Storage,
  media = window.matchMedia?.("(prefers-color-scheme: dark)"),
): ThemeMode {
  return resolveConfiguredTheme(readThemePreference(storage) ?? configuredMode, media);
}

export function applyThemePreference(
  mode: ConfiguredThemeMode,
  storage: null | Storage = typeof window === "undefined" ? null : window.localStorage,
): void {
  storage?.setItem(themePreferenceStorageKey, JSON.stringify({ value: mode }));
  applyTheme(resolveConfiguredTheme(mode));
}
