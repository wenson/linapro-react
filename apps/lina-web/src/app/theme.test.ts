import {
  applyTheme,
  applyThemePreference,
  readThemePreference,
  resolveEffectiveTheme,
  resolvePreferredTheme,
  themePreferenceStorageKey,
} from "#/app/theme";

describe("theme", () => {
  afterEach(() => {
    localStorage.removeItem(themePreferenceStorageKey);
    document.body.removeAttribute("theme-mode");
    document.documentElement.classList.remove("dark");
  });

  it("maps a dark system preference to the Semi theme attribute", () => {
    expect(resolvePreferredTheme({ matches: true } as MediaQueryList)).toBe("dark");

    applyTheme("dark");

    expect(document.body).toHaveAttribute("theme-mode", "dark");
  });

  it("uses light mode when no dark preference exists", () => {
    expect(resolvePreferredTheme({ matches: false } as MediaQueryList)).toBe("light");
  });

  it("uses a persisted user preference before the public configured default", () => {
    localStorage.setItem(themePreferenceStorageKey, JSON.stringify({ value: "dark" }));

    expect(
      resolveEffectiveTheme("light", localStorage, { matches: false } as MediaQueryList),
    ).toBe("dark");

  });

  it("persists React theme preferences using the workbench-owned storage key", () => {
    applyThemePreference("dark", localStorage);

    expect(readThemePreference(localStorage)).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");

  });

  it("ignores malformed or unsupported theme preferences", () => {
    localStorage.setItem(themePreferenceStorageKey, "not-json");
    expect(readThemePreference(localStorage)).toBeUndefined();

    localStorage.setItem(themePreferenceStorageKey, JSON.stringify({ value: "sepia" }));
    expect(readThemePreference(localStorage)).toBeUndefined();

  });
});
