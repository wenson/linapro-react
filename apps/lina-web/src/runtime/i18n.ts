import enUS from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import zhCN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/zh-cn";
import { createInstance } from "i18next";
import type { i18n as I18nInstance } from "i18next";

import type { ApiClient } from "#/api/client";
import enUSMessages from "#/locales/en-US/app.json";
import zhCNMessages from "#/locales/zh-CN/app.json";

export const supportedLocales = ["en-US", "zh-CN"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const runtimeMessagesCacheTtl = 7 * 24 * 60 * 60 * 1000;
export const runtimeMessagesMaxAttempts = 2;
const runtimeCachePrefix = "linapro:i18n:runtime:";
export const localePreferenceStorageKey = "linapro:web:preferences-locale";

export interface RuntimeLocaleOption {
  isDefault: boolean;
  label: string;
  locale: SupportedLocale;
  nativeName: string;
}

export interface RuntimeLocaleState {
  enabled: boolean;
  locale: SupportedLocale;
  options: RuntimeLocaleOption[];
  switcherVisible: boolean;
}

interface RuntimeLocalePayload {
  enabled?: boolean;
  items?: Array<{
    isDefault?: boolean;
    locale?: string;
    name?: string;
    nativeName?: string;
  }>;
  locale?: string;
}

interface RuntimeMessageCacheEntry {
  etag: string;
  messages: Record<string, unknown>;
  savedAt: number;
}

export interface RuntimeMessageLoadOptions {
  force?: boolean;
  onMessagesChanged?: (messages: Record<string, unknown>) => void;
}

export interface RuntimeI18nOptions {
  client: ApiClient;
  i18n?: I18nInstance;
  now?: () => number;
  storage?: null | Storage;
}

export interface LanguageChangeEffects {
  refreshBreadcrumbs?: (locale: SupportedLocale) => Promise<void> | void;
  refreshMenu?: (locale: SupportedLocale) => Promise<void> | void;
  refreshPluginMessages?: (locale: SupportedLocale) => Promise<void> | void;
  refreshPublicConfig?: (locale: SupportedLocale) => Promise<void> | void;
  refreshTabs?: (locale: SupportedLocale) => Promise<void> | void;
  updateApiDocsLanguage?: (locale: SupportedLocale) => Promise<void> | void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSupportedLocale(value: unknown): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale);
}

export function readLocalePreference(storage: null | Storage): SupportedLocale | undefined {
  try {
    const parsed = JSON.parse(storage?.getItem(localePreferenceStorageKey) || "{}") as {
      value?: unknown;
    };
    return isSupportedLocale(parsed.value) ? parsed.value : undefined;
  } catch {
    return undefined;
  }
}

export function mergeMessages(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const output = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (isRecord(value) && isRecord(output[key])) {
      output[key] = mergeMessages(output[key], value);
    } else {
      output[key] = value;
    }
  }
  return output;
}

function baseMessages(locale: SupportedLocale): Record<string, unknown> {
  return locale === "zh-CN" ? zhCNMessages : enUSMessages;
}

export function semiLocaleFor(locale: SupportedLocale) {
  return locale === "zh-CN" ? zhCN : enUS;
}

function runtimeCacheKey(locale: SupportedLocale): string {
  return `${runtimeCachePrefix}${locale}`;
}

function normalizeLocalePayload(payload: unknown): RuntimeLocaleState {
  const root = isRecord(payload) ? (payload as RuntimeLocalePayload) : {};
  const options = (Array.isArray(root.items) ? root.items : [])
    .flatMap((item): RuntimeLocaleOption[] => {
      if (!isSupportedLocale(item.locale)) {
        return [];
      }
      return [
        {
          isDefault: item.isDefault === true,
          label: item.name?.trim() || item.nativeName?.trim() || item.locale,
          locale: item.locale,
          nativeName: item.nativeName?.trim() || item.locale,
        },
      ];
    });
  const availableOptions = options.length
    ? options
    : supportedLocales.map((locale) => ({
        isDefault: locale === "en-US",
        label: locale,
        locale,
        nativeName: locale,
      }));
  const defaultLocale =
    availableOptions.find((item) => item.isDefault)?.locale ?? availableOptions[0]?.locale ?? "en-US";
  const locale = isSupportedLocale(root.locale) ? root.locale : defaultLocale;
  const enabled = root.enabled !== false;
  return {
    enabled,
    locale,
    options: availableOptions,
    switcherVisible: enabled && availableOptions.length > 1,
  };
}

function normalizeMessagesPayload(payload: unknown): Record<string, unknown> {
  if (!isRecord(payload)) {
    return {};
  }
  const envelopeData = isRecord(payload.data) ? payload.data : payload;
  return isRecord(envelopeData.messages) ? envelopeData.messages : {};
}

export const runtimeI18n = createInstance();

export class RuntimeI18nService {
  readonly i18n: I18nInstance;
  private readonly client: ApiClient;
  private readonly now: () => number;
  private readonly storage: null | Storage;
  private localeState: RuntimeLocaleState = {
    enabled: true,
    locale: "en-US",
    options: supportedLocales.map((locale) => ({
      isDefault: locale === "en-US",
      label: locale,
      locale,
      nativeName: locale,
    })),
    switcherVisible: true,
  };

  constructor(options: RuntimeI18nOptions) {
    this.client = options.client;
    this.i18n = options.i18n ?? runtimeI18n;
    this.now = options.now ?? Date.now;
    this.storage = options.storage === undefined ? window.localStorage : options.storage;
  }

  getLocaleState(): RuntimeLocaleState {
    return this.localeState;
  }

  async initialize(requestedLocale?: string): Promise<RuntimeLocaleState> {
    this.localeState = await this.loadLocaleState(requestedLocale);
    const locale = this.localeState.locale;
    let initialized = false;
    let refreshedMessages: null | Record<string, unknown> = null;
    const runtimeMessages = await this.loadRuntimeMessages(locale, {
      onMessagesChanged: (messages) => {
        if (initialized && this.localeState.locale === locale) {
          void this.applyLocale(locale, messages);
        } else {
          refreshedMessages = messages;
        }
      },
    });
    await this.applyLocale(locale, runtimeMessages);
    initialized = true;
    if (refreshedMessages) {
      await this.applyLocale(locale, refreshedMessages);
    }
    this.persistLocale(locale);
    return this.localeState;
  }

  async changeLanguage(locale: SupportedLocale, effects: LanguageChangeEffects = {}): Promise<void> {
    const allowed = this.localeState.options.some((option) => option.locale === locale);
    if (!allowed || (!this.localeState.enabled && locale !== this.localeState.locale)) {
      throw new RangeError(`Unsupported runtime locale: ${locale}`);
    }

    const runtimeMessages = await this.loadRuntimeMessages(locale, { force: true });
    await this.applyLocale(locale, runtimeMessages);
    this.localeState = { ...this.localeState, locale };
    this.persistLocale(locale);
    await effects.refreshPublicConfig?.(locale);
    await effects.refreshMenu?.(locale);
    await effects.refreshBreadcrumbs?.(locale);
    await effects.refreshTabs?.(locale);
    await effects.refreshPluginMessages?.(locale);
    await effects.updateApiDocsLanguage?.(locale);
  }

  async refreshCurrentMessages(): Promise<void> {
    const locale = this.localeState.locale;
    const runtimeMessages = await this.loadRuntimeMessages(locale, { force: true });
    await this.applyLocale(locale, runtimeMessages);
  }

  async loadRuntimeMessages(
    locale: SupportedLocale,
    options: RuntimeMessageLoadOptions = {},
  ): Promise<Record<string, unknown>> {
    const cached = this.readCache(locale);
    const fresh = !!cached && this.now() - cached.savedAt <= runtimeMessagesCacheTtl;
    if (fresh && !options.force && cached) {
      void this.requestMessages(locale, cached).then((messages) => {
        if (messages !== cached.messages) {
          options.onMessagesChanged?.(messages);
        }
      });
      return cached.messages;
    }
    return await this.requestMessages(locale, cached);
  }

  private async loadLocaleState(requestedLocale?: string): Promise<RuntimeLocaleState> {
    try {
      const payload = await this.client.get<unknown>("i18n/runtime/locales", {
        query: { lang: requestedLocale },
      });
      const normalized = normalizeLocalePayload(payload);
      const requested = isSupportedLocale(requestedLocale) ? requestedLocale : undefined;
      if (normalized.enabled && requested && normalized.options.some((item) => item.locale === requested)) {
        return { ...normalized, locale: requested };
      }
      return normalized;
    } catch {
      const locale = isSupportedLocale(requestedLocale) ? requestedLocale : "en-US";
      return {
        enabled: true,
        locale,
        options: this.localeState.options,
        switcherVisible: true,
      };
    }
  }

  private async requestMessages(
    locale: SupportedLocale,
    cached: null | RuntimeMessageCacheEntry,
  ): Promise<Record<string, unknown>> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= runtimeMessagesMaxAttempts; attempt += 1) {
      try {
        const response = await this.client.requestRaw("i18n/runtime/messages", {
          headers: {
            "Accept-Language": locale,
            ...(cached?.etag ? { "If-None-Match": cached.etag } : {}),
          },
          method: "GET",
          query: { lang: locale },
        });
        if (response.status === 304) {
          if (!cached) {
            return {};
          }
          const revalidated = { ...cached, savedAt: this.now() };
          this.writeCache(locale, revalidated);
          return revalidated.messages;
        }
        if (!response.ok) {
          throw new Error(`Runtime messages request failed with HTTP ${response.status}`);
        }
        const payload = await response.json();
        if (isRecord(payload) && typeof payload.code === "number" && payload.code !== 0) {
          throw new Error("Runtime messages response reported a business error");
        }
        const messages = normalizeMessagesPayload(payload);
        this.writeCache(locale, {
          etag: response.headers.get("etag") || "",
          messages,
          savedAt: this.now(),
        });
        return messages;
      } catch (error) {
        lastError = error;
      }
    }
    if (cached) {
      return cached.messages;
    }
    void lastError;
    return {};
  }

  private async applyLocale(
    locale: SupportedLocale,
    runtimeMessages: Record<string, unknown>,
  ): Promise<void> {
    const messages = mergeMessages(baseMessages(locale), runtimeMessages);
    if (!this.i18n.isInitialized) {
      const resources = {
        "en-US": { translation: baseMessages("en-US") },
        "zh-CN": { translation: baseMessages("zh-CN") },
      };
      resources[locale] = { translation: messages };
      await this.i18n.init({
        fallbackLng: "en-US",
        interpolation: { escapeValue: false },
        lng: locale,
        nsSeparator: false,
        resources,
      });
    } else {
      this.i18n.addResourceBundle(locale, "translation", messages, true, true);
      await this.i18n.changeLanguage(locale);
    }
    document.documentElement.lang = locale;
    dayjs.locale(locale === "zh-CN" ? "zh-cn" : "en");
  }

  private readCache(locale: SupportedLocale): null | RuntimeMessageCacheEntry {
    try {
      const raw = this.storage?.getItem(runtimeCacheKey(locale));
      if (!raw) {
        return null;
      }
      const entry = JSON.parse(raw) as Partial<RuntimeMessageCacheEntry>;
      if (typeof entry.etag !== "string" || typeof entry.savedAt !== "number" || !isRecord(entry.messages)) {
        return null;
      }
      return {
        etag: entry.etag,
        messages: entry.messages,
        savedAt: entry.savedAt,
      };
    } catch {
      return null;
    }
  }

  private writeCache(locale: SupportedLocale, entry: RuntimeMessageCacheEntry): void {
    try {
      this.storage?.setItem(runtimeCacheKey(locale), JSON.stringify(entry));
    } catch {
      // Storage quota and privacy-mode failures must not block startup.
    }
  }

  private persistLocale(locale: SupportedLocale): void {
    try {
      this.storage?.setItem(localePreferenceStorageKey, JSON.stringify({ value: locale }));
    } catch {
      // Locale persistence is best-effort; the active in-memory locale remains authoritative.
    }
  }
}
