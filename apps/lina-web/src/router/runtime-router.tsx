import { createBrowserRouter, Navigate } from "react-router-dom";

import { AuthGate } from "#/auth/auth-gate";
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
    appName: config.app.name,
    loginSubtitle: config.auth.loginSubtitle,
    logoUrl,
    pageDescription: config.auth.pageDesc,
    pageTitle: config.auth.pageTitle,
    panelLayout: config.auth.panelLayout,
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
