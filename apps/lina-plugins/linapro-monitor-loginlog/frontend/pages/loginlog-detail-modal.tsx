import Descriptions from "@douyinfe/semi-ui/lib/es/descriptions";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Tag from "@douyinfe/semi-ui/lib/es/tag";

import { dictColor, dictLabel, formatTimestamp } from "./data";
import type { DictOption, LoginLog } from "./loginlog-client";

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function LoginLogDetailModal({ locale, onClose, open, record, statuses, t }: {
  locale: string;
  onClose(): void;
  open: boolean;
  record?: LoginLog;
  statuses: DictOption[];
  t: Translate;
}) {
  const data = record ? [
    { key: t("plugin.linapro-monitor-loginlog.fields.userName"), value: record.userName },
    { key: t("plugin.linapro-monitor-loginlog.fields.status"), value: <Tag color={dictColor(statuses, record.status)}>{dictLabel(statuses, record.status)}</Tag> },
    { key: t("plugin.linapro-monitor-loginlog.fields.ipAddress"), value: record.ip },
    { key: t("plugin.linapro-monitor-loginlog.fields.browser"), value: record.browser },
    { key: t("plugin.linapro-monitor-loginlog.fields.os"), value: record.os },
    { key: t("plugin.linapro-monitor-loginlog.fields.message"), value: <span className={record.status === 0 ? undefined : "monitor-loginlog-error"}>{record.msg}</span> },
    { key: t("plugin.linapro-monitor-loginlog.fields.loginTime"), value: formatTimestamp(record.loginTime, locale) },
  ] : [];

  return <Modal footer={null} onCancel={onClose} title={t("plugin.linapro-monitor-loginlog.detail.title")} visible={open} width="min(560px, calc(100vw - 24px))"><div className="monitor-loginlog-detail" data-testid="loginlog-detail-modal"><Descriptions column={1} data={data} size="small" /></div></Modal>;
}
