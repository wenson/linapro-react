import type { Query, QueryClient } from "@tanstack/react-query";

import type { AuthApi, LoginParams, LoginTenant } from "#/api/auth";
import type { MenuApi } from "#/api/menu";
import type { PluginRuntimeApi } from "#/api/plugins";
import type { TenantApi } from "#/api/tenant";
import type { UserApi } from "#/api/user";
import type { AuthenticatedContext } from "#/auth/auth-context";
import type { SessionStore } from "#/auth/session-store";
import type { ApiSessionAdapter } from "#/auth/session-adapter";
import { projectManagementCapabilities } from "#/plugins/capabilities";
import type { TenantStore } from "#/tenant/tenant-store";

const authContextPrefix = ["runtime", "auth-context"] as const;
const dictionaryPrefix = ["runtime", "dictionary"] as const;
const listLoginTenantsPermission = "system:tenant:auth:login-tenants";

export interface AuthRuntimeApis {
  auth: AuthApi;
  menu: MenuApi;
  plugins: PluginRuntimeApi;
  tenant: TenantApi;
  user: UserApi;
}

export interface TenantTransitionEffects {
  clearTabs?: () => Promise<void> | void;
  refreshDictionaries?: () => Promise<void> | void;
  refreshMessages?: () => Promise<void> | void;
  resetDefaultRoute?: (homePath: string) => Promise<void> | void;
}

export interface AuthRuntimeOptions {
  apis: AuthRuntimeApis;
  queryClient: QueryClient;
  requestContext?: ApiSessionAdapter;
  sessionStore: SessionStore;
  tenantStore: TenantStore;
  transitionEffects?: TenantTransitionEffects;
}

export interface LoginOutcome {
  context?: AuthenticatedContext;
  requiresTenantSelection: boolean;
  tenants: LoginTenant[];
}

function tenantContextKey(tenantCode: null | string, resource: "menus" | "plugins" | "user") {
  return [...authContextPrefix, tenantCode || "platform", resource] as const;
}

function isTenantSensitiveQuery(query: Query): boolean {
  const key = query.queryKey;
  return (
    query.meta?.tenantSensitive === true ||
    (key[0] === authContextPrefix[0] && key[1] === authContextPrefix[1]) ||
    (key[0] === dictionaryPrefix[0] && key[1] === dictionaryPrefix[1])
  );
}

function activeTenants(tenants: readonly LoginTenant[] | undefined): LoginTenant[] {
  return (tenants ?? []).filter(
    (tenant) => tenant.status !== "deleted" && tenant.status !== "suspended",
  );
}

function hasPermission(permissions: readonly string[], permission: string): boolean {
  return permissions.includes("*") || permissions.includes(permission);
}

export class AuthRuntime {
  private readonly apis: AuthRuntimeApis;
  private readonly queryClient: QueryClient;
  private readonly requestContext?: ApiSessionAdapter;
  private readonly sessionStore: SessionStore;
  private readonly tenantStore: TenantStore;
  private transitionEffects: TenantTransitionEffects;

  constructor(options: AuthRuntimeOptions) {
    this.apis = options.apis;
    this.queryClient = options.queryClient;
    this.requestContext = options.requestContext;
    this.sessionStore = options.sessionStore;
    this.tenantStore = options.tenantStore;
    this.transitionEffects = options.transitionEffects ?? {};
  }

  getSessionStore(): SessionStore {
    return this.sessionStore;
  }

  getTenantStore(): TenantStore {
    return this.tenantStore;
  }

  // getAnonymousPluginRuntimeStates returns public plugin states for anonymous UI slots.
  // The API only projects installation and runtime readiness; it does not expose user context.
  async getAnonymousPluginRuntimeStates() {
    return this.apis.plugins.getRuntimeStates();
  }

  setTransitionEffects(effects: TenantTransitionEffects): void {
    this.transitionEffects = effects;
  }

  async login(params: LoginParams): Promise<LoginOutcome> {
    this.sessionStore.getState().beginAuthentication();
    try {
      const result = await this.apis.auth.login(params);
      return await this.completeLoginResult(result);
    } catch (error) {
      await this.clearLocalSession();
      throw error;
    }
  }

  async completeExternalLoginFromHandoff(handoff: string): Promise<LoginOutcome> {
    const code = handoff.trim();
    if (!code) {
      throw new Error("External login handoff is missing");
    }
    if (!this.apis.auth.exchangeExternalHandoff) {
      throw new Error("External login is not available");
    }
    this.sessionStore.getState().beginAuthentication();
    try {
      return await this.completeLoginResult(await this.apis.auth.exchangeExternalHandoff(code));
    } catch (error) {
      await this.clearLocalSession();
      throw error;
    }
  }

  async selectTenant(tenantId: number): Promise<AuthenticatedContext> {
    const session = this.sessionStore.getState();
    const preToken = session.pendingPreToken;
    const selectedTenant = this.tenantStore
      .getState()
      .tenants.find((tenant) => tenant.id === tenantId);
    if (!preToken || !selectedTenant) {
      throw new RangeError("A valid pre-login tenant selection is required");
    }

    this.tenantStore.getState().startSwitch();
    this.sessionStore.getState().beginAuthentication();
    try {
      const tokens = await this.apis.tenant.selectTenant(preToken, tenantId);
      this.tenantStore.getState().setContext({ enabled: true });
      this.commitIdentity(tokens, selectedTenant);
      const context = await this.loadAuthenticatedContext(true);
      this.sessionStore.getState().completeAuthentication();
      return context;
    } catch (error) {
      this.sessionStore.getState().requireTenantSelection(preToken);
      throw error;
    } finally {
      this.tenantStore.getState().finishSwitch();
    }
  }

  cancelTenantSelection(): void {
    this.sessionStore.getState().cancelTenantSelection();
    this.tenantStore.getState().reset();
  }

  async restoreSession(): Promise<AuthenticatedContext | null> {
    if (!this.sessionStore.getState().accessToken) {
      this.sessionStore.getState().clearSession();
      return null;
    }
    try {
      const context = await this.loadAuthenticatedContext(true);
      this.sessionStore.getState().completeAuthentication();
      return context;
    } catch {
      await this.clearLocalSession(
        this.sessionStore.getState().authNotice === "session-expired",
      );
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.apis.auth.logout();
    } catch {
      // Logout is locally authoritative even if the server is unavailable.
    }
    await this.clearLocalSession();
  }

  async loadAuthenticatedContext(force = false): Promise<AuthenticatedContext> {
    const tenantCode = this.tenantStore.getState().currentTenant?.code ?? null;
    if (force) {
      await this.removeAuthContextQueries();
    }

    const commonOptions = {
      meta: { tenantSensitive: true },
      staleTime: 30_000,
    } as const;
    const [user, menus, plugins] = await Promise.all([
      this.queryClient.fetchQuery({
        ...commonOptions,
        queryFn: () => this.apis.user.getCurrentUser(),
        queryKey: tenantContextKey(tenantCode, "user"),
      }),
      this.queryClient.fetchQuery({
        ...commonOptions,
        queryFn: () => this.apis.menu.getAllMenus(),
        queryKey: tenantContextKey(tenantCode, "menus"),
      }),
      this.queryClient.fetchQuery({
        ...commonOptions,
        queryFn: () => this.apis.plugins.getRuntimeStates(),
        queryKey: tenantContextKey(tenantCode, "plugins"),
      }),
    ]);
    const capabilities = projectManagementCapabilities(
      plugins,
      this.tenantStore.getState().enabled,
    );
    if (capabilities.tenantEnabled !== this.tenantStore.getState().enabled) {
      this.tenantStore.getState().setContext({ enabled: capabilities.tenantEnabled });
    }
    if (capabilities.tenantEnabled && this.tenantStore.getState().tenants.length === 0) {
      const currentTenant = this.tenantStore.getState().currentTenant;
      if (!hasPermission(user.permissions, listLoginTenantsPermission)) {
        this.tenantStore.getState().setContext({
          tenants: currentTenant ? [currentTenant] : [],
        });
      } else {
        try {
          const tenants = activeTenants(await this.apis.tenant.listLoginTenants(user.userId));
          this.tenantStore.getState().setContext({ tenants });
        } catch {
          // Tenant candidates are a reloadable UI projection. Failure must not invalidate the session.
          this.tenantStore.getState().setContext({
            tenants: currentTenant ? [currentTenant] : [],
          });
        }
      }
    }
    return { capabilities, menus, plugins, user };
  }

  async switchTenant(tenantId: number): Promise<AuthenticatedContext> {
    const tenant = this.tenantStore
      .getState()
      .tenants.find((candidate) => candidate.id === tenantId);
    if (!tenant) {
      throw new RangeError("The target tenant is not available in the current login context");
    }

    this.tenantStore.getState().startSwitch();
    try {
      await this.cancelTenantSensitiveQueries();
      const tokens = await this.apis.tenant.switchTenant(tenantId);
      this.tenantStore.getState().setContext({ impersonation: { active: false } });
      this.sessionStore.getState().clearImpersonationRecovery();
      this.commitIdentity(tokens, tenant);
      this.sessionStore.getState().completeAuthentication();
      return await this.refreshTenantContext();
    } finally {
      this.tenantStore.getState().finishSwitch();
    }
  }

  async impersonate(tenant: LoginTenant, reason?: string): Promise<AuthenticatedContext> {
    const session = this.sessionStore.getState();
    if (!session.accessToken) {
      throw new Error("An authenticated platform session is required for impersonation");
    }

    this.tenantStore.getState().startSwitch();
    try {
      await this.cancelTenantSensitiveQueries();
      const result = await this.apis.tenant.impersonate(tenant.id, reason);
      if (!result.token) {
        throw new Error("Impersonation response did not include a token");
      }
      this.sessionStore.getState().setImpersonationRecovery({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
      this.tenantStore.getState().setContext({
        enabled: true,
        impersonation: {
          actingUserId: result.actingUserId,
          active: true,
          tenant,
        },
      });
      this.commitIdentity({ accessToken: result.token }, tenant);
      this.sessionStore.getState().completeAuthentication();
      return await this.refreshTenantContext();
    } finally {
      this.tenantStore.getState().finishSwitch();
    }
  }

  async exitImpersonation(): Promise<AuthenticatedContext> {
    const tenantId = this.tenantStore.getState().impersonation.tenant?.id;
    const recovery = this.sessionStore.getState().impersonationRecovery;
    if (!tenantId || !recovery) {
      await this.clearLocalSession();
      throw new Error("The original platform session cannot be restored");
    }

    this.tenantStore.getState().startSwitch();
    try {
      await this.cancelTenantSensitiveQueries();
      await this.apis.tenant.endImpersonation(tenantId);
      this.tenantStore.getState().setContext({
        impersonation: { active: false },
      });
      this.commitIdentity({
        accessToken: recovery.accessToken,
        refreshToken: recovery.refreshToken ?? undefined,
      }, null);
      this.sessionStore.getState().clearImpersonationRecovery();
      this.sessionStore.getState().completeAuthentication();
      return await this.refreshTenantContext();
    } finally {
      this.tenantStore.getState().finishSwitch();
    }
  }

  private async refreshTenantContext(): Promise<AuthenticatedContext> {
    await this.removeAuthContextQueries();
    await this.queryClient.cancelQueries({ queryKey: dictionaryPrefix });
    this.queryClient.removeQueries({ queryKey: dictionaryPrefix });
    const contextPromise = this.loadAuthenticatedContext();
    const sideEffectsPromise = Promise.all([
      this.transitionEffects.clearTabs?.(),
      this.transitionEffects.refreshDictionaries?.(),
      this.transitionEffects.refreshMessages?.(),
    ]);
    const [context] = await Promise.all([contextPromise, sideEffectsPromise]);
    await this.transitionEffects.resetDefaultRoute?.(context.user.homePath);
    return context;
  }

  private async cancelTenantSensitiveQueries(): Promise<void> {
    await this.queryClient.cancelQueries({ predicate: isTenantSensitiveQuery });
  }

  private async completeLoginResult(result: Awaited<ReturnType<AuthApi["login"]>>): Promise<LoginOutcome> {
    const tenants = activeTenants(result.tenants);
    if (!result.accessToken && result.preToken && tenants.length > 0) {
      this.tenantStore.getState().setContext({
        currentTenant: null,
        enabled: true,
        tenants,
      });
      this.sessionStore.getState().requireTenantSelection(result.preToken);
      return { requiresTenantSelection: true, tenants };
    }
    if (!result.accessToken) {
      throw new Error("Authentication response did not include an access token");
    }

    const currentTenant = tenants.length === 1 ? (tenants[0] ?? null) : null;
    this.tenantStore.getState().setContext({
      enabled: tenants.length > 0,
      tenants,
    });
    this.commitIdentity({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }, currentTenant);
    const context = await this.loadAuthenticatedContext(true);
    this.sessionStore.getState().completeAuthentication();
    return { context, requiresTenantSelection: false, tenants };
  }

  private async removeAuthContextQueries(): Promise<void> {
    await this.queryClient.cancelQueries({ queryKey: authContextPrefix });
    this.queryClient.removeQueries({ queryKey: authContextPrefix });
  }

  private async clearLocalSession(preserveExpiryNotice = false): Promise<void> {
    this.requestContext?.clearContext();
    if (preserveExpiryNotice) {
      this.sessionStore.getState().expireSession();
    } else {
      this.sessionStore.getState().clearSession();
    }
    this.tenantStore.getState().reset();
    await this.queryClient.cancelQueries();
    this.queryClient.clear();
  }

  private commitIdentity(
    tokens: { accessToken: string; refreshToken?: string },
    tenant: LoginTenant | null,
  ): void {
    if (this.requestContext) {
      this.requestContext.commitContext(tokens, tenant);
      return;
    }
    this.tenantStore.getState().setContext({ currentTenant: tenant });
    this.sessionStore.getState().commitTokens(tokens);
  }
}
