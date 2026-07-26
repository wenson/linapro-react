import type { Model, ProviderProtocol, Tier } from "./ai-client";

export type Translate = (key: string, options?: Record<string, unknown>) => string;

export const tierCapabilityTypeKeys = [
  "text",
  "image",
  "vision",
  "audio",
  "video",
  "embedding",
  "document",
  "safety",
] as const;

export const protocolOptions: Array<{ label: string; value: ProviderProtocol }> = [
  { label: "OpenAI", value: "openai" },
  { label: "OpenAI Compatible", value: "openai-compatible" },
  { label: "Anthropic", value: "anthropic" },
  { label: "Anthropic Compatible", value: "anthropic-compatible" },
  { label: "Voyage", value: "voyage" },
];

export function protocolLabel(value: string): string {
  const normalized = String(value || "").trim().toLowerCase();
  return protocolOptions.find((item) => item.value === normalized)?.label || value || "-";
}

export function joinCapabilityMethod(type: string, method: string): string {
  return [type, method].filter(Boolean).join(".");
}

export function splitCapabilityMethod(value: string): { capabilityMethod?: string; capabilityType?: string } {
  const [capabilityType, ...method] = String(value || "").split(".");
  return {
    capabilityMethod: method.join(".") || undefined,
    capabilityType: capabilityType || undefined,
  };
}

export function defaultTierCapabilityMethod(type: string): string {
  const methods: Record<string, string> = {
    audio: "synthesize",
    document: "analyze",
    embedding: "create",
    image: "generate",
    safety: "moderate",
    text: "generate",
    video: "generate",
    vision: "analyze",
  };
  return methods[type] || "generate";
}

export function capabilityTypeLabel(t: Translate, type: string): string {
  return t(`plugin.linapro-ai-core.capability.types.${type}`);
}

export function tierCodeLabel(t: Translate, code: string): string {
  return t(`plugin.linapro-ai-core.tier.names.${code}`);
}

export function tierDescription(t: Translate, tier: Tier): string {
  const keys = [
    `plugin.linapro-ai-core.tier.descriptions.${tier.capabilityType}.${tier.capabilityMethod}.${tier.code}`,
    `plugin.linapro-ai-core.tier.descriptions.${tier.capabilityType}.${tier.code}`,
    `plugin.linapro-ai-core.tier.descriptions.${tier.code}`,
  ];
  for (const key of keys) {
    const translated = t(key);
    if (translated && translated !== key) return translated;
  }
  return tier.description || "-";
}

export function tierTestStatusLabel(t: Translate, status: string): string {
  if (status === "success") return t("plugin.linapro-ai-core.common.success");
  if (status === "failed") return t("plugin.linapro-ai-core.common.failed");
  return status || "-";
}

export function effortLabel(t: Translate, effort: string): string {
  const key = `plugin.linapro-ai-core.effort.${effort || "empty"}`;
  const translated = t(key);
  return translated === key ? effort || "-" : translated;
}

export function tierDisplayName(t: Translate, tier?: Tier): string {
  return tier ? tierCodeLabel(t, tier.code) : "-";
}

export function formatLatencyMs(value: number | undefined): string {
  return `${Math.max(0, Math.round(Number(value || 0)))}ms`;
}

export function formatTimestamp(value: number | undefined, locale: string): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value));
}

export function modelProtocolGroups(items: Model[]) {
  const groups = new Map<string, Array<{ label: string; value: number }>>();
  for (const item of items) {
    const key = item.protocol.includes("anthropic") ? "anthropic" : item.protocol.includes("voyage") ? "voyage" : "openai";
    const group = groups.get(key) ?? [];
    group.push({ label: item.modelName, value: item.id });
    groups.set(key, group);
  }
  return ["openai", "anthropic", "voyage"]
    .filter((key) => groups.has(key))
    .map((key) => ({ label: protocolLabel(key), options: groups.get(key) ?? [] }));
}

export function hasPermission(permissions: ReadonlySet<string>, permission: string): boolean {
  return permissions.has("*") || permissions.has(permission);
}

export function compactFilters<T extends object>(values: T): Partial<T> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== "")) as Partial<T>;
}
