import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { MobileRecordActions, MobileRecordCard, MobileRecordField, MobileRecordFields, MobileRecordList, MobileRecordTitle, useLinaPluginHost } from "@linapro/plugin-ui";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DemoRecordModal } from "./components/demo-record-modal";
import { createDemoRecordApi, type DemoRecordItem, type DemoRecordListParams } from "./demo-record-client";
import "./demo-source.css";

function format(value: number | null, locale: string) { return value ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value)) : "-"; }
function can(permissions: ReadonlySet<string>, permission: string) { return permissions.has("*") || permissions.has(permission); }

export default function SidebarEntry() {
  const host = useLinaPluginHost(); const api = useMemo(() => createDemoRecordApi(host.api), [host.api]); const [params, setParams] = useState<DemoRecordListParams>({ pageNum: 1, pageSize: 10 }); const [rows, setRows] = useState<DemoRecordItem[]>([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(false); const [editing, setEditing] = useState<number | "new">();
  const load = useCallback(async () => { setLoading(true); try { const result = await api.list(params); setRows(result.items); setTotal(result.total); } catch (error) { Toast.error(error instanceof Error ? error.message : String(error)); } finally { setLoading(false); } }, [api, params]); useEffect(() => { queueMicrotask(() => void load()); }, [load]);
  async function remove(row: DemoRecordItem) { await api.delete(row.id); Toast.success(host.t("pages.common.deleteSuccess")); await load(); }
  async function download(row: DemoRecordItem) { const blob = await api.download(row.id); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = row.attachmentName || host.t("plugin.linapro-demo-source.page.attachmentFallback"); anchor.click(); URL.revokeObjectURL(url); }
  function renderActions(row: DemoRecordItem) { return <Space>{can(host.permissions, "linapro-demo-source:example:update") ? <Button data-testid={`linapro-demo-source-record-edit-${row.id}`} onClick={() => setEditing(row.id)} theme="borderless">{host.t("pages.common.edit")}</Button> : null}{can(host.permissions, "linapro-demo-source:example:delete") ? <Popconfirm content={host.t("plugin.linapro-demo-source.page.messages.deleteConfirm")} onConfirm={() => void remove(row)}><Button data-testid={`linapro-demo-source-record-delete-${row.id}`} theme="borderless" type="danger">{host.t("pages.common.delete")}</Button></Popconfirm> : null}</Space>; }
  const columns: ColumnProps<DemoRecordItem>[] = [
    { dataIndex: "title", title: host.t("plugin.linapro-demo-source.page.fields.title"), width: 220 }, { dataIndex: "content", ellipsis: true, title: host.t("plugin.linapro-demo-source.page.fields.content"), width: 320 },
    { dataIndex: "attachmentName", render: (value, row) => row.hasAttachment === 1 ? <Button onClick={() => void download(row)} theme="borderless">{String(value)}</Button> : "-", title: host.t("plugin.linapro-demo-source.page.fields.attachment"), width: 220 },
    { dataIndex: "updatedAt", render: (value) => format(value as number | null, host.locale), title: host.t("plugin.linapro-demo-source.page.fields.updatedAt"), width: 190 },
    { render: (_, row) => renderActions(row), title: host.t("pages.common.actions"), width: 180 },
  ];
  return <section className="demo-source-page" data-testid="linapro-demo-source-page"><header><Typography.Title heading={3}>{host.t("plugin.linapro-demo-source.page.tableTitle")}</Typography.Title></header><Card><Form<DemoRecordListParams> className="demo-source-search" layout="horizontal" onSubmit={(values) => setParams((current) => ({ ...current, ...values, pageNum: 1 }))}><Form.Input field="keyword" label={host.t("plugin.linapro-demo-source.page.fields.title")} /><Button htmlType="submit" theme="solid" type="primary">{host.t("pages.common.search")}</Button></Form></Card><Card><div className="demo-source-toolbar">{can(host.permissions, "linapro-demo-source:example:create") ? <Button data-testid="linapro-demo-source-record-add" onClick={() => setEditing("new")} theme="solid" type="primary">{host.t("pages.common.add")}</Button> : null}</div><div className="responsive-desktop-table" data-testid="linapro-demo-source-record-table"><Table<DemoRecordItem> columns={columns} dataSource={rows} loading={loading} pagination={{ currentPage: params.pageNum, onChange: (pageNum) => setParams((current) => ({ ...current, pageNum })), pageSize: params.pageSize, total }} rowKey="id" scroll={{ x: 1100 }} /></div><MobileRecordList testId="linapro-demo-source-mobile-list">{rows.map((row) => <MobileRecordCard key={row.id} testId={`linapro-demo-source-mobile-card-${row.id}`}><MobileRecordTitle>{row.title}</MobileRecordTitle><MobileRecordFields><MobileRecordField label={host.t("plugin.linapro-demo-source.page.fields.content")} value={row.content || "-"} /><MobileRecordField label={host.t("plugin.linapro-demo-source.page.fields.attachment")} value={row.hasAttachment === 1 ? row.attachmentName : "-"} /><MobileRecordField label={host.t("plugin.linapro-demo-source.page.fields.updatedAt")} value={format(row.updatedAt, host.locale)} /></MobileRecordFields><MobileRecordActions>{renderActions(row)}</MobileRecordActions></MobileRecordCard>)}</MobileRecordList></Card><DemoRecordModal api={api} onClose={() => setEditing(undefined)} onSaved={load} open={editing !== undefined} recordId={editing === "new" ? undefined : editing} t={host.t} /></section>;
}
