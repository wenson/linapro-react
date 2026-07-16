import Button from "@douyinfe/semi-ui/lib/es/button";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import SideSheet from "@douyinfe/semi-ui/lib/es/sideSheet";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { DeptTreeNode, SystemUserApi, UserCreateInput, UserUpdateInput } from "#/api/system/user";
import type { SystemRoleApi } from "#/api/system/role";
import type { CapabilityProjection } from "#/plugins/capabilities";
import type { TenantOption } from "#/features/iam/user/tenant-options";
import { toSemiTree } from "#/shared/tree";

interface UserFormValues extends Partial<UserCreateInput> { password?: string }

export function UserDrawer({ api, capabilities, currentTenantId, isPlatform, onClose, onSaved, open, roleApi, tenantOptions, userId }: {
  api: SystemUserApi; capabilities: CapabilityProjection; currentTenantId?: number; isPlatform: boolean;
  onClose(): void; onSaved(): Promise<void>; open: boolean; roleApi: SystemRoleApi;
  tenantOptions: TenantOption[]; userId?: number;
}) {
  const { t } = useTranslation();
  const [deptId, setDeptId] = useState<number>();
  const detail = useQuery({ enabled: open && Boolean(userId), queryFn: () => api.get(userId!), queryKey: ["iam", "user", userId] });
  const roles = useQuery({ enabled: open, queryFn: () => roleApi.listOptions(), queryKey: ["iam", "role-options"] });
  const depts = useQuery({ enabled: open && capabilities.organizationEnabled, queryFn: () => api.getDeptTree(), queryKey: ["iam", "dept-tree"] });
  const activeDeptId = deptId ?? detail.data?.deptId;
  const posts = useQuery({ enabled: open && capabilities.organizationEnabled && Boolean(activeDeptId), queryFn: () => api.getPostOptions(activeDeptId), queryKey: ["iam", "post-options", activeDeptId] });
  const loading = Boolean(userId) && detail.isPending;
  const initial = detail.data;
  const initValues: UserFormValues = initial ? {
    deptId: initial.deptId || undefined, email: initial.email, nickname: initial.nickname,
    phone: initial.phone, postIds: initial.postIds, remark: initial.remark, roleIds: initial.roleIds,
    sex: initial.sex, status: initial.status, tenantIds: initial.tenantIds, username: initial.username,
  } : {
    sex: 0, status: 1,
    tenantIds: capabilities.tenantEnabled && !isPlatform && currentTenantId ? [currentTenantId] : [],
  };

  async function submit(values: UserFormValues) {
    const payload: UserFormValues = { ...values };
    if (!capabilities.organizationEnabled) {
      delete payload.deptId;
      delete payload.postIds;
    }
    if (!capabilities.tenantEnabled) delete payload.tenantIds;
    else if (!isPlatform) payload.tenantIds = currentTenantId ? [currentTenantId] : [];
    if (userId) {
      if (!payload.password) delete payload.password;
      await api.update({ ...payload, id: userId } as UserUpdateInput);
      Toast.success(t("pages.common.updateSuccess"));
    } else {
      await api.create(payload as UserCreateInput);
      Toast.success(t("pages.common.createSuccess"));
    }
    await onSaved();
    onClose();
  }

  return (
    <SideSheet closable onCancel={onClose} title={t(userId ? "pages.iam.user.editTitle" : "pages.iam.user.createTitle")} visible={open} width={600}>
      {loading ? <Spin aria-label={t("pages.common.loading")} /> : (
        <Form<UserFormValues> data-testid="user-drawer-form" key={`${userId ?? "new"}-${initial?.updatedAt ?? 0}`} initValues={initValues} labelPosition="top" onSubmit={submit}>
          <Form.Input disabled={Boolean(userId)} field="username" label={t("pages.iam.user.fields.username")} rules={[{ required: true, message: t("pages.iam.user.validation.username") }]} />
          <Form.Input field="password" label={t("pages.iam.user.fields.password")} mode="password" rules={userId ? [] : [{ required: true, message: t("pages.iam.user.validation.password") }]} />
          <Form.Input field="nickname" label={t("pages.iam.user.fields.nickname")} rules={[{ required: true, message: t("pages.iam.user.validation.nickname") }]} />
          <Form.Input field="email" label={t("pages.iam.user.fields.email")} rules={[{ type: "email", message: t("pages.iam.user.validation.email") }]} />
          <Form.Input field="phone" label={t("pages.iam.user.fields.phone")} />
          <Form.RadioGroup field="sex" label={t("pages.iam.user.fields.sex")} options={[
            { label: t("pages.iam.user.sex.unknown"), value: 0 }, { label: t("pages.iam.user.sex.male"), value: 1 }, { label: t("pages.iam.user.sex.female"), value: 2 },
          ]} />
          <Form.RadioGroup field="status" label={t("pages.common.status")} options={[
            { label: t("pages.common.enabled"), value: 1 }, { label: t("pages.common.disabled"), value: 0 },
          ]} />
          {capabilities.organizationEnabled ? <>
            <Form.TreeSelect field="deptId" label={t("pages.iam.user.fields.department")} onChange={(value) => setDeptId(Number(value))} treeData={toSemiTree<DeptTreeNode>(depts.data ?? [], (node) => node.id, (node) => node.label)} />
            <Form.Select field="postIds" label={t("pages.iam.user.fields.positions")} multiple optionList={(posts.data ?? []).map((item) => ({ label: item.postName, value: item.postId }))} />
          </> : null}
          {capabilities.tenantEnabled ? <Form.Select data-testid="user-drawer-tenant-select" disabled={!isPlatform} field="tenantIds" label={t("pages.iam.user.fields.tenants")} multiple optionList={tenantOptions} /> : null}
          <Form.Select field="roleIds" label={t("pages.iam.user.fields.roles")} multiple optionList={(roles.data ?? []).map((item) => ({ label: item.name, value: item.id }))} />
          <Form.TextArea field="remark" label={t("pages.common.remark")} rows={3} />
          <div className="iam-form-actions"><Button onClick={onClose}>{t("pages.common.cancel")}</Button><Button htmlType="submit" theme="solid" type="primary">{t("pages.common.save")}</Button></div>
        </Form>
      )}
    </SideSheet>
  );
}
