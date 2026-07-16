import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Upload from "@douyinfe/semi-ui/lib/es/upload";
import type { BeforeUploadProps, customRequestArgs, FileItem, OnChangeProps } from "@douyinfe/semi-ui/lib/es/upload/interface";
import { useMemo } from "react";

import type { NoticeApi } from "./notice-client";
import type { Translate } from "./notice-modal";

export function NoticeAttachmentUpload({ api, onChange, t, value }: { api: NoticeApi; onChange(ids: string[]): void; t: Translate; value: string[] }) {
  const initial = useMemo<FileItem[]>(() => value.map((id) => ({ name: `#${id}`, response: { id: Number(id) }, size: "0", status: "success", uid: id })), [value]);
  function beforeUpload({ file }: BeforeUploadProps) {
    const instance = file.fileInstance;
    if (!instance) return false;
    if (instance.size > 10 * 1024 * 1024) { Toast.error(t("plugin.linapro-content-notice.upload.tooLarge")); return false; }
    return true;
  }
  async function request(args: customRequestArgs) {
    try { args.onProgress({ loaded: 1, total: 2 }); const result = await api.upload(args.fileInstance, "notice_attachment"); args.onProgress({ loaded: 2, total: 2 }); args.onSuccess(result); }
    catch { args.onError({ status: 500 }); Toast.error(t("plugin.linapro-content-notice.upload.failed")); }
  }
  function changed({ fileList }: OnChangeProps) {
    onChange(fileList.filter((item) => item.status === "success").map((item) => String((item.response as { id?: number } | undefined)?.id || item.uid)).filter(Boolean));
  }
  return <Upload action="/api/v1/file/upload" beforeUpload={beforeUpload} customRequest={request} defaultFileList={initial} draggable limit={5} multiple onChange={changed} prompt={t("plugin.linapro-content-notice.upload.hint")} />;
}
