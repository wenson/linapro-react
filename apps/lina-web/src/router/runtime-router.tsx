import { createBrowserRouter, Navigate } from "react-router-dom";

import { AuthGate } from "#/auth/auth-gate";
import { RegisterPage, ForgetPasswordPage, ResetPasswordPage } from "#/auth/public-auth-pages";
import { createAuthApi } from "#/api/auth";
import type { AuthRuntime } from "#/auth/auth-runtime";
import type { ApiClient } from "#/api/client";
import { WorkbenchApp } from "#/layout/workbench-app";
import type { PublicFrontendConfig } from "#/runtime/public-config";
import { resolveWorkspaceAssetUrl } from "#/runtime/public-config";

export function createRuntimeRouter(
  config: PublicFrontendConfig,
  authRuntime: AuthRuntime,
  apiClient: ApiClient,
) {
  const logoUrl = resolveWorkspaceAssetUrl(config.app.logo, config.workspace.basePath);
  const gateProps = {
    apiClient,
    appName: config.app.name,
    forgetPasswordEnabled: config.auth.forgetPasswordEnabled,
    loginSubtitle: config.auth.loginSubtitle,
    logoUrl,
    pageDescription: config.auth.pageDesc,
    pageTitle: config.auth.pageTitle,
    panelLayout: config.auth.panelLayout,
    registerEnabled: config.auth.registerEnabled,
    runtime: authRuntime,
  };

  return createBrowserRouter(
    [
      {
        element: (
          <AuthGate {...gateProps} loginOnly />
        ),
        path: "/auth/login",
      },
      { element: <RegisterPage api={createAuthApi(apiClient) as Required<Pick<ReturnType<typeof createAuthApi>, "forgetPassword" | "register" | "resetPassword">>} appName={config.app.name} enabled={config.auth.registerEnabled} logoUrl={logoUrl} privacyPolicy={config.auth.privacyPolicy} termsOfService={config.auth.termsOfService} />, path: "/auth/register" },
      { element: <ForgetPasswordPage api={createAuthApi(apiClient) as Required<Pick<ReturnType<typeof createAuthApi>, "forgetPassword" | "register" | "resetPassword">>} appName={config.app.name} enabled={config.auth.forgetPasswordEnabled} logoUrl={logoUrl} />, path: "/auth/forget-password" },
      { element: <ResetPasswordPage api={createAuthApi(apiClient) as Required<Pick<ReturnType<typeof createAuthApi>, "forgetPassword" | "register" | "resetPassword">>} appName={config.app.name} enabled={config.auth.forgetPasswordEnabled} logoUrl={logoUrl} />, path: "/auth/reset-password" },
      {
        element: <Navigate replace to="/auth/login" />,
        path: "/auth/*",
      },
      {
        element: (
          <AuthGate {...gateProps}>
            <WorkbenchApp apiClient={apiClient} config={config} runtime={authRuntime} />
          </AuthGate>
        ),
        path: "*",
      },
    ],
    { basename: config.workspace.basePath },
  );
}
