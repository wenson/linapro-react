import Banner from "@douyinfe/semi-ui/lib/es/banner";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Checkbox from "@douyinfe/semi-ui/lib/es/checkbox";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import type { FormApi } from "@douyinfe/semi-ui/lib/es/form/interface";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import Upload from "@douyinfe/semi-ui/lib/es/upload";
import { useEffect, useState } from "react";

import type { DemoRecordApi } from "../demo-record-client";
import "../demo-source.css";

type Translate = (key: string, options?: Record<string, unknown>) => string;
interface Values { content?: string; title?: string }

export function DemoRecordModal({ api, onClose, onSaved, open, recordId, t }: { api: DemoRecordApi; onClose(): void; onSaved(): Promise<void>; open: boolean; recordId?: number; t: Translate }) {
  const [formApi, setFormApi] = useState<FormApi<Values>>(); const [initial, setInitial] = useState<Values>({ content: "", title: "" }); const [attachmentName, setAttachmentName] = useState(""); const [file, setFile] = useState<File>(); const [removeAttachment, setRemoveAttachment] = useState(false); const [loading, setLoading] = useState(false); const [saving, setSaving] = useState(false);
  useEffect(() => { let active = true; if (!open) return () => { active = false; }; queueMicrotask(() => { if (!active) return; setInitial({ content: "", title: "" }); setAttachmentName(""); setFile(undefined); setRemoveAttachment(false); if (!recordId) return; setLoading(true); void api.get(recordId).then((record) => { if (!active) return; setInitial({ content: record.content || "", title: record.title }); setAttachmentName(record.attachmentName || ""); }).catch((error: unknown) => Toast.error(error instanceof Error ? error.message : String(error))).finally(() => { if (active) setLoading(false); }); }); return () => { active = false; }; }, [api, open, recordId]);
  async function save() { if (!formApi) return; const values = await formApi.validate(); setSaving(true); try { const payload = { content: String(values.content || "").trim(), removeAttachment: !file && removeAttachment, title: String(values.title || "").trim() }; if (recordId) await api.update(recordId, payload, file); else await api.create(payload, file); Toast.success(t(recordId ? "pages.common.updateSuccess" : "pages.common.createSuccess")); await onSaved(); onClose(); } finally { setSaving(false); } }
  return <Modal footer={<div className="demo-source-actions"><Button onClick={onClose}>{t("pages.common.cancel")}</Button><Button loading={saving} onClick={() => void save()} theme="solid" type="primary">{t("pages.common.confirm")}</Button></div>} onCancel={onClose} title={t(recordId ? "plugin.linapro-demo-source.page.modal.editTitle" : "plugin.linapro-demo-source.page.modal.createTitle")} visible={open} width={600}>
    {loading ? <Spin aria-label={t("pages.common.loading")} /> : <Form<Values> data-testid="linapro-demo-source-record-form" getFormApi={setFormApi} key={`${recordId ?? "new"}-${initial.title}`} initValues={initial} labelPosition="top"><Form.Input data-testid="linapro-demo-source-record-title-input" field="title" label={t("plugin.linapro-demo-source.page.fields.title")} maxLength={128} placeholder={t("plugin.linapro-demo-source.page.placeholders.title")} rules={[{ message: t("plugin.linapro-demo-source.page.validation.title"), required: true }]} /><Form.TextArea data-testid="linapro-demo-source-record-content-input" field="content" label={t("plugin.linapro-demo-source.page.fields.content")} maxCount={1000} maxLength={1000} placeholder={t("plugin.linapro-demo-source.page.placeholders.content")} rows={5} showClear />
      <label className="demo-source-field-label">{t("plugin.linapro-demo-source.page.fields.attachment")}</label><div data-testid="linapro-demo-source-record-attachment-alert"><Banner description={t("plugin.linapro-demo-source.page.messages.attachmentHint")} type="info" /></div><div className="demo-source-upload-section" data-testid="linapro-demo-source-record-upload-section">{attachmentName && !file ? <><div className="demo-source-existing-attachment" data-testid="linapro-demo-source-record-existing-attachment">{t("plugin.linapro-demo-source.page.messages.currentAttachment", { name: attachmentName })}</div><div data-testid="linapro-demo-source-record-remove-attachment-option"><Checkbox checked={removeAttachment} onChange={(event) => setRemoveAttachment(Boolean(event.target.checked))}>{t("plugin.linapro-demo-source.page.messages.removeAttachment")}</Checkbox></div></> : null}<Upload action="/unused" data-testid="linapro-demo-source-record-dragger" dragMainText={t("plugin.linapro-demo-source.page.messages.uploadText")} dragSubText={t("plugin.linapro-demo-source.page.messages.uploadHint")} draggable fileList={file ? [{ fileInstance: file, name: file.name, size: String(file.size), status: "success", uid: file.name }] : []} limit={1} onFileChange={(files) => { setFile(files[0]); if (files[0]) setRemoveAttachment(false); }} onRemove={() => setFile(undefined)} uploadTrigger="custom" /><Typography.Paragraph type="tertiary">{t("plugin.linapro-demo-source.page.messages.uploadHint")}</Typography.Paragraph></div>
    </Form>}
  </Modal>;
}
