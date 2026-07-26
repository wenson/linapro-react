import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { MobileRecordActions, MobileRecordCard, MobileRecordField, MobileRecordFields, MobileRecordList, MobileRecordTitle, useLinaPluginHost } from "@linapro/plugin-ui";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createAiCoreApi, type Model, type ModelListParams, type Provider } from "./ai-client";
import { compactFilters, hasPermission, protocolLabel } from "./ai-data";
import { ModelSideSheet } from "./model-side-sheet";
import { ListFeedback } from "./list-feedback";
import "./ai-core.css";

export default function ModelManagement() {
  const host = useLinaPluginHost(); const api = useMemo(() => createAiCoreApi(host.api), [host.api]);
  const [params, setParams] = useState<ModelListParams>({ pageNum: 1, pageSize: 10 }); const [rows, setRows] = useState<Model[]>([]); const [providers, setProviders] = useState<Provider[]>([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(false); const [listError, setListError] = useState<string>(); const [editing, setEditing] = useState<Model | "new">();
  const load = useCallback(async () => { setLoading(true); setListError(undefined); try { const result = await api.modelList(params); setRows(result.items); setTotal(result.total); } catch (error) { setListError(error instanceof Error ? error.message : String(error)); } finally { setLoading(false); } }, [api, params]);
  useEffect(() => { queueMicrotask(() => void load()); }, [load]);
  useEffect(() => { void api.providerList({ pageNum: 1, pageSize: 100 }).then((result) => setProviders(result.items)); }, [api]);
  async function remove(row: Model) { await api.modelDelete(row.id); Toast.success(host.t("pages.common.deleteSuccess")); await load(); }
  function renderActions(row: Model) { return <Space>{hasPermission(host.permissions, "ai:provider:update") ? <Button onClick={() => setEditing(row)} theme="borderless">{host.t("pages.common.edit")}</Button> : null}{hasPermission(host.permissions, "ai:provider:delete") ? <Popconfirm content={host.t("plugin.linapro-ai-core.common.deleteConfirm")} onConfirm={() => void remove(row)}><Button theme="borderless" type="danger">{host.t("pages.common.delete")}</Button></Popconfirm> : null}</Space>; }
  const columns: ColumnProps<Model>[] = [
    { dataIndex: "modelName", title: host.t("plugin.linapro-ai-core.model.fields.modelName"), width: 220 }, { dataIndex: "providerName", title: host.t("plugin.linapro-ai-core.model.fields.provider"), width: 160 },
    { dataIndex: "protocol", render: (value) => protocolLabel(String(value)), title: host.t("plugin.linapro-ai-core.model.fields.protocol"), width: 150 }, { dataIndex: "endpointBaseUrl", render: (value) => <span className="ai-core-mono">{String(value || "-")}</span>, title: host.t("plugin.linapro-ai-core.model.fields.endpoint"), width: 300 },
    { dataIndex: "enabled", render: (value) => <Tag color={value === 1 ? "green" : "grey"}>{host.t(value === 1 ? "plugin.linapro-ai-core.common.enabled" : "plugin.linapro-ai-core.common.disabled")}</Tag>, title: host.t("pages.common.status"), width: 100 },
    { render: (_, row) => renderActions(row), title: host.t("pages.common.actions"), width: 180 },
  ];
  return <section className="ai-core-page" data-testid="ai-model-management-page"><header className="ai-core-page-header"><Typography.Title heading={3}>{host.t("plugin.linapro-ai-core.model.tableTitle")}</Typography.Title></header><Card><Form<ModelListParams> className="ai-core-search-form" layout="horizontal" onSubmit={(values) => setParams((current) => ({ ...current, ...compactFilters(values), pageNum: 1 }))}><Form.Input field="keyword" label={host.t("plugin.linapro-ai-core.model.fields.modelName")} /><Form.Select field="providerId" label={host.t("plugin.linapro-ai-core.model.fields.provider")} optionList={providers.map((item) => ({ label: item.name, value: item.id }))} /><Form.Select field="enabled" label={host.t("pages.common.status")} optionList={[{ label: host.t("plugin.linapro-ai-core.common.enabled"), value: 1 }, { label: host.t("plugin.linapro-ai-core.common.disabled"), value: 0 }]} /><Button htmlType="submit" theme="solid" type="primary">{host.t("pages.common.search")}</Button></Form></Card><Card><div className="ai-core-toolbar">{hasPermission(host.permissions, "ai:provider:create") ? <Button onClick={() => setEditing("new")} theme="solid" type="primary">{host.t("plugin.linapro-ai-core.model.actions.addModel")}</Button> : <span />}</div><div className="responsive-desktop-table" data-testid="ai-model-table">{loading || listError || !rows.length ? <ListFeedback empty={!rows.length} error={listError} loading={loading} onRetry={() => void load()} t={host.t} /> : <Table<Model> columns={columns} dataSource={rows} pagination={{ currentPage: params.pageNum, onChange: (pageNum) => setParams((current) => ({ ...current, pageNum })), pageSize: params.pageSize, total }} rowKey="id" scroll={{ x: 1150 }} />}</div><MobileRecordList testId="ai-model-mobile-list">{rows.map((row) => <MobileRecordCard key={row.id} testId={`ai-model-mobile-card-${row.id}`}><MobileRecordTitle>{row.modelName}</MobileRecordTitle><MobileRecordFields><MobileRecordField label={host.t("plugin.linapro-ai-core.model.fields.provider")} value={row.providerName || "-"} /><MobileRecordField label={host.t("plugin.linapro-ai-core.model.fields.protocol")} value={protocolLabel(row.protocol)} /><MobileRecordField label={host.t("plugin.linapro-ai-core.model.fields.endpoint")} value={row.endpointBaseUrl || "-"} /><MobileRecordField label={host.t("pages.common.status")} value={<Tag color={row.enabled === 1 ? "green" : "grey"}>{host.t(row.enabled === 1 ? "plugin.linapro-ai-core.common.enabled" : "plugin.linapro-ai-core.common.disabled")}</Tag>} /></MobileRecordFields><MobileRecordActions>{renderActions(row)}</MobileRecordActions></MobileRecordCard>)}</MobileRecordList></Card><ModelSideSheet api={api} model={editing === "new" ? undefined : editing} onClose={() => setEditing(undefined)} onSaved={load} open={editing !== undefined} t={host.t} /></section>;
}
