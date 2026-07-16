import Button from "@douyinfe/semi-ui/lib/es/button";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Toast from "@douyinfe/semi-ui/lib/es/toast";

import type { PlatformTenant, PlatformTenantPayload, TenantManagementApi } from "../tenant-client";

type Translate = (key: string, options?: Record<string, unknown>) => string;

function errorMessage(error: unknown, fallback: string): string { return error instanceof Error ? error.message : fallback; }

export function TenantModal({ api, onClose, onSaved, open, record, t }: {
  api: TenantManagementApi;
  onClose(): void;
  onSaved(): Promise<void>;
  open: boolean;
  record?: PlatformTenant;
  t: Translate;
}) {
  async function submit(values: PlatformTenantPayload): Promise<void> {
    try {
      if (record) await api.update(record.id, { name: values.name, remark: values.remark });
      else await api.create(values);
      Toast.success(t(record ? "pages.common.updateSuccess" : "pages.common.createSuccess"));
      onClose();
      await onSaved();
    } catch (error) {
      Toast.error(errorMessage(error, t("plugin.linapro-tenant-core.messages.saveFailed")));
    }
  }

  return <Modal footer={null} onCancel={onClose} title={t(record ? "plugin.linapro-tenant-core.tenant.actions.edit" : "plugin.linapro-tenant-core.tenant.actions.create")} visible={open}>
    <div data-testid="tenant-form">
      <Form<PlatformTenantPayload> initValues={{ code: record?.code ?? "", name: record?.name ?? "", remark: record?.remark ?? "" }} key={record?.id ?? "new"} labelPosition="top" onSubmit={submit}>
        <Form.Input data-testid="tenant-code-input" disabled={Boolean(record)} field="code" label={t("plugin.linapro-tenant-core.fields.code")} rules={[{ message: t("plugin.linapro-tenant-core.messages.codeRule"), pattern: /^[a-z0-9-]{2,32}$/, required: true }]} />
        <Form.Input data-testid="tenant-name-input" field="name" label={t("plugin.linapro-tenant-core.fields.name")} rules={[{ message: t("plugin.linapro-tenant-core.messages.nameRequired"), required: true }]} />
        <Form.TextArea data-testid="tenant-remark-input" field="remark" label={t("pages.common.remark")} rows={3} />
        <Space className="tenant-core-form-actions"><Button onClick={onClose}>{t("pages.common.cancel")}</Button><Button htmlType="submit" theme="solid" type="primary">{t("pages.common.confirm")}</Button></Space>
      </Form>
    </div>
  </Modal>;
}
