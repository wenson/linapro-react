import Button from "@douyinfe/semi-ui/lib/es/button";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useEffect, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useStore } from "zustand";

import type { AuthenticatedContext } from "#/auth/auth-context";
import { AuthRefreshContext } from "#/auth/auth-context";
import { AuthContextProvider } from "#/auth/auth-context-provider";
import { AuthRuntime } from "#/auth/auth-runtime";
import { LoginPage } from "#/auth/login-page";
import type { AuthPanelLayout } from "#/runtime/public-config";

interface AuthGateProps extends PropsWithChildren {
  appName: string;
  logoUrl: string;
  loginOnly?: boolean;
  loginSubtitle?: string;
  pageDescription?: string;
  pageTitle?: string;
  panelLayout?: AuthPanelLayout;
  runtime: AuthRuntime;
}

function safeRedirect(value: null | string, fallback = "/"): string {
  if (!value) {
    return fallback;
  }
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function AuthGate({
  appName,
  children,
  loginOnly = false,
  loginSubtitle,
  logoUrl,
  pageDescription,
  pageTitle,
  panelLayout,
  runtime,
}: AuthGateProps) {
  const { t } = useTranslation();
  const location = useLocation();
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
    return (
      <LoginPage
        appName={appName}
        logoUrl={logoUrl}
        loginSubtitle={loginSubtitle}
        pageDescription={pageDescription}
        pageTitle={pageTitle}
        panelLayout={panelLayout}
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
    return <Navigate replace to={safeRedirect(searchParams.get("redirect"), context.user.homePath || "/")} />;
  }

  async function refreshContext() {
    const refreshed = await runtime.loadAuthenticatedContext(true);
    setLoaded({ context: refreshed, identity });
    return refreshed;
  }

  return <AuthRefreshContext.Provider value={refreshContext}><AuthContextProvider value={context}>{children}</AuthContextProvider></AuthRefreshContext.Provider>;
}
