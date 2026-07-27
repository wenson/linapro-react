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
import { MobileRecordActions, MobileRecordCard, MobileRecordField, MobileRecordFields, MobileRecordList, MobileRecordTitle, ResponsiveListFeedback, useLinaPluginHost } from "@linapro/plugin-ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createAiCoreApi, type Tier, type TierTestResult } from "./ai-client";
import { capabilityTypeLabel, defaultTierCapabilityMethod, effortLabel, formatLatencyMs, hasPermission, protocolLabel, tierCapabilityTypeKeys, tierCodeLabel, tierDescription, tierTestStatusLabel } from "./ai-data";
import { TierSideSheet } from "./tier-side-sheet";
import "./ai-core.css";

export default function TierManagement() {
  const host = useLinaPluginHost(); const api = useMemo(() => createAiCoreApi(host.api), [host.api]); const [capabilityType, setCapabilityType] = useState("text"); const [rows, setRows] = useState<Tier[]>([]); const [loading, setLoading] = useState(false); const [listError, setListError] = useState<string>(); const [editing, setEditing] = useState<Tier>(); const [testing, setTesting] = useState<string>(); const [testResult, setTestResult] = useState<TierTestResult>(); const requestVersion = useRef(0);
  const load = useCallback(async () => { const version = ++requestVersion.current; setLoading(true); setListError(undefined); setRows([]); try { const nextRows = await api.tierList(capabilityType, defaultTierCapabilityMethod(capabilityType)); if (version === requestVersion.current) setRows(nextRows); } catch (error) { if (version === requestVersion.current) setListError(error instanceof Error ? error.message : String(error)); } finally { if (version === requestVersion.current) setLoading(false); } }, [api, capabilityType]); useEffect(() => { queueMicrotask(() => void load()); }, [load]);
  async function test(row: Tier) { setTesting(row.code); try { const result = await api.tierTest(row.code, { capabilityMethod: row.capabilityMethod, capabilityType: row.capabilityType, maxOutputTokens: 128 }); setTestResult(result); const text = result.errorSummary || host.t(result.status === "success" ? "plugin.linapro-ai-core.tier.messages.testSuccess" : "plugin.linapro-ai-core.tier.messages.testFailed"); (result.status === "success" ? Toast.success : Toast.error)(`${text} (${formatLatencyMs(result.latencyMs)})`); await load(); } finally { setTesting(undefined); } }
  function renderActions(row: Tier) { return <Space>{hasPermission(host.permissions, "ai:tier:update") ? <Button onClick={() => setEditing(row)} theme="borderless">{host.t("pages.common.edit")}</Button> : null}{hasPermission(host.permissions, "ai:tier:test") ? <Button disabled={Boolean(testing)} loading={testing === row.code} onClick={() => void test(row)} theme="borderless">{host.t("plugin.linapro-ai-core.tier.actions.testSaved")}</Button> : null}</Space>; }
  const columns: ColumnProps<Tier>[] = [
    { dataIndex: "code", render: (value) => tierCodeLabel(host.t, String(value)), title: host.t("plugin.linapro-ai-core.tier.fields.displayName"), width: 130 }, { dataIndex: "description", render: (_, row) => <div className="ai-core-tier-description">{tierDescription(host.t, row)}</div>, title: host.t("plugin.linapro-ai-core.common.description"), width: 360 },
    { dataIndex: "binding", key: "binding-provider", render: (_, row) => row.binding ? row.binding.providerName : "-", title: host.t("plugin.linapro-ai-core.tier.fields.provider"), width: 160 }, { dataIndex: "binding", key: "binding-model", render: (_, row) => row.binding ? row.binding.modelName : "-", title: host.t("plugin.linapro-ai-core.tier.fields.model"), width: 180 },
    { dataIndex: "binding", key: "binding-protocol", render: (_, row) => row.binding ? protocolLabel(row.binding.protocol) : "-", title: host.t("plugin.linapro-ai-core.model.fields.protocol"), width: 140 }, { dataIndex: "enabled", render: (value) => <Tag color={value === 1 ? "green" : "grey"}>{host.t(value === 1 ? "plugin.linapro-ai-core.common.enabled" : "plugin.linapro-ai-core.common.disabled")}</Tag>, title: host.t("pages.common.status"), width: 100 },
    { dataIndex: "defaultEffort", render: (value) => effortLabel(host.t, String(value || "")), title: host.t("plugin.linapro-ai-core.tier.fields.defaultEffort"), width: 130 },
    { dataIndex: "lastTestStatus", render: (value, row) => value ? <Tag color={value === "success" ? "green" : "red"}>{tierTestStatusLabel(host.t, String(value))} · {formatLatencyMs(row.lastTestLatencyMs)}</Tag> : "-", title: host.t("plugin.linapro-ai-core.tier.fields.lastTestStatus"), width: 160 },
    { fixed: "right", render: (_, row) => renderActions(row), title: host.t("pages.common.actions"), width: 170 },
  ];
  return <section className="ai-core-page" data-testid="ai-tier-management-page">
    <header className="ai-core-page-header"><Typography.Title heading={3}>{host.t("plugin.linapro-ai-core.tier.tableTitle")}</Typography.Title></header>
    <Card>
      <Tabs activeKey={capabilityType} data-testid="ai-tier-capability-tabs" onChange={(value) => { requestVersion.current += 1; setRows([]); setListError(undefined); setLoading(true); setCapabilityType(value); setTestResult(undefined); }} type="line">{tierCapabilityTypeKeys.map((type) => <Tabs.TabPane itemKey={type} key={type} tab={<span data-testid={`ai-tier-capability-tab-${type}`}>{capabilityTypeLabel(host.t, type)}</span>} />)}</Tabs>
      {testResult ? <Banner data-testid="ai-tier-saved-test-result" description={`${testResult.errorSummary || host.t(testResult.status === "success" ? "plugin.linapro-ai-core.tier.messages.testSuccess" : "plugin.linapro-ai-core.tier.messages.testFailed")} (${formatLatencyMs(testResult.latencyMs)})`} type={testResult.status === "success" ? "success" : "danger"} /> : null}
      <div data-testid="ai-tier-capability-content">
        <ResponsiveListFeedback empty={!rows.length} emptyLabel={host.t("pages.common.emptyList")} error={Boolean(listError)} errorDetail={listError} errorLabel={host.t("pages.common.loadFailed")} loading={loading} loadingLabel={host.t("pages.common.loading")} onRetry={() => void load()} retryLabel={host.t("fallback.retry")} testId="ai-tier-list-feedback" />
        {!loading && !listError && rows.length ? <>
          <div className="responsive-desktop-table" data-testid="ai-tier-table"><Table<Tier> columns={columns} dataSource={rows} pagination={false} rowKey="code" scroll={{ x: 1400 }} /></div>
          <MobileRecordList testId="ai-tier-mobile-list">{rows.map((row) => <MobileRecordCard key={row.code} testId={`ai-tier-mobile-card-${row.code}`}><MobileRecordTitle>{tierCodeLabel(host.t, row.code)}</MobileRecordTitle><MobileRecordFields><MobileRecordField label={host.t("plugin.linapro-ai-core.common.description")} value={tierDescription(host.t, row)} /><MobileRecordField label={host.t("plugin.linapro-ai-core.tier.fields.provider")} value={row.binding?.providerName || "-"} /><MobileRecordField label={host.t("plugin.linapro-ai-core.tier.fields.model")} value={row.binding?.modelName || "-"} /><MobileRecordField label={host.t("pages.common.status")} value={<Tag color={row.enabled === 1 ? "green" : "grey"}>{host.t(row.enabled === 1 ? "plugin.linapro-ai-core.common.enabled" : "plugin.linapro-ai-core.common.disabled")}</Tag>} /><MobileRecordField label={host.t("plugin.linapro-ai-core.tier.fields.lastTestStatus")} value={row.lastTestStatus ? `${tierTestStatusLabel(host.t, row.lastTestStatus)} · ${formatLatencyMs(row.lastTestLatencyMs)}` : "-"} /></MobileRecordFields><MobileRecordActions>{renderActions(row)}</MobileRecordActions></MobileRecordCard>)}</MobileRecordList>
        </> : null}
      </div>
    </Card>
    <TierSideSheet api={api} onClose={() => setEditing(undefined)} onSaved={load} open={Boolean(editing)} t={host.t} tier={editing} />
  </section>;
}
