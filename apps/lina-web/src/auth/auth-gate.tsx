import Button from "@douyinfe/semi-ui/lib/es/button";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "zustand";

import type { AuthenticatedContext } from "#/auth/auth-context";
import { AuthRefreshContext } from "#/auth/auth-context";
import { AuthContextProvider } from "#/auth/auth-context-provider";
import { AuthRuntime } from "#/auth/auth-runtime";
import { LoginPage } from "#/auth/login-page";
import { resolveExternalLoginErrorMessage } from "#/auth/external-login-error";
import type { ApiClient } from "#/api/client";
import { createPluginHostApi, createReadonlyPermissionSet } from "#/plugin-ui/plugin-host-context";
import { LinaPluginHostProvider } from "#/plugin-ui/plugin-host-provider";
import { createPluginUIRegistry } from "#/plugin-ui/registry";
import { PluginSlotOutlet } from "#/plugin-ui/slot-outlet";
import type { AuthPanelLayout } from "#/runtime/public-config";
import { sourcePluginUI } from "virtual:linapro-plugin-ui";
import type { PluginRuntimeState } from "#/api/plugins";

interface AuthGateProps extends PropsWithChildren {
  apiClient?: ApiClient;
  appName: string;
  forgetPasswordEnabled?: boolean;
  logoUrl: string;
  loginOnly?: boolean;
  loginSubtitle?: string;
  pageDescription?: string;
  pageTitle?: string;
  panelLayout?: AuthPanelLayout;
  registerEnabled?: boolean;
  runtime: AuthRuntime;
}

function safeRedirect(value: null | string, fallback = "/"): string {
  if (!value) {
    return fallback;
  }
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function AuthGate({
  apiClient,
  appName,
  children,
  forgetPasswordEnabled,
  loginOnly = false,
  loginSubtitle,
  logoUrl,
  pageDescription,
  pageTitle,
  panelLayout,
  registerEnabled,
  runtime,
}: AuthGateProps) {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionStore = runtime.getSessionStore();
  const tenantStore = runtime.getTenantStore();
  const status = useStore(sessionStore, (state) => state.status);
  const accessToken = useStore(sessionStore, (state) => state.accessToken);
  const sessionRevision = useStore(sessionStore, (state) => state.revision);
  const tenantCode = useStore(tenantStore, (state) => state.currentTenant?.code ?? "");
  const identity = `${sessionRevision}:${tenantCode}`;
  const shouldRestore = useRef(status === "authenticating" && !!accessToken);
  const [loaded, setLoaded] = useState<{
    context: AuthenticatedContext;
    identity: string;
  } | null>(null);
  const [loadError, setLoadError] = useState<{ identity: string; message: string } | null>(null);
  const [externalError, setExternalError] = useState("");
  const [externalRedirect, setExternalRedirect] = useState("");
  const [anonymousPluginStates, setAnonymousPluginStates] = useState<readonly PluginRuntimeState[]>([]);
  const consumedExternalLogin = useRef<string | null>(null);
  const anonymousPluginRegistry = useMemo(
    () => createPluginUIRegistry(sourcePluginUI, anonymousPluginStates, new Set()),
    [anonymousPluginStates],
  );
  const anonymousPluginHost = useMemo(() => apiClient ? ({
    api: createPluginHostApi(apiClient),
    locale: i18n.resolvedLanguage === "zh-CN" ? "zh-CN" as const : "en-US" as const,
    permissions: createReadonlyPermissionSet([]),
    t: (key: string, options?: Record<string, unknown>) => t(key, options),
    tenant: null,
    user: { id: 0, name: "" },
  }) : null, [apiClient, i18n.resolvedLanguage, t]);

  useEffect(() => {
    if (!apiClient || sourcePluginUI.length === 0) {
      return;
    }
    let active = true;
    void runtime.getAnonymousPluginRuntimeStates().then(
      (states) => { if (active) setAnonymousPluginStates(states); },
      () => { if (active) setAnonymousPluginStates([]); },
    );
    return () => { active = false; };
  }, [apiClient, runtime]);

  useEffect(() => {
    if (searchParams.get("externalLogin") !== "1") return;
    const handoff = searchParams.get("handoff")?.trim() || "";
    const status = searchParams.get("status") || "";
    const message = searchParams.get("message") || "";
    const redirect = safeRedirect(searchParams.get("redirect"), "");
    const fingerprint = `${status}:${handoff}:${message}:${redirect}`;
    if (consumedExternalLogin.current === fingerprint) return;
    consumedExternalLogin.current = fingerprint;
    void (async () => {
      await navigate("/auth/login", { replace: true });
      if (status === "error") {
        setExternalError(resolveExternalLoginErrorMessage(message, {
          configMissing: t("auth.external.configMissing"),
          discoveryFailed: t("auth.external.discoveryFailed"),
          externalLoginFailed: t("auth.external.failed"),
          fallbackLoginFailed: t("auth.errors.loginFailed"),
          translate: (key) => i18n.t(key),
        }));
        return;
      }
      if (!handoff) { setExternalError(t("auth.external.handoffInvalid")); return; }
      try {
        setExternalError("");
        setExternalRedirect(redirect);
        await runtime.completeExternalLoginFromHandoff(handoff);
      } catch {
        setExternalError(t("auth.external.handoffInvalid"));
      }
    })();
  }, [i18n, navigate, runtime, searchParams, t]);

  useEffect(() => {
    if (!shouldRestore.current) {
      return;
    }
    shouldRestore.current = false;
    const restoreIdentity = identity;
    void runtime.restoreSession().then((restored) => {
      if (restored) {
        setLoaded({ context: restored, identity: restoreIdentity });
      }
    });
  }, [identity, runtime]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    let active = true;
    void runtime
      .loadAuthenticatedContext()
      .then((loaded) => {
        if (active) {
          setLoaded({ context: loaded, identity });
        }
      })
      .catch((reason) => {
        if (active) {
          setLoadError({
            identity,
            message: reason instanceof Error ? reason.message : t("auth.errors.contextFailed"),
          });
        }
      });
    return () => {
      active = false;
    };
  }, [identity, runtime, status, t]);

  const context = loaded?.identity === identity ? loaded.context : null;
  const error = loadError?.identity === identity ? loadError.message : "";

  const activeLoginFlow =
    status === "anonymous" ||
    status === "selecting-tenant" ||
    (status === "authenticating" && !accessToken);
  if (activeLoginFlow) {
    if (!loginOnly) {
      const redirect = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
      return <Navigate replace to={`/auth/login?redirect=${redirect}`} />;
    }
    const externalLoginAfter = anonymousPluginHost && anonymousPluginRegistry.slots["auth.login.after"].length ? (
      <LinaPluginHostProvider value={anonymousPluginHost}>
        <PluginSlotOutlet items={anonymousPluginRegistry.slots["auth.login.after"]} />
      </LinaPluginHostProvider>
    ) : null;
    const externalLoginSocial = anonymousPluginHost && anonymousPluginRegistry.slots["auth.login.social"].length ? (
      <LinaPluginHostProvider value={anonymousPluginHost}>
        <PluginSlotOutlet items={anonymousPluginRegistry.slots["auth.login.social"]} />
      </LinaPluginHostProvider>
    ) : null;
    return (
      <LoginPage
        appName={appName}
        externalLoginAfter={externalLoginAfter}
        externalLoginError={externalError}
        externalLoginSocial={externalLoginSocial}
        forgetPasswordEnabled={forgetPasswordEnabled}
        logoUrl={logoUrl}
        loginSubtitle={loginSubtitle}
        pageDescription={pageDescription}
        pageTitle={pageTitle}
        panelLayout={panelLayout}
        registerEnabled={registerEnabled}
        runtime={runtime}
      />
    );
  }

  if (status !== "authenticated" || !context) {
    if (error) {
      return (
        <main className="auth-gate-status" role="alert">
          <Typography.Title heading={3}>{t("auth.errors.contextTitle")}</Typography.Title>
          <Typography.Paragraph type="danger">{error}</Typography.Paragraph>
          <Button onClick={() => window.location.reload()}>{t("auth.errors.reload")}</Button>
        </main>
      );
    }
    return (
      <main className="auth-gate-status" aria-live="polite" role="status">
        <Spin size="large" />
        <Typography.Text>{t("auth.loading")}</Typography.Text>
      </main>
    );
  }

  if (loginOnly) {
    return <Navigate replace to={safeRedirect(externalRedirect || searchParams.get("redirect"), "/")} />;
  }

  async function refreshContext() {
    const refreshed = await runtime.loadAuthenticatedContext(true);
    setLoaded({ context: refreshed, identity });
    return refreshed;
  }

  return <AuthRefreshContext.Provider value={refreshContext}><AuthContextProvider value={context}>{children}</AuthContextProvider></AuthRefreshContext.Provider>;
}
