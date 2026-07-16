import type { QueryClient } from "@tanstack/react-query";

import type { ApiClientSession } from "#/api/client";
import type { ApiTokenPair } from "#/api/client";
import type { LoginTenant } from "#/api/auth";
import type { SessionStore } from "#/auth/session-store";
import type { TenantStore } from "#/tenant/tenant-store";

export interface SessionAdapterOptions {
  onCleared?: () => Promise<void> | void;
  queryClient: QueryClient;
  sessionStore: SessionStore;
  tenantStore: TenantStore;
}

export interface ApiSessionAdapter extends ApiClientSession {
  clearContext(): void;
  commitContext(tokens: ApiTokenPair, tenant: LoginTenant | null): void;
}

export function createApiSessionAdapter({
  onCleared,
  queryClient,
  sessionStore,
  tenantStore,
}: SessionAdapterOptions): ApiSessionAdapter {
  let context = {
    accessToken: sessionStore.getState().accessToken,
    refreshToken: sessionStore.getState().refreshToken,
    tenantCode: tenantStore.getState().currentTenant?.code ?? null,
  };

  return {
    beginRefresh: () => sessionStore.getState().beginRefresh(),
    clearContext() {
      context = { accessToken: null, refreshToken: null, tenantCode: null };
    },
    async clearSession(reason) {
      context = { accessToken: null, refreshToken: null, tenantCode: null };
      if (reason === "expired") {
        sessionStore.getState().expireSession();
      } else {
        sessionStore.getState().clearSession();
      }
      tenantStore.getState().reset();
      await queryClient.cancelQueries();
      queryClient.clear();
      await onCleared?.();
    },
    commitContext(tokens, tenant) {
      context = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? null,
        tenantCode: tenant?.code ?? null,
      };
      tenantStore.getState().setContext({ currentTenant: tenant });
      sessionStore.getState().commitTokens(tokens);
    },
    getAccessToken: () => context.accessToken,
    getRefreshToken: () => context.refreshToken,
    getTenantCode: () => context.tenantCode,
    setTokens: (tokens) => {
      context = {
        ...context,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? context.refreshToken,
      };
      sessionStore.getState().commitTokens(tokens);
      sessionStore.getState().completeAuthentication();
    },
  };
}
