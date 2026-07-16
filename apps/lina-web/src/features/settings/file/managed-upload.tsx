import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Upload from "@douyinfe/semi-ui/lib/es/upload";
import type { BeforeUploadProps, customRequestArgs } from "@douyinfe/semi-ui/lib/es/upload/interface";
import { useTranslation } from "react-i18next";
import type { ReturnTypeOfSystemFileApi } from "#/features/settings/file/types";
import { validateManagedUpload } from "#/features/settings/file/upload-validation";

export function ManagedUpload({ api, imageOnly, onUploaded }: { api: ReturnTypeOfSystemFileApi; imageOnly: boolean; onUploaded(): Promise<void> }) {
  const { t } = useTranslation();
  function beforeUpload({ file }: BeforeUploadProps) { const instance = file.fileInstance; if (!instance) return false; const error = validateManagedUpload(instance, imageOnly); if (error) { Toast.error(t(`pages.settings.file.${error}`)); return false; } return true; }
  async function request(args: customRequestArgs) { try { args.onProgress({ loaded: 1, total: 2 }); await api.upload(args.fileInstance, "other"); args.onProgress({ loaded: 2, total: 2 }); args.onSuccess({}); Toast.success(t("pages.settings.file.uploadSuccess")); await onUploaded(); } catch { args.onError({ status: 500 }); Toast.error(t("pages.settings.file.uploadFailed")); } }
  return <div data-testid="managed-upload"><Upload accept={imageOnly ? "image/*" : undefined} action="/api/v1/file/upload" beforeUpload={beforeUpload} customRequest={request} draggable limit={3} multiple /></div>;
}
