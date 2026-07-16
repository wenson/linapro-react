import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useLinaPluginHost } from "@linapro/plugin-ui";
import { useCallback, useEffect, useMemo, useState } from "react";

import { dictColor, dictLabel, formatTimestamp } from "./data";
import { createNoticeApi, type DictOption, type Notice, type NoticeListParams } from "./notice-client";
import { NoticeModal } from "./notice-modal";
import { NoticePreviewModal } from "./notice-preview-modal";
import "./notice.css";

function can(permissions: ReadonlySet<string>, permission: string) { return permissions.has("*") || permissions.has(permission); }

export default function NoticeManagement() {
  const host = useLinaPluginHost(); const api = useMemo(() => createNoticeApi(host.api), [host.api]); const [params, setParams] = useState<NoticeListParams>({ pageNum: 1, pageSize: 10 }); const [rows, setRows] = useState<Notice[]>([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(false); const [types, setTypes] = useState<DictOption[]>([]); const [statuses, setStatuses] = useState<DictOption[]>([]); const [selected, setSelected] = useState<number[]>([]); const [editing, setEditing] = useState<number | "new">(); const [preview, setPreview] = useState<number>();
  const load = useCallback(async () => { setLoading(true); try { const result = await api.list(params); setRows(result.items); setTotal(result.total); } catch (error) { Toast.error(error instanceof Error ? error.message : String(error)); } finally { setLoading(false); } }, [api, params]);
  useEffect(() => { queueMicrotask(() => void load()); }, [load]);
  useEffect(() => { queueMicrotask(() => void Promise.all([api.dict("sys_notice_type"), api.dict("sys_notice_status")]).then(([typeOptions, statusOptions]) => { setTypes(typeOptions); setStatuses(statusOptions); }).catch((error: unknown) => Toast.error(error instanceof Error ? error.message : String(error)))); }, [api]);
  async function remove(ids: number[]) { await api.delete(ids); setSelected([]); Toast.success(host.t("pages.common.deleteSuccess")); await load(); }
  function batchRemove() { Modal.confirm({ content: host.t("plugin.linapro-content-notice.messages.deleteSelectedConfirm", { count: selected.length }), onOk: () => remove(selected), title: host.t("pages.common.confirmTitle") }); }
  const columns: ColumnProps<Notice>[] = [
    { dataIndex: "title", title: host.t("plugin.linapro-content-notice.fields.title"), width: 260 },
    { dataIndex: "type", render: (value) => <Tag color={dictColor(types, Number(value))}>{dictLabel(types, Number(value))}</Tag>, title: host.t("plugin.linapro-content-notice.fields.type"), width: 120 },
    { dataIndex: "status", render: (value) => <Tag color={dictColor(statuses, Number(value))}>{dictLabel(statuses, Number(value)) || host.t(Number(value) === 1 ? "plugin.linapro-content-notice.status.published" : "plugin.linapro-content-notice.status.draft")}</Tag>, title: host.t("pages.common.status"), width: 120 },
    { dataIndex: "createdByName", title: host.t("plugin.linapro-content-notice.fields.createdBy"), width: 150 },
    { dataIndex: "createdAt", render: (value) => formatTimestamp(value as number | null, host.locale), title: host.t("pages.common.createdAt"), width: 190 },
    { fixed: "right", render: (_, row) => <Space>{can(host.permissions, "system:notice:list") ? <Button onClick={() => setPreview(row.id)} theme="borderless">{host.t("plugin.linapro-content-notice.common.preview")}</Button> : null}{can(host.permissions, "system:notice:edit") ? <Button onClick={() => setEditing(row.id)} theme="borderless">{host.t("pages.common.edit")}</Button> : null}{can(host.permissions, "system:notice:remove") ? <Popconfirm content={host.t("plugin.linapro-content-notice.common.deleteConfirm")} onConfirm={() => void remove([row.id])}><Button theme="borderless" type="danger">{host.t("pages.common.delete")}</Button></Popconfirm> : null}</Space>, title: host.t("pages.common.actions"), width: 220 },
  ];
  return <section className="notice-page" data-testid="notice-management-page"><header className="notice-page-header"><Typography.Title heading={3}>{host.t("plugin.linapro-content-notice.tableTitle")}</Typography.Title></header><Card><Form<NoticeListParams> className="notice-search-form" layout="horizontal" onReset={() => setParams((current) => ({ pageNum: 1, pageSize: current.pageSize }))} onSubmit={(values) => setParams((current) => ({ ...current, ...values, pageNum: 1 }))}><Form.Input field="title" label={host.t("plugin.linapro-content-notice.fields.title")} /><Form.Select field="type" label={host.t("plugin.linapro-content-notice.fields.type")} optionList={types.map((item) => ({ label: item.label, value: Number(item.value) }))} /><Form.Input field="createdBy" label={host.t("plugin.linapro-content-notice.fields.createdBy")} /><Button htmlType="reset">{host.t("pages.common.reset")}</Button><Button htmlType="submit" theme="solid" type="primary">{host.t("pages.common.search")}</Button></Form></Card><Card><div className="notice-toolbar"><Space>{can(host.permissions, "system:notice:remove") ? <Button disabled={!selected.length} onClick={batchRemove} type="danger">{host.t("pages.common.delete")}</Button> : null}{can(host.permissions, "system:notice:add") ? <Button onClick={() => setEditing("new")} theme="solid" type="primary">{host.t("pages.common.add")}</Button> : null}</Space></div><div data-testid="notice-table"><Table<Notice> columns={columns} dataSource={rows} loading={loading} pagination={{ currentPage: params.pageNum, onChange: (pageNum) => setParams((current) => ({ ...current, pageNum })), pageSize: params.pageSize, showTotal: true, total }} rowKey="id" rowSelection={{ onChange: (keys) => setSelected((keys ?? []).map(Number)), selectedRowKeys: selected }} scroll={{ x: 1100 }} /></div></Card><NoticeModal api={api} noticeId={editing === "new" ? undefined : editing} onClose={() => setEditing(undefined)} onSaved={load} open={editing !== undefined} t={host.t} typeOptions={types} /><NoticePreviewModal api={api} locale={host.locale} noticeId={preview} onClose={() => setPreview(undefined)} open={preview !== undefined} t={host.t} typeOptions={types} /></section>;
}
