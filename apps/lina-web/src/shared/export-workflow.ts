import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import { downloadBlob } from "#/features/iam/download";
export function confirmExport(options: { confirm: string; error: string; filename: string; load(): Promise<Blob>; success: string; title: string }): void { Modal.confirm({ content: options.confirm, onOk: async () => { try { downloadBlob(await options.load(), options.filename); Toast.success(options.success); } catch { Toast.error(options.error); throw new Error(options.error); } }, title: options.title }); }
