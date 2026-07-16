import { createStore } from "zustand/vanilla";
import type { StoreApi } from "zustand/vanilla";

import type { LoginTenant } from "#/api/auth";

export const tenantStorageKey = "linapro:web:tenant:v1";

export interface TenantImpersonation {
  actingUserId?: number;
  active: boolean;
  tenant?: LoginTenant;
}

interface PersistedTenantContext {
  currentTenant?: LoginTenant | null;
  enabled?: boolean;
  impersonation?: TenantImpersonation;
}

export interface TenantState {
  currentTenant: LoginTenant | null;
  enabled: boolean;
  finishSwitch(): void;
  impersonation: TenantImpersonation;
  reset(): void;
  setContext(context: {
    currentTenant?: LoginTenant | null;
    enabled?: boolean;
    impersonation?: TenantImpersonation;
    tenants?: LoginTenant[];
  }): void;
  startSwitch(): void;
  switching: boolean;
  tenants: LoginTenant[];
}

export type TenantStore = StoreApi<TenantState>;

export interface TenantStoreOptions {
  storage?: null | Storage;
}

function browserStorage(): null | Storage {
  return typeof window === "undefined" ? null : window.localStorage;
}

function readPersistedContext(storage: null | Storage): PersistedTenantContext {
  if (!storage) {
    return {};
  }
  try {
    const parsed = JSON.parse(storage.getItem(tenantStorageKey) || "{}") as PersistedTenantContext;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function persistContext(storage: null | Storage, state: TenantState): void {
  if (!storage) {
    return;
  }
  try {
    if (!state.enabled && !state.currentTenant && !state.impersonation.active) {
      storage.removeItem(tenantStorageKey);
      return;
    }
    const persisted: PersistedTenantContext = {
      currentTenant: state.currentTenant,
      enabled: state.enabled,
      impersonation: state.impersonation,
    };
    storage.setItem(tenantStorageKey, JSON.stringify(persisted));
  } catch {
    // Storage failure does not widen tenant access; the backend still validates every request.
  }
}

export function createTenantStore(options: TenantStoreOptions = {}): TenantStore {
  const storage = options.storage === undefined ? browserStorage() : options.storage;
  const persisted = readPersistedContext(storage);
  const store = createStore<TenantState>((set) => ({
    currentTenant: persisted.currentTenant ?? null,
    enabled: persisted.enabled === true,
    finishSwitch: () => set({ switching: false }),
    impersonation: persisted.impersonation?.active
      ? persisted.impersonation
      : { active: false },
    reset: () =>
      set({
        currentTenant: null,
        enabled: false,
        impersonation: { active: false },
        switching: false,
        tenants: [],
      }),
    setContext: (context) =>
      set((state) => ({
        currentTenant:
          "currentTenant" in context ? (context.currentTenant ?? null) : state.currentTenant,
        enabled: context.enabled ?? state.enabled,
        impersonation: context.impersonation ?? state.impersonation,
        tenants: context.tenants ?? state.tenants,
      })),
    startSwitch: () => set({ switching: true }),
    switching: false,
    tenants: [],
  }));

  store.subscribe((state) => persistContext(storage, state));
  return store;
}

export const tenantStore = createTenantStore();
