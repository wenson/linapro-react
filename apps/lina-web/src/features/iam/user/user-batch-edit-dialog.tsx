import Button from "@douyinfe/semi-ui/lib/es/button";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Select from "@douyinfe/semi-ui/lib/es/select";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { SystemRoleApi } from "#/api/system/role";
import type { SystemUserApi, UserBatchUpdateInput } from "#/api/system/user";
import type { CapabilityProjection } from "#/plugins/capabilities";
import type { TenantOption } from "#/features/iam/user/tenant-options";

export function UserBatchEditDialog({ api, capabilities, currentTenantId, ids, isPlatform, onClose, onSaved, open, roleApi, statusOptions, tenantOptions }: {
  api: SystemUserApi; capabilities: CapabilityProjection; currentTenantId?: number; ids: number[]; isPlatform: boolean;
  onClose(): void; onSaved(): Promise<void>; open: boolean; roleApi: SystemRoleApi;
  statusOptions: Array<{ label: string; value: number }>; tenantOptions: TenantOption[];
}) {
  const { t } = useTranslation();
  const [selectedStatus, setSelectedStatus] = useState(1);
  const selectedStatusRef = useRef(1);
  const roles = useQuery({ enabled: open, queryFn: () => roleApi.listOptions(), queryKey: ["iam", "role-options"] });
  function close() {
    selectedStatusRef.current = 1;
    setSelectedStatus(1);
    onClose();
  }
  function selectStatus(value: unknown) {
    const status = Number(value);
    selectedStatusRef.current = status;
    setSelectedStatus(status);
  }
  async function submit(values: Omit<UserBatchUpdateInput, "ids">) {
    const input: UserBatchUpdateInput = {
      ...values,
      ids,
      status: values.updateStatus ? selectedStatusRef.current : undefined,
    };
    if (!capabilities.tenantEnabled) {
      delete input.updateTenant;
      delete input.tenantIds;
    } else if (input.updateTenant && !isPlatform) input.tenantIds = currentTenantId ? [currentTenantId] : [];
    await api.batchUpdate(input);
    Toast.success(t("pages.common.updateSuccess"));
    await onSaved();
    close();
  }
  return <Modal footer={null} onCancel={close} title={t("pages.iam.user.batchEditTitle")} visible={open}><div data-testid="user-batch-edit-dialog">
    <Form<Omit<UserBatchUpdateInput, "ids">>
      initValues={{ updateRoles: false, updateStatus: false, updateTenant: false }}
      labelPosition="top"
      onSubmit={submit}
    >
      <Form.Checkbox field="updateStatus" noLabel>{t("pages.iam.user.batch.updateStatus")}</Form.Checkbox>
      <Form.Slot label={t("pages.common.status")}>
        <Select
          aria-label={t("pages.common.status")}
          onChange={selectStatus}
          onSelect={selectStatus}
          optionList={statusOptions}
          value={selectedStatus}
        />
      </Form.Slot>
      <Form.Checkbox field="updateRoles" noLabel>{t("pages.iam.user.batch.updateRoles")}</Form.Checkbox>
      <Form.Select field="roleIds" label={t("pages.iam.user.fields.roles")} multiple optionList={(roles.data ?? []).map((item) => ({ label: item.name, value: item.id }))} />
      {capabilities.tenantEnabled ? <><Form.Checkbox field="updateTenant" noLabel>{t("pages.iam.user.batch.updateTenants")}</Form.Checkbox><Form.Select data-testid="user-batch-tenant-select" disabled={!isPlatform} field="tenantIds" label={t("pages.iam.user.fields.tenants")} multiple optionList={tenantOptions} /></> : null}
      <div className="iam-form-actions"><Button onClick={close}>{t("pages.common.cancel")}</Button><Button htmlType="submit" theme="solid" type="primary">{t("pages.common.save")}</Button></div>
    </Form></div>
  </Modal>;
}
