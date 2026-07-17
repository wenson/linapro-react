import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Upload from "@douyinfe/semi-ui/lib/es/upload";
import type { BeforeUploadProps, customRequestArgs } from "@douyinfe/semi-ui/lib/es/upload/interface";
import { useTranslation } from "react-i18next";
import type { ReturnTypeOfSystemFileApi } from "#/features/settings/file/types";
import { validateManagedUpload } from "#/features/settings/file/upload-validation";
import type { MultipartPart, UploadAccess } from "#/api/system/file";

async function transfer(access: UploadAccess, body: Blob): Promise<string> {
  if (!access.url || access.mode === "proxy" || access.mode === "temporary_credentials") throw new Error("Direct upload access is unavailable");
  if (access.mode === "form_post") {
    const form = new FormData();
    for (const [key, value] of Object.entries(access.formFields ?? {})) form.append(key, value);
    form.append("file", body);
    const response = await fetch(access.url, { body: form, method: "POST" });
    if (!response.ok) throw new Error("Direct upload failed");
    return response.headers.get("etag") ?? "";
  }
  const response = await fetch(access.url, { body, headers: access.headers, method: access.method ?? "PUT" });
  if (!response.ok) throw new Error("Direct upload failed");
  return response.headers.get("etag") ?? "";
}

export async function uploadThroughPlan(api: ReturnTypeOfSystemFileApi, file: File, scene: string, progress: (loaded: number) => void) {
  const init = await api.directUploadInit(file, scene);
  if (init.instantReuse) {
    progress(file.size);
    return;
  }
  const session = init.uploadSessionId;
  try {
    if (init.strategy?.channel === "proxy" && init.strategy.encoding === "multipart") {
      await uploadProxyMultipart(api, file, scene, progress);
      return;
    }
    if (!session || !init.access || init.strategy?.channel !== "direct") {
      await api.upload(file, scene);
      progress(file.size);
      return;
    }
    if (init.strategy.encoding !== "multipart") {
      const etag = await transfer(init.access, file);
      await api.directUploadComplete(session, etag);
      progress(file.size);
      return;
    }
    const partSize = init.multipart?.partSize;
    if (!partSize || partSize < 1) throw new Error("Multipart upload plan is invalid");
    const parts: MultipartPart[] = [];
    let uploaded = 0;
    for (let offset = 0, number = 1; offset < file.size; offset += partSize, number += 1) {
      const chunk = file.slice(offset, Math.min(file.size, offset + partSize));
      const { access } = await api.directUploadPartUrl(session, number, chunk.size);
      parts.push({ etag: await transfer(access, chunk), partNumber: number });
      uploaded += chunk.size;
      progress(uploaded);
    }
    await api.directUploadComplete(session, undefined, parts);
  } catch (error) {
    if (session) await api.directUploadAbort(session).catch(() => undefined);
    throw error;
  }
}

async function uploadProxyMultipart(
  api: ReturnTypeOfSystemFileApi,
  file: File,
  scene: string,
  progress: (loaded: number) => void,
) {
  const init = await api.chunkedUploadInit(file, scene);
  const session = init.uploadSessionId;
  const partSize = init.multipart?.partSize;
  if (!session || !partSize || partSize < 1) {
    throw new Error("Proxy multipart upload plan is invalid");
  }
  const parts: MultipartPart[] = [];
  let uploaded = 0;
  try {
    for (let offset = 0, number = 1; offset < file.size; offset += partSize, number += 1) {
      const chunk = file.slice(offset, Math.min(file.size, offset + partSize));
      parts.push({
        etag: await api.chunkedUploadPart(chunk, session, number),
        partNumber: number,
      });
      uploaded += chunk.size;
      progress(uploaded);
    }
    await api.chunkedUploadComplete(session, parts);
  } catch (error) {
    await api.chunkedUploadAbort(session).catch(() => undefined);
    throw error;
  }
}

export function ManagedUpload({ api, imageOnly, onUploaded }: { api: ReturnTypeOfSystemFileApi; imageOnly: boolean; onUploaded(): Promise<void> }) {
  const { t } = useTranslation();
  function beforeUpload({ file }: BeforeUploadProps) { const instance = file.fileInstance; if (!instance) return false; const error = validateManagedUpload(instance, imageOnly); if (error) { Toast.error(t(`pages.settings.file.${error}`)); return false; } return true; }
  async function request(args: customRequestArgs) { try { const total = args.fileInstance.size; args.onProgress({ loaded: 0, total }); await uploadThroughPlan(api, args.fileInstance, "other", (loaded) => args.onProgress({ loaded, total })); args.onSuccess({}); Toast.success(t("pages.settings.file.uploadSuccess")); await onUploaded(); } catch { args.onError({ status: 500 }); Toast.error(t("pages.settings.file.uploadFailed")); } }
  return <div data-testid="managed-upload"><Upload accept={imageOnly ? "image/*" : undefined} action="/api/v1/file/upload" beforeUpload={beforeUpload} customRequest={request} draggable limit={3} multiple /></div>;
}
