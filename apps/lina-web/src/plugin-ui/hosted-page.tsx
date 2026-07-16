import Button from "@douyinfe/semi-ui/lib/es/button";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";

import { useWorkbenchRuntime } from "#/app/workbench-runtime-context";
import { useAuthContext } from "#/auth/auth-context";
import {
  HostedPluginBridge,
  type HostedBridgeContext,
} from "#/plugin-ui/hosted-bridge";
import {
  type HostedAsset,
  normalizeHostedAsset,
} from "#/plugin-ui/hosted-page-contract";
import type { WorkbenchRoute } from "#/router/contracts";
import { tenantStore as fallbackTenantStore } from "#/tenant/tenant-store";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createNonce(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const values = crypto.getRandomValues(new Uint32Array(4));
  return [...values].map((value) => value.toString(16).padStart(8, "0")).join("");
}

function projectPluginMessages(i18n: ReturnType<typeof useTranslation>["i18n"], locale: string, pluginId: string) {
  const bundle = i18n.getResourceBundle(locale, "translation");
  const plugins = isRecord(bundle) && isRecord(bundle.plugin) ? bundle.plugin : {};
  const messages = isRecord(plugins[pluginId]) ? plugins[pluginId] : {};
  return Object.freeze({ plugin: Object.freeze({ [pluginId]: messages }) });
}

function projectPluginPermissions(permissions: readonly string[], pluginId: string): readonly string[] {
  const prefix = `${pluginId}:`;
  const projected = permissions.filter((permission) => permission.startsWith(prefix));
  if (permissions.includes("*") && !projected.includes(`${pluginId}:*`)) {
    projected.push(`${pluginId}:*`);
  }
  return Object.freeze([...new Set(projected)].sort());
}

function withBridgeFragment(asset: HostedAsset, generation: number, nonce: string): string {
  const fragment = new URLSearchParams({
    generation: String(generation),
    nonce,
    pluginId: asset.pluginId,
    protocol: "linapro.plugin-bridge",
    version: "1",
  });
  return `${asset.source}#${fragment.toString()}`;
}

export function HostedPage({ route }: { route: WorkbenchRoute }) {
  const { apiClient, tenantStore } = useWorkbenchRuntime();
  const auth = useAuthContext();
  const { i18n, t } = useTranslation();
  const store = tenantStore ?? fallbackTenantStore;
  const tenantCode = useStore(store, (state) => state.currentTenant?.code ?? "");
  const frameRef = useRef<HTMLIFrameElement>(null);
  const openedSession = useRef("");
  const plugin = auth?.plugins.find((item) => item.id === route.pluginId);
  const locale = i18n.resolvedLanguage || i18n.language || "en-US";
  const permissions = useMemo(
    () => projectPluginPermissions(auth?.user.permissions ?? [], route.pluginId ?? ""),
    [auth?.user.permissions, route.pluginId],
  );
  const context = useMemo<HostedBridgeContext>(() => ({
    locale,
    messages: projectPluginMessages(i18n, locale, route.pluginId ?? ""),
    permissions,
  }), [i18n, locale, permissions, route.pluginId]);
  const assetResult = useMemo<{ asset?: HostedAsset; error: string }>(() => {
    try {
      return { asset: normalizeHostedAsset(route, plugin?.version), error: "" };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Invalid hosted plugin route",
      };
    }
  }, [plugin, route]);
  const { asset, error: validationError } = assetResult;
  const available = !!plugin && plugin.installed === 1 && plugin.enabled === 1 && (!plugin.runtimeState || plugin.runtimeState === "normal");
  const generation = plugin?.generation ?? 0;
  const contextIdentity = `${locale}:${tenantCode}:${permissions.join("|")}`;
  const session = useMemo(() => {
    const nonce = createNonce();
    const source = asset
      ? asset.mode === "iframe"
        ? withBridgeFragment(asset, generation, nonce)
        : asset.source
      : "";
    const identity = asset?.mode === "iframe"
      ? `${source}:${contextIdentity}`
      : `${asset?.mode || "invalid"}:${source}`;
    return { identity, nonce, source };
  }, [asset, contextIdentity, generation]);

  useEffect(() => {
    if (!asset || asset.mode !== "iframe" || !available || generation <= 0) return;
    const bridge = new HostedPluginBridge({
      apiClient,
      contentWindow: () => frameRef.current?.contentWindow ?? null,
      context,
      generation,
      nonce: session.nonce,
      pluginId: asset.pluginId,
    });
    return bridge.start();
  }, [apiClient, asset, available, context, generation, session.nonce]);

  useEffect(() => {
    if (!asset || asset.mode !== "new-window" || !available || generation <= 0 || openedSession.current === session.identity) return;
    openedSession.current = session.identity;
    window.open(session.source, "_blank", "noopener,noreferrer");
  }, [asset, available, generation, session]);

  if (validationError) {
    return <Typography.Text role="alert" type="danger">{t("workbench.hosted.invalid", { detail: validationError })}</Typography.Text>;
  }
  if (!available || generation <= 0) {
    return <Typography.Text role="alert" type="danger">{t("workbench.hosted.unavailable")}</Typography.Text>;
  }
  if (asset?.mode === "new-window") {
    return (
      <div className="hosted-plugin-new-window" role="status">
        <Typography.Paragraph>{t("workbench.hosted.opened")}</Typography.Paragraph>
        <Button onClick={() => window.open(session.source, "_blank", "noopener,noreferrer")}>{t("workbench.hosted.openAgain")}</Button>
      </div>
    );
  }
  return (
    <iframe
      className="workbench-iframe hosted-plugin-frame"
      key={session.identity}
      ref={frameRef}
      referrerPolicy="no-referrer"
      sandbox="allow-downloads allow-forms allow-modals allow-popups allow-scripts"
      src={session.source}
      title={route.title}
    />
  );
}
