import Card from "@douyinfe/semi-ui/lib/es/card";
import Progress from "@douyinfe/semi-ui/lib/es/progress";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Tooltip from "@douyinfe/semi-ui/lib/es/tooltip";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import IconChevronDown from "@douyinfe/semi-icons/lib/es/icons/IconChevronDown";
import IconChevronRight from "@douyinfe/semi-icons/lib/es/icons/IconChevronRight";
import IconHelpCircle from "@douyinfe/semi-icons/lib/es/icons/IconHelpCircle";
import { useLinaPluginHost } from "@linapro/plugin-ui";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { createServerMonitorApi, type ServerDiskInfo, type ServerMonitorResult, type ServerNodeInfo } from "./server-client";
import { formatBytes } from "./server-data";
import "./server-monitor.css";

type Translate = (key: string, options?: Record<string, unknown>) => string;
interface InfoItem { label: string; value: ReactNode }

function formatTimestamp(value: number | null | undefined, locale: string): string { return value ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value)) : "-"; }
function formatRate(bytes: number): string { return `${formatBytes(bytes)}/s`; }
function formatUptime(seconds: number, t: Translate): string { const days = Math.floor(seconds / 86_400); const hours = Math.floor((seconds % 86_400) / 3_600); const minutes = Math.floor((seconds % 3_600) / 60); const output: string[] = []; if (days) output.push(t("plugin.linapro-monitor-server.time.days", { value: days })); if (hours) output.push(t("plugin.linapro-monitor-server.time.hours", { value: hours })); if (minutes) output.push(t("plugin.linapro-monitor-server.time.minutes", { value: minutes })); return output.join(" ") || t("plugin.linapro-monitor-server.time.justStarted"); }
function formatServiceUptime(value: string | undefined, t: Translate): string { const normalized = String(value ?? "").trim(); if (!normalized) return formatUptime(0, t); return /^\d+$/.test(normalized) ? formatUptime(Number(normalized), t) : normalized; }
function progressColor(percent: number): string { return percent >= 90 ? "var(--semi-color-danger)" : percent >= 70 ? "var(--semi-color-warning)" : "var(--semi-color-success)"; }

function InfoGrid({ items }: { items: InfoItem[] }) { return <dl className="monitor-server-info-grid">{items.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>; }

function MetricCard({ items, percent, title }: { items: InfoItem[]; percent: number; title: string }) {
  const normalized = Number(percent.toFixed(1));
  return <div className="monitor-server-metric"><Typography.Title heading={6}>{title}</Typography.Title><div className="monitor-server-metric-body"><Progress aria-label={`${title}: ${normalized}%`} percent={normalized} stroke={progressColor(normalized)} type="circle" width={84} /><InfoGrid items={items} /></div></div>;
}

function NodeDetails({ locale, node, t }: { locale: string; node: ServerNodeInfo; t: Translate }) {
  const cpu = node.cpu; const memory = node.memory; const server = node.server; const goInfo = node.goInfo; const network = node.network;
  const diskColumns: ColumnProps<ServerDiskInfo>[] = [
    { dataIndex: "path", title: t("plugin.linapro-monitor-server.disk.path"), width: 150 },
    { dataIndex: "fsType", title: t("plugin.linapro-monitor-server.disk.fsType"), width: 160 },
    { dataIndex: "total", render: (value) => formatBytes(Number(value)), title: t("plugin.linapro-monitor-server.disk.total"), width: 140 },
    { dataIndex: "used", render: (value) => formatBytes(Number(value)), title: t("plugin.linapro-monitor-server.disk.used"), width: 140 },
    { dataIndex: "free", render: (value) => formatBytes(Number(value)), title: t("plugin.linapro-monitor-server.disk.free"), width: 140 },
    { dataIndex: "usagePercent", render: (value) => { const percent = Number(Number(value).toFixed(1)); return <Progress aria-label={`${t("plugin.linapro-monitor-server.disk.usage")}: ${percent}%`} percent={percent} size="small" stroke={progressColor(percent)} />; }, title: t("plugin.linapro-monitor-server.disk.usage"), width: 220 },
  ];
  return <div className="monitor-server-node-content" data-testid={`server-monitor-node-content-${node.nodeName}`}>
    <section><Typography.Title heading={6}>{t("plugin.linapro-monitor-server.sections.service")}</Typography.Title><InfoGrid items={[
      { label: t("plugin.linapro-monitor-server.fields.goVersion"), value: goInfo?.version ?? "-" }, { label: t("plugin.linapro-monitor-server.fields.goframeVersion"), value: goInfo?.gfVersion ?? "-" }, { label: t("plugin.linapro-monitor-server.fields.goroutines"), value: goInfo?.goroutines ?? "-" }, { label: t("plugin.linapro-monitor-server.fields.gcPause"), value: `${((goInfo?.gcPauseNs ?? 0) / 1_000_000).toFixed(2)} ms` }, { label: t("plugin.linapro-monitor-server.fields.serviceStartTime"), value: formatTimestamp(server?.startTime, locale) }, { label: t("plugin.linapro-monitor-server.fields.serviceUptime"), value: formatServiceUptime(goInfo?.serviceUptime, t) },
    ]} /></section>
    <div className="monitor-server-metrics-grid"><MetricCard items={[{ label: t("plugin.linapro-monitor-server.fields.used"), value: t("plugin.linapro-monitor-server.units.cores", { value: (((goInfo?.processCpu ?? 0) * (cpu?.cores ?? 0)) / 100).toFixed(2) }) }, { label: t("plugin.linapro-monitor-server.fields.totalCores"), value: t("plugin.linapro-monitor-server.units.cores", { value: cpu?.cores ?? 0 }) }]} percent={goInfo?.processCpu ?? 0} title={t("plugin.linapro-monitor-server.sections.processCpu")} /><MetricCard items={[{ label: t("plugin.linapro-monitor-server.fields.used"), value: formatBytes((memory?.total ?? 0) * (goInfo?.processMemory ?? 0) / 100) }, { label: t("plugin.linapro-monitor-server.fields.totalMemory"), value: formatBytes(memory?.total ?? 0) }]} percent={goInfo?.processMemory ?? 0} title={t("plugin.linapro-monitor-server.sections.processMemory")} /></div>
    <section><Typography.Title heading={6}>{t("plugin.linapro-monitor-server.sections.basicInfo")}</Typography.Title><InfoGrid items={[
      { label: t("plugin.linapro-monitor-server.fields.hostname"), value: server?.hostname ?? "-" }, { label: t("plugin.linapro-monitor-server.fields.os"), value: server?.os ?? "-" }, { label: t("plugin.linapro-monitor-server.fields.arch"), value: server?.arch ?? "-" }, { label: t("plugin.linapro-monitor-server.fields.nodeIp"), value: node.nodeIp }, { label: t("plugin.linapro-monitor-server.fields.systemUptime"), value: formatUptime(server?.uptime ?? 0, t) }, { label: t("plugin.linapro-monitor-server.fields.bootTime"), value: formatTimestamp(server?.bootTime, locale) }, { label: t("plugin.linapro-monitor-server.fields.collectAt"), value: formatTimestamp(node.collectAt, locale) },
    ]} /></section>
    <div className="monitor-server-metrics-grid"><MetricCard items={[{ label: t("plugin.linapro-monitor-server.fields.cores"), value: t("plugin.linapro-monitor-server.units.cores", { value: cpu?.cores ?? 0 }) }, { label: t("plugin.linapro-monitor-server.fields.model"), value: cpu?.modelName ?? "-" }]} percent={cpu?.usagePercent ?? 0} title={t("plugin.linapro-monitor-server.sections.systemCpu")} /><MetricCard items={[{ label: t("plugin.linapro-monitor-server.fields.usedAndTotal"), value: `${formatBytes(memory?.used ?? 0)} / ${formatBytes(memory?.total ?? 0)}` }, { label: t("plugin.linapro-monitor-server.fields.free"), value: formatBytes(memory?.available ?? 0) }]} percent={memory?.usagePercent ?? 0} title={t("plugin.linapro-monitor-server.sections.systemMemory")} /></div>
    <section><Typography.Title heading={6}>{t("plugin.linapro-monitor-server.sections.disk")}</Typography.Title><div className="server-monitor-disk-table" data-testid="server-monitor-disk-table"><Table<ServerDiskInfo> columns={diskColumns} dataSource={node.disks ?? []} pagination={false} rowKey="path" scroll={{ x: 950 }} size="small" /></div></section>
    <section><Typography.Title heading={6}>{t("plugin.linapro-monitor-server.sections.network")}</Typography.Title><InfoGrid items={[{ label: t("plugin.linapro-monitor-server.fields.bytesSent"), value: formatBytes(network?.bytesSent ?? 0) }, { label: t("plugin.linapro-monitor-server.fields.bytesRecv"), value: formatBytes(network?.bytesRecv ?? 0) }, { label: t("plugin.linapro-monitor-server.fields.sendRate"), value: formatRate(network?.sendRate ?? 0) }, { label: t("plugin.linapro-monitor-server.fields.recvRate"), value: formatRate(network?.recvRate ?? 0) }]} /></section>
  </div>;
}

export default function ServerMonitor() {
  const host = useLinaPluginHost(); const api = useMemo(() => createServerMonitorApi(host.api), [host.api]); const [data, setData] = useState<ServerMonitorResult>({ dbInfo: null, nodes: [] }); const [loading, setLoading] = useState(false); const [expanded, setExpanded] = useState<Set<string>>(new Set()); const initialized = useRef(false);
  const load = useCallback(async () => { setLoading(true); try { const result = await api.get(); setData({ dbInfo: result.dbInfo ?? null, nodes: result.nodes ?? [] }); if (!initialized.current) { initialized.current = true; setExpanded(new Set((result.nodes ?? []).map((node) => `${node.nodeName}|${node.nodeIp}`))); } } catch (error) { Toast.error(error instanceof Error ? error.message : String(error)); } finally { setLoading(false); } }, [api]);
  useEffect(() => { let timer: ReturnType<typeof setInterval> | undefined; const stop = () => { if (timer) clearInterval(timer); timer = undefined; }; const start = () => { stop(); if (document.visibilityState === "visible") { void load(); timer = setInterval(() => void load(), 30_000); } }; const onVisibility = () => start(); start(); document.addEventListener("visibilitychange", onVisibility); return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); }; }, [load]);
  function toggle(key: string): void { setExpanded((current) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; }); }
  return <section className="monitor-server-page" data-testid="server-monitor-page"><Typography.Title heading={3}>{host.t("plugin.linapro-monitor-server.name")}</Typography.Title>{loading && data.nodes.length === 0 ? <div className="monitor-server-loading"><Spin aria-label={host.t("pages.common.loading")} /></div> : data.nodes.length === 0 ? <Card><Typography.Text type="tertiary">{host.t("plugin.linapro-monitor-server.messages.empty")}</Typography.Text></Card> : <>
    {data.dbInfo ? <Card title={host.t("plugin.linapro-monitor-server.sections.database")}><InfoGrid items={[{ label: host.t("plugin.linapro-monitor-server.fields.dbVersion"), value: data.dbInfo.version }, { label: host.t("plugin.linapro-monitor-server.fields.maxConnections"), value: data.dbInfo.maxOpenConns }, { label: host.t("plugin.linapro-monitor-server.fields.openConnections"), value: data.dbInfo.openConns }, { label: host.t("plugin.linapro-monitor-server.fields.inUseIdle"), value: `${data.dbInfo.inUse} / ${data.dbInfo.idle}` }]} /></Card> : null}
    <Card title={<span className="monitor-server-card-title">{host.t("plugin.linapro-monitor-server.sections.server")}<Tooltip content={host.t("plugin.linapro-monitor-server.messages.multiNodeHint")}><IconHelpCircle aria-label={host.t("plugin.linapro-monitor-server.messages.multiNodeHint")} /></Tooltip></span>}>{data.nodes.map((node) => { const key = `${node.nodeName}|${node.nodeIp}`; const open = expanded.has(key); return <article className="monitor-server-node" key={key}><button aria-expanded={open} className="monitor-server-node-toggle" data-testid={`server-monitor-node-toggle-${node.nodeName}`} onClick={() => toggle(key)} type="button">{open ? <IconChevronDown aria-hidden /> : <IconChevronRight aria-hidden />}<strong>{node.nodeName}</strong><span>({node.nodeIp})</span></button>{open ? <NodeDetails locale={host.locale} node={node} t={host.t} /> : null}</article>; })}</Card>
  </>}</section>;
}
