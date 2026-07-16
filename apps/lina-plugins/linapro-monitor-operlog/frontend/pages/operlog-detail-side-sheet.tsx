import Descriptions from "@douyinfe/semi-ui/lib/es/descriptions";
import SideSheet from "@douyinfe/semi-ui/lib/es/sideSheet";
import Tag from "@douyinfe/semi-ui/lib/es/tag";

import { dictColor, dictLabel, formatTimestamp, parseJson } from "./data";
import type { DictOption, OperLog } from "./operlog-client";

type Translate = (key: string, options?: Record<string, unknown>) => string;

function jsonValue(value: string) {
  const parsed = parseJson(value);
  return parsed ? <pre className="monitor-operlog-json">{JSON.stringify(parsed, null, 2)}</pre> : value;
}

export function OperLogDetailSideSheet({ locale, onClose, open, record, statuses, t, types }: {
  locale: string;
  onClose(): void;
  open: boolean;
  record?: OperLog;
  statuses: DictOption[];
  t: Translate;
  types: DictOption[];
}) {
  const data = record ? [
    { key: t("plugin.linapro-monitor-operlog.fields.logId"), value: record.id },
    { key: t("plugin.linapro-monitor-operlog.fields.operResult"), value: <Tag color={dictColor(statuses, record.status)}>{dictLabel(statuses, record.status)}</Tag> },
    { key: t("plugin.linapro-monitor-operlog.fields.moduleName"), value: record.title },
    { key: t("plugin.linapro-monitor-operlog.fields.operSummary"), value: record.operSummary },
    { key: t("plugin.linapro-monitor-operlog.fields.operType"), value: <Tag color={dictColor(types, record.operType)}>{dictLabel(types, record.operType)}</Tag> },
    { key: t("plugin.linapro-monitor-operlog.fields.operator"), value: record.operName },
    { key: t("plugin.linapro-monitor-operlog.fields.requestMethod"), value: record.requestMethod },
    { key: t("plugin.linapro-monitor-operlog.fields.requestUrl"), value: record.operUrl },
    { key: t("plugin.linapro-monitor-operlog.fields.ipAddress"), value: record.operIp },
    { hidden: !record.operParam, key: t("plugin.linapro-monitor-operlog.fields.requestParams"), value: jsonValue(record.operParam) },
    { hidden: !record.jsonResult, key: t("plugin.linapro-monitor-operlog.fields.responseResult"), value: jsonValue(record.jsonResult) },
    { hidden: !record.errorMsg, key: t("plugin.linapro-monitor-operlog.fields.errorInfo"), value: <span className="monitor-operlog-error">{record.errorMsg}</span> },
    { key: t("plugin.linapro-monitor-operlog.fields.duration"), value: `${record.costTime} ms` },
    { key: t("plugin.linapro-monitor-operlog.fields.operTime"), value: formatTimestamp(record.operTime, locale) },
  ] : [];

  return <SideSheet className="monitor-operlog-detail" closable onCancel={onClose} title={t("plugin.linapro-monitor-operlog.detail.title")} visible={open} width={680}><div data-testid="operlog-detail-side-sheet"><Descriptions column={1} data={data} size="small" /></div></SideSheet>;
}
