import Banner from "@douyinfe/semi-ui/lib/es/banner";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Tabs from "@douyinfe/semi-ui/lib/es/tabs";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useLinaPluginHost } from "@linapro/plugin-ui";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createAiCoreApi, type Tier, type TierTestResult } from "./ai-client";
import { capabilityTypeLabel, defaultTierCapabilityMethod, formatLatencyMs, hasPermission, protocolLabel, tierCapabilityTypeKeys, tierCodeLabel } from "./ai-data";
import { TierSideSheet } from "./tier-side-sheet";
import { ListFeedback } from "./list-feedback";
import "./ai-core.css";

export default function TierManagement() {
  const host = useLinaPluginHost(); const api = useMemo(() => createAiCoreApi(host.api), [host.api]); const [capabilityType, setCapabilityType] = useState("text"); const [rows, setRows] = useState<Tier[]>([]); const [loading, setLoading] = useState(false); const [listError, setListError] = useState<string>(); const [editing, setEditing] = useState<Tier>(); const [testing, setTesting] = useState<string>(); const [testResult, setTestResult] = useState<TierTestResult>();
  const load = useCallback(async () => { setLoading(true); setListError(undefined); try { setRows(await api.tierList(capabilityType, defaultTierCapabilityMethod(capabilityType))); } catch (error) { setListError(error instanceof Error ? error.message : String(error)); } finally { setLoading(false); } }, [api, capabilityType]); useEffect(() => { queueMicrotask(() => void load()); }, [load]);
  async function test(row: Tier) { setTesting(row.code); try { const result = await api.tierTest(row.code, { capabilityMethod: row.capabilityMethod, capabilityType: row.capabilityType, maxOutputTokens: 128 }); setTestResult(result); const text = result.errorSummary || host.t(result.status === "success" ? "plugin.linapro-ai-core.tier.messages.testSuccess" : "plugin.linapro-ai-core.tier.messages.testFailed"); (result.status === "success" ? Toast.success : Toast.error)(`${text} (${formatLatencyMs(result.latencyMs)})`); await load(); } finally { setTesting(undefined); } }
  const columns: ColumnProps<Tier>[] = [
    { dataIndex: "code", render: (value) => tierCodeLabel(host.t, String(value)), title: host.t("plugin.linapro-ai-core.tier.fields.displayName"), width: 130 }, { dataIndex: "description", render: (value) => <div className="ai-core-tier-description">{String(value || "-")}</div>, title: host.t("plugin.linapro-ai-core.common.description"), width: 360 },
    { dataIndex: "binding", render: (_, row) => row.binding ? row.binding.providerName : "-", title: host.t("plugin.linapro-ai-core.tier.fields.provider"), width: 160 }, { dataIndex: "binding", render: (_, row) => row.binding ? row.binding.modelName : "-", title: host.t("plugin.linapro-ai-core.tier.fields.model"), width: 180 },
    { dataIndex: "binding", render: (_, row) => row.binding ? protocolLabel(row.binding.protocol) : "-", title: host.t("plugin.linapro-ai-core.model.fields.protocol"), width: 140 }, { dataIndex: "enabled", render: (value) => <Tag color={value === 1 ? "green" : "grey"}>{host.t(value === 1 ? "plugin.linapro-ai-core.common.enabled" : "plugin.linapro-ai-core.common.disabled")}</Tag>, title: host.t("pages.common.status"), width: 100 },
    { dataIndex: "lastTestStatus", render: (value, row) => value ? <Tag color={value === "success" ? "green" : "red"}>{String(value)} · {formatLatencyMs(row.lastTestLatencyMs)}</Tag> : "-", title: host.t("plugin.linapro-ai-core.tier.fields.lastTestStatus"), width: 160 },
    { fixed: "right", render: (_, row) => <Space>{hasPermission(host.permissions, "ai:tier:update") ? <Button onClick={() => setEditing(row)} theme="borderless">{host.t("pages.common.edit")}</Button> : null}{hasPermission(host.permissions, "ai:tier:test") ? <Button disabled={Boolean(testing)} loading={testing === row.code} onClick={() => void test(row)} theme="borderless">{host.t("plugin.linapro-ai-core.tier.actions.testSaved")}</Button> : null}</Space>, title: host.t("pages.common.actions"), width: 170 },
  ];
  return <section className="ai-core-page" data-testid="ai-tier-management-page"><header className="ai-core-page-header"><Typography.Title heading={3}>{host.t("plugin.linapro-ai-core.tier.tableTitle")}</Typography.Title></header><Card><Tabs activeKey={capabilityType} data-testid="ai-tier-capability-tabs" onChange={(value) => { setCapabilityType(value); setTestResult(undefined); }} type="line">{tierCapabilityTypeKeys.map((type) => <Tabs.TabPane itemKey={type} key={type} tab={<span data-testid={`ai-tier-capability-tab-${type}`}><span aria-hidden="true" className="ai-core-tier-tab-mark" data-testid={`ai-tier-capability-tab-icon-${type}`} />{capabilityTypeLabel(host.t, type)}</span>} />)}</Tabs>{testResult ? <Banner data-testid="ai-tier-saved-test-result" description={`${testResult.errorSummary || host.t(testResult.status === "success" ? "plugin.linapro-ai-core.tier.messages.testSuccess" : "plugin.linapro-ai-core.tier.messages.testFailed")} (${formatLatencyMs(testResult.latencyMs)})`} type={testResult.status === "success" ? "success" : "danger"} /> : null}<div data-testid="ai-tier-capability-content"><div data-testid="ai-tier-table">{loading || listError || !rows.length ? <ListFeedback empty={!rows.length} error={listError} loading={loading} onRetry={() => void load()} t={host.t} /> : <Table<Tier> columns={columns} dataSource={rows} pagination={false} rowKey="code" scroll={{ x: 1400 }} />}</div></div></Card><TierSideSheet api={api} onClose={() => setEditing(undefined)} onSaved={load} open={Boolean(editing)} t={host.t} tier={editing} /></section>;
}
