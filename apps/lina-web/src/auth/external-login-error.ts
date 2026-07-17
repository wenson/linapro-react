export function businessErrorMessageKey(errorCode: string): string {
  const segments = errorCode
    .trim()
    .toLowerCase()
    .split(/[_\-.\s]+/)
    .filter(Boolean);
  return segments.length ? `error.${segments.join(".")}` : "";
}

const configMissingCodes = new Set([
  "PLUGIN_OIDC_DISCORD_CONFIG_MISSING",
  "PLUGIN_OIDC_GENERIC_CONFIG_MISSING",
  "PLUGIN_OIDC_GOOGLE_CONFIG_MISSING",
]);
const discoveryFailedCodes = new Set(["PLUGIN_OIDC_GENERIC_DISCOVERY_FAILED"]);

export interface ExternalLoginErrorOptions {
  configMissing: string;
  discoveryFailed: string;
  externalLoginFailed: string;
  fallbackLoginFailed: string;
  translate: (key: string) => string;
}

export function resolveExternalLoginErrorMessage(
  message: string,
  options: ExternalLoginErrorOptions,
): string {
  const normalized = message.trim();
  if (!normalized) return options.fallbackLoginFailed;
  if (configMissingCodes.has(normalized)) return options.configMissing;
  if (discoveryFailedCodes.has(normalized)) return options.discoveryFailed;

  const translated = options.translate(businessErrorMessageKey(normalized));
  if (translated && translated !== businessErrorMessageKey(normalized)) return translated;
  return /^[A-Z][A-Z0-9_]*$/.test(normalized) ? options.externalLoginFailed : normalized;
}
