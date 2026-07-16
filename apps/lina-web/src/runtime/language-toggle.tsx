import Button from "@douyinfe/semi-ui/lib/es/button";
import Dropdown from "@douyinfe/semi-ui/lib/es/dropdown";
import { useTranslation } from "react-i18next";

import type { SupportedLocale } from "#/runtime/i18n";
import { localePreferenceStorageKey } from "#/runtime/i18n";
import { useRuntimeI18n } from "#/runtime/i18n-context";

const localeLabels: Record<SupportedLocale, string> = {
  "en-US": "English",
  "zh-CN": "简体中文",
};

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const runtime = useRuntimeI18n();
  const state = runtime?.getLocaleState();
  if (state && !state.switcherVisible) {
    return null;
  }

  const activeLocale: SupportedLocale =
    i18n.resolvedLanguage === "zh-CN" ? "zh-CN" : "en-US";

  async function change(locale: SupportedLocale) {
    if (runtime) {
      await runtime.changeLanguage(locale);
      return;
    }
    await i18n.changeLanguage(locale);
    try {
      window.localStorage.setItem(localePreferenceStorageKey, JSON.stringify({ value: locale }));
    } catch {
      // Locale persistence is best-effort in restricted browser contexts.
    }
  }

  return (
    <Dropdown
      render={(
        <Dropdown.Menu>
          {(Object.keys(localeLabels) as SupportedLocale[]).map((locale) => (
            <Dropdown.Item key={locale} onClick={() => void change(locale)}>
              {localeLabels[locale]}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      )}
      trigger="click"
    >
      <Button data-testid="language-toggle-trigger" theme="borderless">
        {activeLocale === "zh-CN" ? "中文" : "EN"}
      </Button>
    </Dropdown>
  );
}
