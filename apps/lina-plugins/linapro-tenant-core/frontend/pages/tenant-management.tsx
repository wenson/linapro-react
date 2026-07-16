import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Switch from "@douyinfe/semi-ui/lib/es/switch";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Tooltip from "@douyinfe/semi-ui/lib/es/tooltip";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { requestTenantImpersonation, useLinaPluginHost } from "@linapro/plugin-ui";
import { useCallback, useEffect, useMemo, useState } from "react";

import { TenantModal } from "./components/tenant-modal";
import { createTenantManagementApi, type PlatformTenant, type PlatformTenantListParams, type TenantStatus } from "./tenant-client";
import "./tenant.css";

function allowed(permissions: ReadonlySet<string>, permission: string): boolean { return permissions.has("*") || permissions.has(permission); }
function message(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function timestamp(value: number | null | undefined, locale: string): string { return value ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value)) : "-"; }

export default function TenantManagement() {
  const host = useLinaPluginHost();
  const api = useMemo(() => createTenantManagementApi(host.api), [host.api]);
  const [params, setParams] = useState<PlatformTenantListParams>({ pageNum: 1, pageSize: 10 });
  const [rows, setRows] = useState<PlatformTenant[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<string>();
  const [editor, setEditor] = useState<PlatformTenant | "new">();
  const load = useCallback(async () => { setLoading(true); try { const result = await api.list(params); setRows(result.items); setTotal(result.total); } catch (error) { Toast.error(message(error)); } finally { setLoading(false); } }, [api, params]);
  useEffect(() => { queueMicrotask(() => void load()); }, [load]);

  async function changeStatus(row: PlatformTenant, status: TenantStatus): Promise<void> {
    setPending(`status:${row.id}`);
    try { await api.changeStatus(row.id, status); Toast.success(host.t("plugin.linapro-tenant-core.messages.statusUpdated")); await load(); }
    catch (error) { Toast.error(message(error)); }
    finally { setPending(undefined); }
  }
  async function remove(items: PlatformTenant[]): Promise<void> {
    setPending("delete");
    try { await Promise.all(items.map((item) => api.delete(item.id))); setSelected([]); Toast.success(host.t("pages.common.deleteSuccess")); await load(); }
    catch (error) { Toast.error(message(error)); }
    finally { setPending(undefined); }
  }
  function batchDelete(): void {
    const targets = rows.filter((row) => selected.includes(row.id));
    Modal.confirm({ cancelText: host.t("pages.common.cancel"), content: host.t("plugin.linapro-tenant-core.messages.deleteSelectedConfirm", { count: targets.length }), okButtonProps: { type: "danger" }, okText: host.t("pages.common.confirm"), onOk: () => remove(targets), title: host.t("pages.common.confirmTitle") });
  }
  async function impersonate(row: PlatformTenant): Promise<void> {
    setPending(`impersonate:${row.id}`);
    try { await requestTenantImpersonation(row); }
    catch (error) { Toast.error(message(error)); setPending(undefined); }
  }
  function reset(): void { setParams({ pageNum: 1, pageSize: params.pageSize }); }
  const columns: ColumnProps<PlatformTenant>[] = [
    { dataIndex: "code", title: host.t("plugin.linapro-tenant-core.fields.code"), width: 170 },
    { dataIndex: "name", title: host.t("plugin.linapro-tenant-core.fields.name"), width: 220 },
    { dataIndex: "status", render: (_, row) => <Space><Switch aria-label={host.t("pages.common.status")} checked={row.status === "active"} data-testid={row.status === "active" ? `tenant-suspend-${row.id}` : `tenant-resume-${row.id}`} disabled={row.status === "deleted" || !allowed(host.permissions, "system:tenant:edit")} loading={pending === `status:${row.id}`} onChange={(checked) => void changeStatus(row, checked ? "active" : "suspended")} /><Tag color={row.status === "active" ? "green" : row.status === "deleted" ? "red" : "orange"}>{host.t(`plugin.linapro-tenant-core.status.${row.status || "unknown"}`)}</Tag></Space>, title: host.t("pages.common.status"), width: 190 },
    { dataIndex: "createdAt", render: (value) => timestamp(value as number | null, host.locale), title: host.t("pages.common.createdAt"), width: 190 },
    { fixed: "right", render: (_, row) => <Space>{allowed(host.permissions, "system:tenant:edit") ? <Button data-testid={`tenant-edit-${row.id}`} onClick={() => setEditor(row)} theme="borderless">{host.t("pages.common.edit")}</Button> : null}{allowed(host.permissions, "system:tenant:impersonate") ? <Tooltip content={host.t("plugin.linapro-tenant-core.tenant.tooltips.impersonate")}><Button data-testid={`tenant-impersonate-${row.id}`} disabled={row.status !== "active"} loading={pending === `impersonate:${row.id}`} onClick={() => void impersonate(row)} theme="borderless" type="primary">{host.t("plugin.linapro-tenant-core.tenant.actions.impersonate")}</Button></Tooltip> : null}{allowed(host.permissions, "system:tenant:remove") ? <Popconfirm content={host.t("plugin.linapro-tenant-core.messages.deleteTenantConfirm", { name: row.name })} onConfirm={() => void remove([row])}><Button data-testid={`tenant-delete-${row.id}`} theme="borderless" type="danger">{host.t("pages.common.delete")}</Button></Popconfirm> : null}</Space>, title: host.t("pages.common.actions"), width: 300 },
  ];

  return <section className="tenant-core-page" data-testid="platform-tenants-page">
    <Typography.Title heading={3}>{host.t("plugin.linapro-tenant-core.tenant.tableTitle")}</Typography.Title>
    <Card><Form<PlatformTenantListParams> className="tenant-core-search" layout="horizontal" onReset={reset} onSubmit={(values) => setParams((current) => ({ ...current, ...values, pageNum: 1 }))}><Form.Input data-testid="tenant-search-code" field="code" label={host.t("plugin.linapro-tenant-core.fields.code")} /><Form.Input data-testid="tenant-search-name" field="name" label={host.t("plugin.linapro-tenant-core.fields.name")} /><Form.Select data-testid="tenant-search-status" field="status" label={host.t("pages.common.status")} optionList={["active", "suspended"].map((value) => ({ label: host.t(`plugin.linapro-tenant-core.status.${value}`), value }))} /><Space><Button htmlType="reset">{host.t("pages.common.reset")}</Button><Button htmlType="submit" theme="solid" type="primary">{host.t("pages.common.search")}</Button></Space></Form></Card>
    <Card><div className="tenant-core-toolbar"><Space>{allowed(host.permissions, "system:tenant:remove") ? <Button data-testid="tenant-batch-delete" disabled={!selected.length} loading={pending === "delete"} onClick={batchDelete} type="danger">{host.t("pages.common.delete")}</Button> : null}{allowed(host.permissions, "system:tenant:add") ? <Button data-testid="tenant-create" onClick={() => setEditor("new")} theme="solid" type="primary">{host.t("pages.common.add")}</Button> : null}</Space></div><div data-testid="platform-tenants-table"><Table<PlatformTenant> columns={columns} dataSource={rows} loading={loading} pagination={{ currentPage: params.pageNum, onChange: (pageNum) => setParams((current) => ({ ...current, pageNum })), pageSize: params.pageSize, showTotal: true, total }} rowKey="id" rowSelection={{ onChange: (keys) => setSelected((keys ?? []).map(Number)), selectedRowKeys: selected }} scroll={{ x: 1100 }} /></div></Card>
    <TenantModal api={api} onClose={() => setEditor(undefined)} onSaved={load} open={editor !== undefined} record={editor === "new" ? undefined : editor} t={host.t} />
  </section>;
}
