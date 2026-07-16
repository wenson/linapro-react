import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { createSystemRoleApi, type RoleUser, type RoleUsersParams } from "#/api/system/role";
import { useWorkbenchRuntime } from "#/app/workbench-runtime-context";
import { useAuthContext } from "#/auth/auth-context";
import { formatTimestamp } from "#/shared/format";

export default function RoleAuthPage() {
  const { apiClient } = useWorkbenchRuntime(); const auth = useAuthContext(); const { i18n, t } = useTranslation(); const location = useLocation(); const navigate = useNavigate();
  const roleId = Number(location.pathname.match(/\/system\/role-auth\/user\/(\d+)/)?.[1] ?? 0); const api = useMemo(() => createSystemRoleApi(apiClient), [apiClient]);
  const canEdit = auth?.user.permissions.includes("*") === true || auth?.user.permissions.includes("system:role:edit") === true;
  const [params, setParams] = useState<RoleUsersParams>({ page: 1, size: 10 }); const [searchFormKey, setSearchFormKey] = useState(0); const [selected, setSelected] = useState<number[]>([]); const [assignOpen, setAssignOpen] = useState(false);
  const role = useQuery({ enabled: roleId > 0, queryFn: () => api.get(roleId), queryKey: ["iam", "role", roleId] }); const users = useQuery({ enabled: roleId > 0, queryFn: () => api.listUsers(roleId, params), queryKey: ["iam", "role-users", roleId, params] });
  async function refresh() { setSelected([]); await users.refetch(); }
  async function unassign(ids: number[]) { if (ids.length === 1) await api.unassignUser(roleId, ids[0]!); else await api.unassignUsers(roleId, ids); Toast.success(t("pages.iam.role.auth.removed")); await refresh(); }
  async function assign(values: { userIds: string }) { const ids = values.userIds.split(/[,\s]+/).map(Number).filter((id) => id > 0); await api.assignUsers(roleId, ids); Toast.success(t("pages.iam.role.auth.assigned")); setAssignOpen(false); await refresh(); }
  const columns: ColumnProps<RoleUser>[] = [{ dataIndex: "username", title: t("pages.iam.user.fields.username") }, { dataIndex: "nickname", title: t("pages.iam.user.fields.nickname") }, { dataIndex: "email", title: t("pages.iam.user.fields.email") }, { dataIndex: "phone", title: t("pages.iam.user.fields.phone") }, { dataIndex: "status", render: (value) => <Tag color={value === 1 ? "green" : "red"}>{t(value === 1 ? "pages.common.enabled" : "pages.common.disabled")}</Tag>, title: t("pages.common.status") }, { dataIndex: "createdAt", render: (value) => formatTimestamp(value as number | null, i18n.resolvedLanguage || "en-US"), title: t("pages.common.createdAt") }, { render: (_, row) => canEdit ? <Popconfirm content={t("pages.iam.role.auth.removeConfirm", { username: row.username })} onConfirm={() => void unassign([row.id])}><Button theme="borderless" type="danger">{t("pages.iam.role.auth.remove")}</Button></Popconfirm> : null, title: t("pages.common.actions") }];
  return <section className="feature-page iam-page" data-testid="role-auth-page"><header><Typography.Title heading={3}>{t("pages.iam.role.auth.title", { name: role.data?.name ?? "" })}</Typography.Title></header><Card><Form<RoleUsersParams> className="iam-search-form" key={searchFormKey} layout="horizontal" onSubmit={(values) => setParams((current) => ({ ...current, ...values, page: 1 }))}><Form.Input field="username" label={t("pages.iam.user.fields.username")} /><Form.Input field="phone" label={t("pages.iam.user.fields.phone")} /><Button htmlType="reset" onClick={() => { setSearchFormKey((value) => value + 1); setParams((current) => ({ page: 1, size: current.size })); }}>{t("pages.common.reset")}</Button><Button htmlType="submit" theme="solid" type="primary">{t("pages.common.search")}</Button></Form></Card><Card><div className="iam-toolbar"><Space>{canEdit ? <><Button onClick={() => setAssignOpen(true)} theme="solid" type="primary">{t("pages.iam.role.auth.assign")}</Button><Button disabled={!selected.length} onClick={() => Modal.confirm({ content: t("pages.iam.role.auth.removeSelected", { count: selected.length }), onOk: () => unassign(selected), title: t("pages.common.confirmTitle") })} type="danger">{t("pages.iam.role.auth.remove")}</Button></> : null}<Button onClick={() => navigate("/system/role")}>{t("pages.common.back")}</Button></Space></div><div data-testid="role-auth-table"><Table<RoleUser> columns={columns} dataSource={users.data?.list ?? []} loading={users.isPending} pagination={{ currentPage: params.page, onChange: (page) => setParams((current) => ({ ...current, page })), pageSize: params.size, total: users.data?.total ?? 0 }} rowKey="id" rowSelection={canEdit ? { onChange: (keys) => setSelected((keys ?? []).map(Number)), selectedRowKeys: selected } : undefined} /></div></Card><Modal footer={null} onCancel={() => setAssignOpen(false)} title={t("pages.iam.role.auth.assign")} visible={assignOpen}><Form<{ userIds: string }> labelPosition="top" onSubmit={assign}><Form.TextArea field="userIds" label={t("pages.iam.role.auth.userIds")} rules={[{ required: true, message: t("pages.iam.role.auth.userIdsRequired") }]} /><Button htmlType="submit" theme="solid" type="primary">{t("pages.common.confirm")}</Button></Form></Modal></section>;
}
