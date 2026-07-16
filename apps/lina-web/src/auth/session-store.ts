import { createStore } from "zustand/vanilla";
import type { StoreApi } from "zustand/vanilla";

import type { ApiTokenPair } from "#/api/client";

export const sessionStorageKey = "linapro:web:session:v1";

export type SessionStatus =
  | "anonymous"
  | "authenticated"
  | "authenticating"
  | "refreshing"
  | "selecting-tenant";

export interface ImpersonationRecovery {
  accessToken: string;
  refreshToken: null | string;
}

interface PersistedSession {
  accessToken?: string;
  impersonationRecovery?: ImpersonationRecovery;
  refreshToken?: string;
}

export interface SessionState {
  accessToken: null | string;
  authNotice: "session-expired" | null;
  beginAuthentication(): void;
  beginRefresh(): void;
  cancelTenantSelection(): void;
  clearImpersonationRecovery(): void;
  clearSession(): void;
  commitTokens(tokens: ApiTokenPair): void;
  completeAuthentication(): void;
  expireSession(): void;
  impersonationRecovery: ImpersonationRecovery | null;
  pendingPreToken: null | string;
  refreshToken: null | string;
  revision: number;
  requireTenantSelection(preToken: string): void;
  setImpersonationRecovery(tokens: ImpersonationRecovery): void;
  status: SessionStatus;
}

export type SessionStore = StoreApi<SessionState>;

export interface SessionStoreOptions {
  storage?: null | Storage;
}

function browserStorage(): null | Storage {
  return typeof window === "undefined" ? null : window.localStorage;
}

function readPersistedSession(storage: null | Storage): PersistedSession {
  if (!storage) {
    return {};
  }
  try {
    const parsed = JSON.parse(storage.getItem(sessionStorageKey) || "{}") as PersistedSession;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeToken(value: unknown): null | string {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeRecovery(value: unknown): ImpersonationRecovery | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const accessToken = normalizeToken(Reflect.get(value, "accessToken"));
  if (!accessToken) {
    return null;
  }
  return {
    accessToken,
    refreshToken: normalizeToken(Reflect.get(value, "refreshToken")),
  };
}

function persistSession(storage: null | Storage, state: SessionState): void {
  if (!storage) {
    return;
  }
  try {
    if (!state.accessToken && !state.refreshToken && !state.impersonationRecovery) {
      storage.removeItem(sessionStorageKey);
      return;
    }
    const persisted: PersistedSession = {
      accessToken: state.accessToken ?? undefined,
      impersonationRecovery: state.impersonationRecovery ?? undefined,
      refreshToken: state.refreshToken ?? undefined,
    };
    storage.setItem(sessionStorageKey, JSON.stringify(persisted));
  } catch {
    // Storage can be unavailable in privacy mode. The in-memory session remains usable.
  }
}

export function createSessionStore(options: SessionStoreOptions = {}): SessionStore {
  const storage = options.storage === undefined ? browserStorage() : options.storage;
  const persisted = readPersistedSession(storage);
  const initialAccessToken = normalizeToken(persisted.accessToken);
  const initialRefreshToken = normalizeToken(persisted.refreshToken);
  const initialRecovery = normalizeRecovery(persisted.impersonationRecovery);

  const store = createStore<SessionState>((set) => ({
    accessToken: initialAccessToken,
    authNotice: null,
    beginAuthentication: () =>
      set({ authNotice: null, pendingPreToken: null, status: "authenticating" }),
    beginRefresh: () =>
      set((state) => ({ status: state.accessToken ? "refreshing" : "anonymous" })),
    cancelTenantSelection: () =>
      set((state) => ({
        accessToken: null,
        authNotice: null,
        pendingPreToken: null,
        refreshToken: null,
        revision: state.revision + 1,
        status: "anonymous",
      })),
    clearImpersonationRecovery: () => set({ impersonationRecovery: null }),
    clearSession: () =>
      set((state) => ({
        accessToken: null,
        authNotice: null,
        impersonationRecovery: null,
        pendingPreToken: null,
        refreshToken: null,
        revision: state.revision + 1,
        status: "anonymous",
      })),
    commitTokens: (tokens) =>
      set((state) => ({
        accessToken: normalizeToken(tokens.accessToken),
        authNotice: null,
        pendingPreToken: null,
        refreshToken: normalizeToken(tokens.refreshToken),
        revision: state.revision + 1,
      })),
    completeAuthentication: () =>
      set((state) => ({ status: state.accessToken ? "authenticated" : "anonymous" })),
    expireSession: () =>
      set((state) => ({
        accessToken: null,
        authNotice: "session-expired",
        impersonationRecovery: null,
        pendingPreToken: null,
        refreshToken: null,
        revision: state.revision + 1,
        status: "anonymous",
      })),
    impersonationRecovery: initialRecovery,
    pendingPreToken: null,
    refreshToken: initialRefreshToken,
    revision: 0,
    requireTenantSelection: (preToken) =>
      set({
        accessToken: null,
        pendingPreToken: preToken.trim() || null,
        refreshToken: null,
        status: preToken.trim() ? "selecting-tenant" : "anonymous",
      }),
    setImpersonationRecovery: (tokens) => set({ impersonationRecovery: normalizeRecovery(tokens) }),
    status: initialAccessToken ? "authenticating" : "anonymous",
  }));

  store.subscribe((state) => persistSession(storage, state));
  return store;
}

export const sessionStore = createSessionStore();
