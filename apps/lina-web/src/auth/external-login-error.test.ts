import { describe, expect, it } from "vitest";

import {
  businessErrorMessageKey,
  resolveExternalLoginErrorMessage,
} from "#/auth/external-login-error";

const options = {
  configMissing: "config missing",
  discoveryFailed: "discovery failed",
  externalLoginFailed: "external login failed",
  fallbackLoginFailed: "login failed",
  translate: (key: string) => key === "error.plugin.oidc.generic.identity.verify.failed" ? "identity failed" : key,
};

describe("external login redirect errors", () => {
  it("derives the runtime message key and never exposes unknown machine codes", () => {
    expect(businessErrorMessageKey("PLUGIN_OIDC_GENERIC_DISCOVERY_FAILED")).toBe(
      "error.plugin.oidc.generic.discovery.failed",
    );
    expect(resolveExternalLoginErrorMessage("PLUGIN_UNKNOWN_FAILED", options)).toBe(
      "external login failed",
    );
  });

  it("uses targeted host text and loaded plugin translations", () => {
    expect(resolveExternalLoginErrorMessage("PLUGIN_OIDC_GENERIC_CONFIG_MISSING", options)).toBe("config missing");
    expect(resolveExternalLoginErrorMessage("PLUGIN_OIDC_GENERIC_DISCOVERY_FAILED", options)).toBe("discovery failed");
    expect(resolveExternalLoginErrorMessage("PLUGIN_OIDC_GENERIC_IDENTITY_VERIFY_FAILED", options)).toBe("identity failed");
  });
});
