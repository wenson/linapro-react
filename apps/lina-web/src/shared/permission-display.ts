import type { TFunction } from "i18next";

const dynamicRoutePermissionSourcePrefix = "Dynamic Route Permission:";
const permissionDisplayI18nKeyPrefix = "pages.iam.permissionDisplay";

function isEnglishLocale(locale: string) {
  return locale.startsWith("en");
}

function toTitleCase(rawValue: string) {
  return rawValue
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.slice(0, 1).toUpperCase() + token.slice(1))
    .join(" ");
}

function translateWithFallback(
  t: TFunction,
  key: string,
  fallback: string,
  values: Record<string, string> = {},
) {
  return t(key, { ...values, defaultValue: fallback });
}

function humanizePermissionSegment(
  rawValue: string,
  t: TFunction,
  locale: string,
) {
  const normalized = rawValue.trim();
  if (!normalized) return "";

  const tokens = normalized.split(/[-_/]+/).filter(Boolean);
  const transformed = tokens.map((token) => {
    const fallback = isEnglishLocale(locale) ? toTitleCase(token) : token;
    return translateWithFallback(
      t,
      `${permissionDisplayI18nKeyPrefix}.segments.${token.toLowerCase()}`,
      fallback,
    );
  });

  return transformed.join(isEnglishLocale(locale) ? " " : "");
}

function extractDynamicRoutePermission(rawValue: string) {
  const normalized = rawValue.trim();
  if (!normalized) return "";

  if (normalized.startsWith(dynamicRoutePermissionSourcePrefix)) {
    return normalized.slice(dynamicRoutePermissionSourcePrefix.length).trim();
  }

  const parts = normalized.split(":");
  if (
    parts.length === 3 &&
    parts.every((part) => part.trim() !== "") &&
    /^plugin[-_]/.test(parts[0]!.trim())
  ) {
    return normalized;
  }

  return "";
}

function permissionSegments(
  rawValue: null | string | undefined,
  t: TFunction,
  locale: string,
): null | {
  dynamic: false;
  normalized: string;
} | {
  action: string;
  dynamic: true;
  normalized: string;
  resource: string;
} {
  const normalized = String(rawValue || "").trim();
  if (!normalized) return null;

  const permission = extractDynamicRoutePermission(normalized);
  if (!permission) return { dynamic: false, normalized };

  const parts = permission.split(":");
  if (parts.length !== 3) return { dynamic: false, normalized };

  return {
    action: humanizePermissionSegment(parts[2] ?? "", t, locale),
    dynamic: true,
    normalized,
    resource: humanizePermissionSegment(parts[1] ?? "", t, locale),
  };
}

export function formatMenuPermissionLabel(
  rawValue: null | string | undefined,
  t: TFunction,
  locale: string,
) {
  const segments = permissionSegments(rawValue, t, locale);
  if (!segments) return "";
  if (!segments.dynamic) return segments.normalized;

  return translateWithFallback(
    t,
    `${permissionDisplayI18nKeyPrefix}.dynamicRoutePermissionLabel`,
    segments.normalized,
    { action: segments.action, resource: segments.resource },
  );
}

export function formatMenuPermissionShortLabel(
  rawValue: null | string | undefined,
  t: TFunction,
  locale: string,
) {
  const segments = permissionSegments(rawValue, t, locale);
  if (!segments) return "";
  if (!segments.dynamic) return segments.normalized;

  return [segments.resource, segments.action]
    .filter(Boolean)
    .join(isEnglishLocale(locale) ? " " : "");
}
