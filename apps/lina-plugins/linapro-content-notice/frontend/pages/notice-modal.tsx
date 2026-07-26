import Button from "@douyinfe/semi-ui/lib/es/button";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import type { FormApi } from "@douyinfe/semi-ui/lib/es/form/interface";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import { RichTextEditor } from "@linapro/plugin-ui/rich-text-editor";
import { useEffect, useState } from "react";

import type { DictOption, NoticeApi } from "./notice-client";
import { NoticeAttachmentUpload } from "./notice-upload";
import "./notice.css";

export type Translate = (key: string, options?: Record<string, unknown>) => string;
interface NoticeValues { status?: number; title?: string; type?: number }

export function NoticeModal({ api, noticeId, onClose, onSaved, open, t, typeOptions }: { api: NoticeApi; noticeId?: number; onClose(): void; onSaved(): Promise<void>; open: boolean; t: Translate; typeOptions: DictOption[] }) {
  const [formApi, setFormApi] = useState<FormApi<NoticeValues>>(); const [content, setContent] = useState(""); const [fileIds, setFileIds] = useState<string[]>([]); const [initial, setInitial] = useState<NoticeValues>({ status: 0, title: "", type: 1 }); const [loading, setLoading] = useState(false); const [saving, setSaving] = useState(false);
  useEffect(() => { let active = true; if (!open) return () => { active = false; }; queueMicrotask(() => {
    if (!active) return; setContent(""); setFileIds([]); setInitial({ status: 0, title: "", type: Number(typeOptions[0]?.value || 1) });
    if (!noticeId) return; setLoading(true); void api.info(noticeId).then((record) => { if (!active) return; setInitial({ status: record.status, title: record.title, type: record.type }); setContent(record.content || ""); setFileIds(record.fileIds ? record.fileIds.split(",").filter(Boolean) : []); }).catch((error: unknown) => Toast.error(error instanceof Error ? error.message : String(error))).finally(() => { if (active) setLoading(false); });
  }); return () => { active = false; }; }, [api, noticeId, open, typeOptions]);
  async function uploadImage(file: File) { const result = await api.upload(file, "notice_image"); return result.url; }
  async function save() { if (!formApi) return; const values = await formApi.validate(); if (!content.replace(/<[^>]+>/g, "").trim() && !content.includes("<img")) { Toast.warning(t("plugin.linapro-content-notice.validation.content")); return; } setSaving(true); try { const payload = { content, fileIds: fileIds.join(","), status: Number(values.status), title: String(values.title || "").trim(), type: Number(values.type) }; if (noticeId) await api.update(noticeId, payload); else await api.add(payload); Toast.success(t(noticeId ? "pages.common.updateSuccess" : "pages.common.createSuccess")); await onSaved(); onClose(); } finally { setSaving(false); } }
  return <Modal centered footer={<div className="notice-actions"><Button onClick={onClose}>{t("pages.common.cancel")}</Button><Button loading={saving} onClick={() => void save()} theme="solid" type="primary">{t("pages.common.confirm")}</Button></div>} onCancel={onClose} title={t(noticeId ? "plugin.linapro-content-notice.drawer.editTitle" : "plugin.linapro-content-notice.drawer.createTitle")} visible={open} width="min(800px, calc(100vw - 24px))">
    {loading ? <Spin aria-label={t("pages.common.loading")} /> : <Form<NoticeValues> getFormApi={setFormApi} key={`${noticeId ?? "new"}-${initial.title}`} initValues={initial} labelPosition="top">
      <Form.Input field="title" label={t("plugin.linapro-content-notice.fields.title")} placeholder={t("plugin.linapro-content-notice.placeholders.title")} rules={[{ message: t("plugin.linapro-content-notice.validation.title"), required: true }]} />
      <div className="notice-form-grid"><Form.RadioGroup field="status" label={t("plugin.linapro-content-notice.fields.status")} options={[{ label: t("plugin.linapro-content-notice.status.draft"), value: 0 }, { label: t("plugin.linapro-content-notice.status.published"), value: 1 }]} rules={[{ message: t("plugin.linapro-content-notice.validation.status"), required: true }]} /><Form.RadioGroup field="type" label={t("plugin.linapro-content-notice.fields.type")} options={typeOptions.map((item) => ({ label: item.label, value: Number(item.value) }))} rules={[{ message: t("plugin.linapro-content-notice.validation.type"), required: true }]} /></div>
      <label className="notice-field-label">{t("plugin.linapro-content-notice.fields.content")}</label><RichTextEditor labels={{ image: t("plugin.linapro-content-notice.editor.image"), link: t("plugin.linapro-content-notice.editor.link"), linkPrompt: t("plugin.linapro-content-notice.editor.linkPrompt") }} onChange={setContent} onUploadImage={uploadImage} placeholder={t("plugin.linapro-content-notice.validation.content")} value={content} />
      <label className="notice-field-label">{t("plugin.linapro-content-notice.fields.attachments")}</label><NoticeAttachmentUpload api={api} key={fileIds.join(",")} onChange={setFileIds} t={t} value={fileIds} />
    </Form>}
  </Modal>;
}
