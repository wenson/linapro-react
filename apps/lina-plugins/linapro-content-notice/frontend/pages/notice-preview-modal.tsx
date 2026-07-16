import Descriptions from "@douyinfe/semi-ui/lib/es/descriptions";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import { useEffect, useMemo, useState } from "react";

import { dictColor, dictLabel, formatTimestamp, sanitizeNoticeHtml } from "./data";
import type { DictOption, Notice, NoticeApi } from "./notice-client";
import type { Translate } from "./notice-modal";
import "./notice.css";

export function NoticePreviewModal({ api, locale, noticeId, onClose, open, t, typeOptions }: { api: NoticeApi; locale: string; noticeId?: number; onClose(): void; open: boolean; t: Translate; typeOptions: DictOption[] }) {
  const [notice, setNotice] = useState<Notice>(); const [loading, setLoading] = useState(false);
  useEffect(() => { let active = true; if (!open || !noticeId) return () => { active = false; }; queueMicrotask(() => { if (!active) return; setLoading(true); void api.info(noticeId).then((value) => { if (active) setNotice(value); }).catch((error: unknown) => Toast.error(error instanceof Error ? error.message : String(error))).finally(() => { if (active) setLoading(false); }); }); return () => { active = false; }; }, [api, noticeId, open]);
  const html = useMemo(() => sanitizeNoticeHtml(notice?.content || ""), [notice?.content]);
  const data = notice ? [
    { key: t("plugin.linapro-content-notice.fields.type"), value: <Tag color={dictColor(typeOptions, notice.type)}>{dictLabel(typeOptions, notice.type)}</Tag> },
    { key: t("plugin.linapro-content-notice.fields.createdBy"), value: notice.createdByName || "-" },
    { key: t("pages.common.createdAt"), value: formatTimestamp(notice.createdAt, locale) },
  ] : [];
  return <Modal footer={null} onCancel={onClose} title={notice?.title || t("plugin.linapro-content-notice.preview.title")} visible={open} width={800}>{loading ? <Spin aria-label={t("pages.common.loading")} /> : notice ? <div data-testid="notice-preview"><Descriptions data={data} size="small" /><div className="notice-content" dangerouslySetInnerHTML={{ __html: html }} /></div> : null}</Modal>;
}
