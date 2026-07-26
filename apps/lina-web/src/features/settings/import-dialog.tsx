import Button from "@douyinfe/semi-ui/lib/es/button";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Switch from "@douyinfe/semi-ui/lib/es/switch";
import Upload from "@douyinfe/semi-ui/lib/es/upload";
import type { FileItem, OnChangeProps } from "@douyinfe/semi-ui/lib/es/upload/interface";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ImportResult } from "#/api/system/config";
import { downloadBlob } from "#/features/iam/download";

export function ImportDialog({ filename, importFile, onClose, onSaved, open, overwriteLabel, template, title }: { filename: string; importFile(file: File, update: boolean): Promise<ImportResult>; onClose(): void; onSaved(): Promise<void>; open: boolean; overwriteLabel?: string; template(): Promise<Blob>; title: string }) {
  const { t } = useTranslation(); const [files, setFiles] = useState<FileItem[]>([]); const [update, setUpdate] = useState(false); const [loading, setLoading] = useState(false);
  function close() { setFiles([]); setUpdate(false); onClose(); }
  async function submit() { const file = files[0]?.fileInstance; if (!file) return; setLoading(true); try { const result = await importFile(file, update); const content = t("pages.settings.import.summary", { fail: result.fail, success: result.success }); if (result.fail > 0) Modal.error({ content, title: t("pages.settings.import.failureTitle") }); else Modal.success({ content, title: t("pages.settings.import.successTitle") }); await onSaved(); setFiles([]); setUpdate(false); onClose(); } finally { setLoading(false); } }
  const overwrite = overwriteLabel ?? t("pages.settings.import.overwrite");
  return <Modal footer={null} onCancel={close} title={title} visible={open} width="min(520px, calc(100vw - 24px))"><div data-testid="settings-import-dialog"><div data-testid="settings-import-upload"><Upload accept=".xlsx,.xls" action="" beforeUpload={() => false} dragMainText={t("pages.settings.import.drag")} dragSubText={t("pages.settings.import.hint")} draggable fileList={files} limit={1} onChange={({ fileList }: OnChangeProps) => setFiles(fileList)} /></div><div className="settings-import-overwrite"><Switch aria-label={overwrite} checked={update} onChange={setUpdate} /><span>{overwrite}</span></div><div className="iam-form-actions"><Button onClick={() => void template().then((blob) => downloadBlob(blob, filename))}>{t("pages.settings.import.template")}</Button><Button disabled={!files[0]?.fileInstance} loading={loading} onClick={() => void submit()} theme="solid" type="primary">{t("pages.settings.import.submit")}</Button></div></div></Modal>;
}
