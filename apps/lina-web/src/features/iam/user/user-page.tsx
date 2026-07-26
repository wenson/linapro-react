import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Switch from "@douyinfe/semi-ui/lib/es/switch";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Tree from "@douyinfe/semi-ui/lib/es/tree";
import type { TreeNodeData } from "@douyinfe/semi-ui/lib/es/tree/interface";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";

import { pluginApiPath } from "#/api/client";
import { createSystemRoleApi } from "#/api/system/role";
import { createSystemUserApi, type DeptTreeNode, type SysUser, type UserListParams } from "#/api/system/user";
import { createTenantApi } from "#/api/tenant";
import { useWorkbenchRuntime } from "#/app/workbench-runtime-context";
import { useAuthContext } from "#/auth/auth-context";
import { confirmExport } from "#/shared/export-workflow";
import { UserBatchEditDialog } from "#/features/iam/user/user-batch-edit-dialog";
import { UserDrawer } from "#/features/iam/user/user-drawer";
import { UserImportDialog } from "#/features/iam/user/user-import-dialog";
import { UserResetPasswordDialog } from "#/features/iam/user/user-reset-password-dialog";
import { loadUserTenantOptions } from "#/features/iam/user/tenant-options";
import { MobileRecordActions, MobileRecordCard, MobileRecordField, MobileRecordFields, MobileRecordList, MobileRecordTitle } from "#/plugin-ui/mobile-record";
import { useDictOptions } from "#/features/settings/dict/use-dict-options";
import { formatTimestamp } from "#/shared/format";
import { tenantStore as fallbackTenantStore } from "#/tenant/tenant-store";

interface SearchValues { nickname?: string; phone?: string; status?: number; tenantId?: number; username?: string }

function hasPermission(permissions: readonly string[], permission: string): boolean { return permissions.includes("*") || permissions.includes(permission); }
function toDepartmentTree(nodes: DeptTreeNode[]): TreeNodeData[] {
  return nodes.map((node) => ({
    children: toDepartmentTree(node.children ?? []),
    key: String(node.id),
    label: node.userCount === undefined || /\(\d+\)$/.test(node.label) ? node.label : `${node.label} (${node.userCount})`,
    value: node.id,
  }));
}

export default function UserPage() {
  const { apiClient, tenantStore } = useWorkbenchRuntime();
  const auth = useAuthContext();
  const { i18n, t } = useTranslation();
  const store = tenantStore ?? fallbackTenantStore;
  const currentTenant = useStore(store, (state) => state.currentTenant);
  const loginTenants = useStore(store, (state) => state.tenants);
  const api = useMemo(() => createSystemUserApi(apiClient), [apiClient]);
  const roleApi = useMemo(() => createSystemRoleApi(apiClient), [apiClient]);
  const tenantApi = useMemo(() => createTenantApi(apiClient), [apiClient]);
  const capabilities = auth?.capabilities ?? { organizationEnabled: false, tenantEnabled: false };
  const permissions = auth?.user.permissions ?? [];
  const isPlatform = !currentTenant;
  const [params, setParams] = useState<UserListParams>({ pageNum: 1, pageSize: 10 });
  const [searchFormKey, setSearchFormKey] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [drawerUserId, setDrawerUserId] = useState<number | "new">();
  const [resetUserId, setResetUserId] = useState<number>();
  const [importOpen, setImportOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [departmentFilterOpen, setDepartmentFilterOpen] = useState(false);
  const query = useQuery({ queryFn: () => api.list(params), queryKey: ["iam", "users", params] });
  const statusOptionsQuery = useDictOptions("sys_normal_disable");
  const departmentsQuery = useQuery({
    enabled: capabilities.organizationEnabled,
    queryFn: () => api.getDeptTree(),
    queryKey: ["iam", "user-dept-tree"],
  });
  const tenantOptionsQuery = useQuery({
    enabled: capabilities.tenantEnabled,
    queryFn: () => loadUserTenantOptions({
      currentTenant, isPlatform,
      listLoginTenants: (userId) => tenantApi.listLoginTenants(userId),
      listPlatformTenants: async () => {
        const result = await apiClient.get<{ list: Array<{ id: number; name: string; status?: string }> }>(pluginApiPath("linapro-tenant-core", "platform/tenants"), { query: { pageNum: 1, pageSize: 100, status: "active" } });
        return result.list;
      },
      permissions, tenants: loginTenants, userId: auth?.user.userId,
    }),
    queryKey: ["iam", "user-tenant-options", currentTenant?.id ?? 0, permissions.join("|")],
  });
  async function refresh() {
    setSelected([]);
    await Promise.all([
      query.refetch(),
      capabilities.organizationEnabled ? departmentsQuery.refetch() : Promise.resolve(),
    ]);
  }
  function search(values: SearchValues) { setParams((current) => ({ ...current, ...values, pageNum: 1 })); }
  function resetSearch() { setSearchFormKey((value) => value + 1); setParams((current) => ({ pageNum: 1, pageSize: current.pageSize })); }
  async function remove(ids: number[]) {
    if (ids.length === 1) await api.delete(ids[0]!); else await api.batchDelete(ids);
    Toast.success(t("pages.common.deleteSuccess")); await refresh();
  }
  function renderStatus(row: SysUser) {
    return <Switch checked={row.status === 1} disabled={row.id === auth?.user.userId || !hasPermission(permissions, "system:user:edit")} onChange={(checked) => void api.updateStatus(row.id, checked ? 1 : 0).then(refresh)} />;
  }
  function renderActions(row: SysUser) {
    if (row.id === auth?.user.userId) return null;
    return <>
      {hasPermission(permissions, "system:user:edit") ? <Button onClick={() => setDrawerUserId(row.id)} theme="borderless">{t("pages.common.edit")}</Button> : null}
      {hasPermission(permissions, "system:user:resetPwd") ? <Button onClick={() => setResetUserId(row.id)} theme="borderless">{t("pages.iam.user.actions.resetPassword")}</Button> : null}
      {hasPermission(permissions, "system:user:remove") ? <Popconfirm content={t("pages.iam.user.messages.deleteConfirm")} onConfirm={() => void remove([row.id])}><Button theme="borderless" type="danger">{t("pages.common.delete")}</Button></Popconfirm> : null}
    </>;
  }
  const columns: ColumnProps<SysUser>[] = [
    { dataIndex: "username", sorter: true, title: t("pages.iam.user.fields.username"), width: 150 },
    { dataIndex: "nickname", sorter: true, title: t("pages.iam.user.fields.nickname"), width: 140 },
    ...(capabilities.organizationEnabled ? [{ dataIndex: "deptName", title: t("pages.iam.user.fields.department"), width: 140 }] : []),
    { dataIndex: "roleNames", render: (value) => Array.isArray(value) ? value.join(", ") : "", title: t("pages.iam.user.fields.roles"), width: 180 },
    ...(capabilities.tenantEnabled ? [{ dataIndex: "tenantNames", render: (value: unknown, row: SysUser) => Array.isArray(value) ? value.join(", ") : row.tenantName || t("pages.common.none"), title: t("pages.iam.user.fields.tenants"), width: 180 }] : []),
    { dataIndex: "phone", title: t("pages.iam.user.fields.phone"), width: 130 },
    { dataIndex: "status", render: (_, row) => renderStatus(row), title: t("pages.common.status"), width: 90 },
    { dataIndex: "createdAt", render: (value) => formatTimestamp(value as number | null, i18n.resolvedLanguage || "en-US"), sorter: true, title: t("pages.common.createdAt"), width: 180 },
    { render: (_, row) => <Space>{renderActions(row)}</Space>, title: t("pages.common.actions"), width: 280 },
  ];
  return <section className="feature-page iam-page" data-testid="user-page">
    <header className="feature-page-header"><Typography.Title heading={3}>{t("pages.iam.user.title")}</Typography.Title>{capabilities.organizationEnabled ? <Button aria-expanded={departmentFilterOpen} data-testid="user-department-filter-toggle" onClick={() => setDepartmentFilterOpen((value) => !value)}>{t(departmentFilterOpen ? "pages.common.collapse" : "pages.common.expand")} {t("pages.iam.user.fields.department")}</Button> : null}</header>
    <div className={capabilities.organizationEnabled && departmentFilterOpen ? "iam-user-layout" : "iam-user-layout iam-user-layout-single"}>
      {capabilities.organizationEnabled && departmentFilterOpen ? <Card className="iam-user-dept-card" title={t("pages.iam.user.fields.department")}>
        <div data-testid="user-dept-tree">
          <Tree
            aria-label={t("pages.iam.user.fields.department")}
            defaultExpandAll
            emptyContent={departmentsQuery.isError ? t("pages.common.loadFailed") : undefined}
            filterTreeNode
            key={departmentsQuery.data ? "loaded" : "loading"}
            onSelect={(key, isSelected) => setParams((current) => ({ ...current, deptId: isSelected ? Number(key) : undefined, pageNum: 1 }))}
            searchPlaceholder={t("pages.common.search")}
            showClear
            showLine
            treeData={toDepartmentTree(departmentsQuery.data ?? [])}
            value={params.deptId ? String(params.deptId) : undefined}
          />
        </div>
      </Card> : null}
      <div className="iam-user-main">
        <Card><Form<SearchValues> className="iam-search-form" key={searchFormKey} layout="horizontal" onSubmit={search}>
          <Form.Input field="username" label={t("pages.iam.user.fields.username")} />
          <Form.Input field="nickname" label={t("pages.iam.user.fields.nickname")} />
          <Form.Input field="phone" label={t("pages.iam.user.fields.phone")} />
          <Form.Select field="status" label={t("pages.common.status")} optionList={(statusOptionsQuery.data ?? []).map((item) => ({ label: item.label, value: Number(item.value) }))} />
          {capabilities.tenantEnabled && isPlatform ? <Form.Select data-testid="user-tenant-filter" field="tenantId" label={t("pages.iam.user.fields.tenants")} optionList={tenantOptionsQuery.data ?? []} /> : null}
          <Button htmlType="reset" onClick={resetSearch}>{t("pages.common.reset")}</Button>
          <Button htmlType="submit" theme="solid" type="primary">{t("pages.common.search")}</Button>
        </Form></Card>
        <Card><div className="iam-toolbar"><Space>
          {hasPermission(permissions, "system:user:add") ? <Button data-testid="user-create-button" onClick={() => setDrawerUserId("new")} theme="solid" type="primary">{t("pages.common.add")}</Button> : null}
          {hasPermission(permissions, "system:user:edit") ? <Button data-testid="user-batch-edit-button" disabled={!selected.length} onClick={() => setBatchOpen(true)}>{t("pages.iam.user.actions.batchEdit")}</Button> : null}
          {hasPermission(permissions, "system:user:remove") ? <Button data-testid="user-batch-delete-button" disabled={!selected.length} onClick={() => Modal.confirm({ content: t("pages.iam.user.messages.batchDeleteConfirm", { count: selected.length }), onOk: () => remove(selected), title: t("pages.common.confirmTitle") })} type="danger">{t("pages.common.delete")}</Button> : null}
          {hasPermission(permissions, "system:user:import") ? <Button onClick={() => setImportOpen(true)}>{t("pages.iam.user.actions.import")}</Button> : null}
          {hasPermission(permissions, "system:user:export") ? <Button onClick={() => confirmExport({ confirm: t("pages.settings.exportConfirm"), error: t("pages.common.exportFailed"), filename: "users.xlsx", load: () => api.export(selected.length ? { ids: selected } : undefined), success: t("pages.common.exportSuccess"), title: t("pages.common.confirmTitle") })}>{t("pages.iam.user.actions.export")}</Button> : null}
        </Space></div>
          <div className="responsive-desktop-table" data-testid="user-table"><Table<SysUser> columns={columns} dataSource={query.data?.list ?? []} loading={query.isPending} onChange={({ pagination, sorter }) => setParams((current) => ({ ...current, orderBy: sorter?.dataIndex ? String(sorter.dataIndex) : undefined, orderDirection: sorter?.sortOrder === "ascend" ? "asc" : sorter?.sortOrder === "descend" ? "desc" : undefined, pageNum: pagination?.currentPage ?? current.pageNum, pageSize: pagination?.pageSize ?? current.pageSize }))} pagination={{ currentPage: params.pageNum, pageSize: params.pageSize, showSizeChanger: true, total: query.data?.total ?? 0 }} rowKey="id" rowSelection={{ getCheckboxProps: (row) => ({ disabled: row?.id === auth?.user.userId }), onChange: (keys) => setSelected((keys ?? []).map(Number)), selectedRowKeys: selected }} scroll={{ x: 1300 }} /></div>
          <MobileRecordList testId="user-mobile-list">{(query.data?.list ?? []).map((row) => <MobileRecordCard key={row.id} testId={`user-mobile-card-${row.id}`}><MobileRecordTitle>{row.nickname || row.username}</MobileRecordTitle><MobileRecordFields><MobileRecordField label={t("pages.iam.user.fields.username")} value={row.username} />{capabilities.organizationEnabled ? <MobileRecordField label={t("pages.iam.user.fields.department")} value={row.deptName || t("pages.common.none")} /> : null}<MobileRecordField label={t("pages.iam.user.fields.roles")} value={row.roleNames?.join(", ") || t("pages.common.none")} /><MobileRecordField label={t("pages.common.status")} value={renderStatus(row)} /></MobileRecordFields><MobileRecordActions>{renderActions(row)}</MobileRecordActions></MobileRecordCard>)}</MobileRecordList>
        </Card>
      </div>
    </div>
    <UserDrawer api={api} capabilities={capabilities} currentTenantId={currentTenant?.id} isPlatform={isPlatform} onClose={() => setDrawerUserId(undefined)} onSaved={refresh} open={drawerUserId !== undefined} roleApi={roleApi} tenantOptions={tenantOptionsQuery.data ?? []} userId={drawerUserId === "new" ? undefined : drawerUserId} />
    <UserResetPasswordDialog api={api} onClose={() => setResetUserId(undefined)} open={resetUserId !== undefined} userId={resetUserId} />
    <UserImportDialog api={api} onClose={() => setImportOpen(false)} onSaved={refresh} open={importOpen} />
    <UserBatchEditDialog api={api} capabilities={capabilities} currentTenantId={currentTenant?.id} ids={selected} isPlatform={isPlatform} onClose={() => setBatchOpen(false)} onSaved={refresh} open={batchOpen} roleApi={roleApi} statusOptions={(statusOptionsQuery.data ?? []).map((item) => ({ label: item.label, value: Number(item.value) }))} tenantOptions={tenantOptionsQuery.data ?? []} />
  </section>;
}
