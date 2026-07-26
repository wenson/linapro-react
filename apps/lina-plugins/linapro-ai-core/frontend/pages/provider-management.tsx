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

import { createAiCoreApi, type Provider, type ProviderListParams } from "./ai-client";
import { hasPermission } from "./ai-data";
import { EndpointSideSheet } from "./endpoint-side-sheet";
import { ListFeedback } from "./list-feedback";
import { ModelSideSheet } from "./model-side-sheet";
import { ProviderSideSheet } from "./provider-side-sheet";
import "./ai-core.css";

export default function ProviderManagement() {
  const host = useLinaPluginHost();
  const api = useMemo(() => createAiCoreApi(host.api), [host.api]);
  const [params, setParams] = useState<ProviderListParams>({ pageNum: 1, pageSize: 10 });
  const [rows, setRows] = useState<Provider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string>();
  const [providerId, setProviderId] = useState<number | "new">();
  const [endpointProvider, setEndpointProvider] = useState<Provider>();
  const [modelProviderId, setModelProviderId] = useState<number>();
  const load = useCallback(async () => {
    setLoading(true); setListError(undefined); try { const result = await api.providerList(params); setRows(result.items); setTotal(result.total); } catch (error) { setListError(error instanceof Error ? error.message : String(error)); } finally { setLoading(false); }
  }, [api, params]);
  useEffect(() => { queueMicrotask(() => void load()); }, [load]);
  async function remove(row: Provider) {
    try {
      await api.providerDelete(row.id);
      Toast.success(host.t("pages.common.deleteSuccess"));
      await load();
    } catch (error) {
      Toast.error(error instanceof Error ? error.message : String(error));
    }
  }
  async function sync(row: Provider) { const result = await api.modelSync(row.id); Toast.success(host.t("plugin.linapro-ai-core.model.messages.syncDone", result)); await load(); }
  function renderActions(row: Provider) { return <Space wrap>{hasPermission(host.permissions, "ai:provider:update") ? <Button onClick={() => setProviderId(row.id)} theme="borderless">{host.t("pages.common.edit")}</Button> : null}<Button onClick={() => setEndpointProvider(row)} theme="borderless">{host.t("plugin.linapro-ai-core.endpoint.actions.manage")}</Button>{hasPermission(host.permissions, "ai:provider:create") ? <Button onClick={() => setModelProviderId(row.id)} theme="borderless">{host.t("plugin.linapro-ai-core.model.actions.addModel")}</Button> : null}{hasPermission(host.permissions, "ai:provider:update") ? <Button onClick={() => void sync(row)} theme="borderless">{host.t("plugin.linapro-ai-core.model.actions.syncModels")}</Button> : null}{hasPermission(host.permissions, "ai:provider:delete") ? <Popconfirm content={host.t("plugin.linapro-ai-core.common.deleteConfirm")} onConfirm={() => void remove(row)}><Button theme="borderless" type="danger">{host.t("pages.common.delete")}</Button></Popconfirm> : null}</Space>; }
  const columns: ColumnProps<Provider>[] = [
    { dataIndex: "name", title: host.t("plugin.linapro-ai-core.provider.fields.name"), width: 180 },
    { dataIndex: "models", render: (_, row) => row.models?.length ? <Space wrap>{row.models.map((item) => <Tag color={item.enabled === 1 ? "blue" : "grey"} key={item.id}>{item.modelName}</Tag>)}</Space> : <span className="ai-core-muted">{host.t("plugin.linapro-ai-core.provider.empty.noModels")}</span>, title: host.t("plugin.linapro-ai-core.provider.fields.models"), width: 300 },
    { dataIndex: "endpointCount", render: (_, row) => `${row.enabledEndpointCount ?? 0} / ${row.endpointCount ?? 0}`, title: host.t("plugin.linapro-ai-core.provider.fields.endpoint"), width: 110 },
    { dataIndex: "modelCount", render: (_, row) => `${row.enabledModelCount ?? 0} / ${row.modelCount ?? 0}`, title: host.t("plugin.linapro-ai-core.provider.fields.modelCount"), width: 110 },
    { dataIndex: "enabled", render: (value) => <Tag color={value === 1 ? "green" : "grey"}>{host.t(value === 1 ? "plugin.linapro-ai-core.common.enabled" : "plugin.linapro-ai-core.common.disabled")}</Tag>, title: host.t("pages.common.status"), width: 100 },
    { render: (_, row) => renderActions(row), title: host.t("pages.common.actions"), width: 420 },
  ];
  return <section className="ai-core-page" data-testid="ai-provider-management-page">
    <header className="ai-core-page-header"><Typography.Title heading={3}>{host.t("plugin.linapro-ai-core.provider.tableTitle")}</Typography.Title></header>
    <Card><Form<ProviderListParams> className="ai-core-search-form" layout="horizontal" onSubmit={(values) => setParams((current) => ({ ...current, ...values, pageNum: 1 }))}><Form.Input field="keyword" label={host.t("plugin.linapro-ai-core.provider.fields.keyword")} /><Form.Select field="enabled" label={host.t("pages.common.status")} optionList={[{ label: host.t("plugin.linapro-ai-core.common.enabled"), value: 1 }, { label: host.t("plugin.linapro-ai-core.common.disabled"), value: 0 }]} /><Button htmlType="submit" theme="solid" type="primary">{host.t("pages.common.search")}</Button></Form></Card>
    <Card><div className="ai-core-toolbar"><Space>{hasPermission(host.permissions, "ai:provider:create") ? <><Button onClick={() => setProviderId("new")} theme="solid" type="primary">{host.t("plugin.linapro-ai-core.provider.actions.addProvider")}</Button><Button onClick={() => setModelProviderId(0)}>{host.t("plugin.linapro-ai-core.model.actions.addModel")}</Button></> : null}</Space></div><div className="responsive-desktop-table" data-testid="ai-provider-table">{loading || listError || !rows.length ? <ListFeedback empty={!rows.length} error={listError} loading={loading} onRetry={() => void load()} t={host.t} /> : <Table<Provider> columns={columns} dataSource={rows} pagination={{ currentPage: params.pageNum, onChange: (pageNum) => setParams((current) => ({ ...current, pageNum })), pageSize: params.pageSize, total }} rowKey="id" scroll={{ x: 1250 }} />}</div><MobileRecordList testId="ai-provider-mobile-list">{rows.map((row) => <MobileRecordCard key={row.id} testId={`ai-provider-mobile-card-${row.id}`}><MobileRecordTitle>{row.name}</MobileRecordTitle><MobileRecordFields><MobileRecordField label={host.t("plugin.linapro-ai-core.provider.fields.endpoint")} value={`${row.enabledEndpointCount ?? 0} / ${row.endpointCount ?? 0}`} /><MobileRecordField label={host.t("plugin.linapro-ai-core.provider.fields.modelCount")} value={`${row.enabledModelCount ?? 0} / ${row.modelCount ?? 0}`} /><MobileRecordField label={host.t("pages.common.status")} value={<Tag color={row.enabled === 1 ? "green" : "grey"}>{host.t(row.enabled === 1 ? "plugin.linapro-ai-core.common.enabled" : "plugin.linapro-ai-core.common.disabled")}</Tag>} /></MobileRecordFields><MobileRecordActions>{renderActions(row)}</MobileRecordActions></MobileRecordCard>)}</MobileRecordList></Card>
    <ProviderSideSheet api={api} onClose={() => setProviderId(undefined)} onSaved={load} open={providerId !== undefined} providerId={providerId === "new" ? undefined : providerId} t={host.t} />
    <EndpointSideSheet api={api} onClose={() => setEndpointProvider(undefined)} onSaved={load} open={Boolean(endpointProvider)} providerId={endpointProvider?.id} providerName={endpointProvider?.name} t={host.t} />
    <ModelSideSheet api={api} initialProviderId={modelProviderId || undefined} onClose={() => setModelProviderId(undefined)} onSaved={load} open={modelProviderId !== undefined} t={host.t} />
  </section>;
}
