import type { QueryClient, QueryKey } from "@tanstack/react-query";

export type RuntimeCacheScope =
  | { id: string; type: "session" }
  | { code: string; type: "tenant" }
  | { generation: string; pluginId: string; type: "plugin" };

export function runtimeScopeKey(scope: RuntimeCacheScope): QueryKey {
  switch (scope.type) {
    case "session":
      return ["runtime", "session", scope.id];
    case "tenant":
      return ["runtime", "tenant", scope.code];
    case "plugin":
      return ["runtime", "plugin", scope.pluginId, scope.generation];
  }
}

export function scopedQueryKey(scope: RuntimeCacheScope, ...parts: readonly unknown[]): QueryKey {
  return [...runtimeScopeKey(scope), ...parts];
}

export async function clearRuntimeCacheScope(client: QueryClient, scope: RuntimeCacheScope): Promise<void> {
  const queryKey = runtimeScopeKey(scope);
  await client.cancelQueries({ queryKey });
  client.removeQueries({ queryKey });
}
