import Descriptions from "@douyinfe/semi-ui/lib/es/descriptions";
import SideSheet from "@douyinfe/semi-ui/lib/es/sideSheet";
import Tag from "@douyinfe/semi-ui/lib/es/tag";

import type { Invocation } from "./ai-client";
import { formatTimestamp, joinCapabilityMethod, protocolLabel, tierCodeLabel, type Translate } from "./ai-data";
import "./ai-core.css";

export function InvocationDetailSideSheet({ locale, onClose, open, record, t }: { locale: string; onClose(): void; open: boolean; record?: Invocation; t: Translate }) {
  const data = record ? [
    { key: t("plugin.linapro-ai-core.invocation.fields.requestId"), value: record.requestId || "-" },
    { key: t("plugin.linapro-ai-core.invocation.fields.purpose"), value: record.purpose || "-" },
    { key: t("plugin.linapro-ai-core.invocation.fields.method"), value: joinCapabilityMethod(record.capabilityType, record.capabilityMethod) },
    { key: t("plugin.linapro-ai-core.invocation.fields.status"), value: <Tag color={record.status === "success" ? "green" : "red"}>{t(record.status === "success" ? "plugin.linapro-ai-core.common.success" : "plugin.linapro-ai-core.common.failed")}</Tag> },
    { key: t("plugin.linapro-ai-core.invocation.fields.tierCode"), value: record.tierCode ? tierCodeLabel(t, record.tierCode) : "-" },
    { key: t("plugin.linapro-ai-core.invocation.fields.providerName"), value: record.providerName || "-" },
    { key: t("plugin.linapro-ai-core.invocation.fields.modelName"), value: record.modelName || "-" },
    { key: t("plugin.linapro-ai-core.model.fields.protocol"), value: protocolLabel(record.protocol) },
    { key: t("plugin.linapro-ai-core.tier.fields.defaultEffort"), value: record.thinkingEffort || "-" },
    { key: t("plugin.linapro-ai-core.invocation.fields.tokens"), value: `${record.inputTokens} / ${record.outputTokens}` },
    { key: t("plugin.linapro-ai-core.invocation.fields.latencyMs"), value: record.latencyMs },
    { key: t("plugin.linapro-ai-core.invocation.fields.assetSummaryJson"), value: <pre className="ai-core-json">{record.assetSummaryJson || "{}"}</pre> },
    { key: t("plugin.linapro-ai-core.invocation.fields.operationSummaryJson"), value: <pre className="ai-core-json">{record.operationSummaryJson || "{}"}</pre> },
    { key: t("plugin.linapro-ai-core.invocation.fields.metadataSummaryJson"), value: <pre className="ai-core-json">{record.metadataSummaryJson || "{}"}</pre> },
    { key: t("plugin.linapro-ai-core.invocation.fields.errorCode"), value: record.errorCode || "-" },
    { key: t("plugin.linapro-ai-core.invocation.fields.errorSummary"), value: record.errorSummary || "-" },
    { key: t("pages.common.createdAt"), value: formatTimestamp(record.createdAt, locale) },
  ] : [];
  return <SideSheet closable onCancel={onClose} title={t("plugin.linapro-ai-core.invocation.drawer.detailTitle")} visible={open} width={680}>{record ? <Descriptions column={1} data={data} size="small" /> : null}</SideSheet>;
}
