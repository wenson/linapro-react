import Button from "@douyinfe/semi-ui/lib/es/button";
import Checkbox from "@douyinfe/semi-ui/lib/es/checkbox";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Upload from "@douyinfe/semi-ui/lib/es/upload";
import type { FileItem, OnChangeProps } from "@douyinfe/semi-ui/lib/es/upload/interface";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { SystemUserApi } from "#/api/system/user";
import { downloadBlob } from "#/features/iam/download";

export function UserImportDialog({ api, onClose, onSaved, open }: { api: SystemUserApi; onClose(): void; onSaved(): Promise<void>; open: boolean }) {
  const { t } = useTranslation();
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [updateSupport, setUpdateSupport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  async function submit() {
    const file = fileList[0]?.fileInstance;
    if (!file) return;
    setSubmitting(true);
    try {
      const result = await api.import(file, updateSupport);
      await onSaved();
      const summary = t("pages.iam.user.import.summary", { fail: result.fail, success: result.success });
      if (result.fail > 0) Modal.error({ content: `${summary}\n${result.failList.slice(0, 5).map((item) => `${item.row}: ${item.reason}`).join("\n")}`, title: t("pages.iam.user.import.resultTitle") });
      else Modal.success({ content: summary, title: t("pages.iam.user.import.resultTitle") });
      setFileList([]);
      onClose();
    } finally { setSubmitting(false); }
  }
  async function template() { downloadBlob(await api.getImportTemplate(), "user-import-template.xlsx"); }
  return <Modal confirmLoading={submitting} footer={null} onCancel={onClose} title={t("pages.iam.user.import.title")} visible={open}><div data-testid="user-import-dialog">
    <Upload accept=".xlsx,.xls" action="" beforeUpload={() => false} dragMainText={t("pages.iam.user.import.drag")} dragSubText={t("pages.iam.user.import.hint")} draggable fileList={fileList} limit={1} onChange={({ fileList: files }: OnChangeProps) => setFileList(files)} />
    <Checkbox checked={updateSupport} onChange={(event) => setUpdateSupport(Boolean(event.target.checked))}>{t("pages.iam.user.import.overwrite")}</Checkbox>
    <div className="iam-form-actions"><Button onClick={() => void template()}>{t("pages.iam.user.import.template")}</Button><Button disabled={!fileList[0]?.fileInstance} loading={submitting} onClick={() => void submit()} theme="solid" type="primary">{t("pages.iam.user.import.submit")}</Button></div>
  </div></Modal>;
}
