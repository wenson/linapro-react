import Card from "@douyinfe/semi-ui/lib/es/card";
import Switch from "@douyinfe/semi-ui/lib/es/switch";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useLinaPluginHost } from "@linapro/plugin-ui";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createTenantPluginManagementApi, type TenantPlugin } from "./tenant-plugin-client";
import "./tenant.css";

function allowed(permissions: ReadonlySet<string>, permission: string): boolean { return permissions.has("*") || permissions.has(permission); }
function message(error: unknown): string { return error instanceof Error ? error.message : String(error); }

export default function TenantPluginManagement() {
  const host = useLinaPluginHost();
  const api = useMemo(() => createTenantPluginManagementApi(host.api), [host.api]);
  const [rows, setRows] = useState<TenantPlugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<string>();
  const load = useCallback(async () => { if (!host.tenant) { setRows([]); return; } setLoading(true); try { setRows((await api.list()).items); } catch (error) { Toast.error(message(error)); } finally { setLoading(false); } }, [api, host.tenant]);
  useEffect(() => { queueMicrotask(() => void load()); }, [load]);
  async function toggle(row: TenantPlugin, checked: boolean): Promise<void> { setPending(row.id); try { if (checked) await api.enable(row.id); else await api.disable(row.id); Toast.success(host.t("pages.common.updateSuccess")); await load(); } catch (error) { Toast.error(message(error)); } finally { setPending(undefined); } }
  const columns: ColumnProps<TenantPlugin>[] = [
    { dataIndex: "id", title: host.t("plugin.linapro-tenant-core.plugin.fields.id"), width: 190 },
    { dataIndex: "name", title: host.t("plugin.linapro-tenant-core.plugin.fields.name"), width: 220 },
    { dataIndex: "installMode", render: (value) => <Tag color="blue">{host.t(`plugin.linapro-tenant-core.plugin.installModes.${String(value || "tenant_scoped")}`)}</Tag>, title: host.t("plugin.linapro-tenant-core.plugin.installMode"), width: 160 },
    { dataIndex: "tenantEnabled", render: (_, row) => { const checked = row.tenantEnabled === 1 || row.enabled === 1; const permission = checked ? "system:tenant:plugin:disable" : "system:tenant:plugin:enable"; return <Switch aria-label={host.t("pages.common.status")} checked={checked} data-testid={`tenant-plugin-toggle-${row.id}`} disabled={!allowed(host.permissions, permission)} loading={pending === row.id} onChange={(value) => void toggle(row, value)} />; }, title: host.t("pages.common.status"), width: 120 },
    { dataIndex: "description", title: host.t("plugin.linapro-tenant-core.plugin.fields.description") },
  ];
  return <section className="tenant-core-page" data-testid="tenant-plugins-page"><Typography.Title heading={3}>{host.t("plugin.linapro-tenant-core.plugin.tableTitle")}</Typography.Title><Card><div data-testid="tenant-plugins-table"><Table<TenantPlugin> columns={columns} dataSource={rows} empty={host.tenant ? host.t("plugin.linapro-tenant-core.empty.plugins") : host.t("plugin.linapro-tenant-core.empty.selectTenant")} loading={loading} pagination={false} rowKey="id" scroll={{ x: 900 }} /></div></Card></section>;
}
