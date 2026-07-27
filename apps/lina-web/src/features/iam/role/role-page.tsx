import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import Dropdown from "@douyinfe/semi-ui/lib/es/dropdown";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Switch from "@douyinfe/semi-ui/lib/es/switch";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Tooltip from "@douyinfe/semi-ui/lib/es/tooltip";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { createSystemMenuApi } from "#/api/system/menu";
import { createSystemRoleApi, type Role, type RoleListParams } from "#/api/system/role";
import { useWorkbenchRuntime } from "#/app/workbench-runtime-context";
import { useAuthContext } from "#/auth/auth-context";
import { normalizeDataScope } from "#/features/iam/role/data-scope";
import { RoleDrawer } from "#/features/iam/role/role-drawer";
import { MobileRecordActions, MobileRecordCard, MobileRecordField, MobileRecordFields, MobileRecordList, MobileRecordTitle } from "#/plugin-ui/mobile-record";
import { formatTimestamp } from "#/shared/format";

interface SearchValues { key?: string; name?: string; status?: number }
function hasPermission(values: readonly string[], permission: string) { return values.includes("*") || values.includes(permission); }

export default function RolePage() {
  const { apiClient } = useWorkbenchRuntime(); const auth = useAuthContext(); const { i18n, t } = useTranslation(); const navigate = useNavigate();
  const api = useMemo(() => createSystemRoleApi(apiClient), [apiClient]); const menuApi = useMemo(() => createSystemMenuApi(apiClient), [apiClient]);
  const permissions = auth?.user.permissions ?? []; const capabilities = auth?.capabilities ?? { organizationEnabled: false, tenantEnabled: false };
  const [params, setParams] = useState<RoleListParams>({ page: 1, size: 10 }); const [searchFormKey, setSearchFormKey] = useState(0); const [selected, setSelected] = useState<number[]>([]); const [drawerId, setDrawerId] = useState<number | "new">(); const [openActionMenuId, setOpenActionMenuId] = useState<number>();
  const query = useQuery({ queryFn: () => api.list(params), queryKey: ["iam", "roles", params] });
  async function refresh() { setSelected([]); await query.refetch(); }
  async function remove(ids: number[]) { if (ids.length === 1) await api.delete(ids[0]!); else await api.batchDelete(ids); Toast.success(t("pages.common.deleteSuccess")); await refresh(); }
  function dataScopeLabel(row: Role) { return t(`pages.iam.role.dataScope.${({ 1: "all", 2: "tenant", 3: "dept", 4: "self" } as Record<number, string>)[normalizeDataScope(Number(row.dataScope), capabilities)]}`); }
  function renderStatus(row: Role) { return <Switch checked={row.status === 1} disabled={row.id === 1 || !hasPermission(permissions, "system:role:edit")} onChange={(checked) => void api.updateStatus(row.id, checked ? 1 : 0).then(refresh)} />; }
  function renderActions(row: Role) { return row.id === 1 ? null : <>{hasPermission(permissions, "system:role:edit") ? <><Button onClick={() => setDrawerId(row.id)} theme="borderless">{t("pages.common.edit")}</Button><Button onClick={() => navigate(`/system/role-auth/user/${row.id}`)} theme="borderless">{t("pages.iam.role.actions.authorizeUsers")}</Button></> : null}{hasPermission(permissions, "system:role:remove") ? <Popconfirm content={t("pages.iam.role.messages.deleteConfirm")} onConfirm={() => void remove([row.id])}><Button theme="borderless" type="danger">{t("pages.common.delete")}</Button></Popconfirm> : null}</>; }
  const columns: ColumnProps<Role>[] = [
    { dataIndex: "name", title: t("pages.iam.role.fields.name"), width: 180 }, { dataIndex: "key", render: (value, row) => <Tooltip content={String(value)}><Tag className="iam-role-key-tag" color="blue"><span className="iam-role-key-text" data-testid={`role-key-${row.id}`}>{String(value)}</span></Tag></Tooltip>, title: t("pages.iam.role.fields.key"), width: 220 },
    { dataIndex: "dataScope", render: (_, row) => dataScopeLabel(row), title: t("pages.iam.role.fields.dataScope"), width: 120 },
    { dataIndex: "sort", title: t("pages.common.sort"), width: 80 },
    { dataIndex: "status", render: (_, row) => renderStatus(row), title: t("pages.common.status"), width: 90 },
    { dataIndex: "createdAt", render: (value) => formatTimestamp(value as number | null, i18n.resolvedLanguage || "en-US"), title: t("pages.common.createdAt"), width: 180 },
    {
      fixed: "right",
      render: (_, row) => row.id === 1 ? null : (
        <Space>
          {hasPermission(permissions, "system:role:edit") ? <Button onClick={() => setDrawerId(row.id)} theme="borderless">{t("pages.common.edit")}</Button> : null}
          {hasPermission(permissions, "system:role:edit") || hasPermission(permissions, "system:role:remove") ? (
            <Dropdown
              onVisibleChange={(visible) => setOpenActionMenuId(visible ? row.id : undefined)}
              render={(
                <Dropdown.Menu>
                  {hasPermission(permissions, "system:role:edit") ? <Dropdown.Item onClick={() => { setOpenActionMenuId(undefined); navigate(`/system/role-auth/user/${row.id}`); }}>{t("pages.iam.role.actions.authorizeUsers")}</Dropdown.Item> : null}
                  {hasPermission(permissions, "system:role:remove") ? <Dropdown.Item><Popconfirm content={t("pages.iam.role.messages.deleteConfirm")} onConfirm={() => void remove([row.id])}><span>{t("pages.common.delete")}</span></Popconfirm></Dropdown.Item> : null}
                </Dropdown.Menu>
              )}
              trigger="click"
              visible={openActionMenuId === row.id}
            >
              <Button aria-label={t("pages.common.more")} data-testid={`role-more-${row.id}`} theme="borderless">{t("pages.common.more")}</Button>
            </Dropdown>
          ) : null}
        </Space>
      ),
      title: t("pages.common.actions"),
      width: 176,
    },
  ];
  return <section className="feature-page iam-page" data-testid="role-page"><header><Typography.Title heading={3}>{t("pages.iam.role.title")}</Typography.Title></header>
    <Card><Form<SearchValues> className="iam-search-form" id="role-filter-form" key={searchFormKey} layout="horizontal" onSubmit={(values) => setParams((current) => ({ ...current, ...values, page: 1 }))}><Form.Input data-testid="role-name-search-input" field="name" id="role-filter-name" label={t("pages.iam.role.fields.name")} /><Form.Input field="key" id="role-filter-key" label={t("pages.iam.role.fields.key")} /><Form.Select field="status" id="role-filter-status" label={t("pages.common.status")} optionList={[{ label: t("pages.common.enabled"), value: 1 }, { label: t("pages.common.disabled"), value: 0 }]} /><Button htmlType="reset" onClick={() => { setParams((current) => ({ page: 1, size: current.size })); setSearchFormKey((value) => value + 1); }}>{t("pages.common.reset")}</Button><Button htmlType="submit" theme="solid" type="primary">{t("pages.common.search")}</Button></Form></Card>
    <Card><div className="iam-toolbar"><Space>{hasPermission(permissions, "system:role:add") ? <Button onClick={() => setDrawerId("new")} theme="solid" type="primary">{t("pages.common.add")}</Button> : null}{hasPermission(permissions, "system:role:remove") ? <Button disabled={!selected.length} onClick={() => Modal.confirm({ content: t("pages.iam.role.messages.batchDeleteConfirm", { count: selected.length }), onOk: () => remove(selected), title: t("pages.common.confirmTitle") })} type="danger">{t("pages.common.delete")}</Button> : null}</Space></div>
      <div className="responsive-desktop-table" data-testid="role-table"><Table<Role> columns={columns} dataSource={query.data?.list ?? []} loading={query.isPending} onChange={({ pagination }) => setParams((current) => ({ ...current, page: pagination?.currentPage ?? current.page, size: pagination?.pageSize ?? current.size }))} pagination={{ currentPage: params.page, pageSize: params.size, showSizeChanger: true, total: query.data?.total ?? 0 }} rowKey="id" rowSelection={{ getCheckboxProps: (row) => ({ disabled: row?.id === 1 }), onChange: (keys) => setSelected((keys ?? []).map(Number)), selectedRowKeys: selected }} scroll={{ x: 1350 }} /></div>
      <MobileRecordList testId="role-mobile-list">{(query.data?.list ?? []).map((row) => <MobileRecordCard key={row.id} testId={`role-mobile-card-${row.id}`}><MobileRecordTitle>{row.name}</MobileRecordTitle><MobileRecordFields><MobileRecordField label={t("pages.iam.role.fields.key")} value={row.key} /><MobileRecordField label={t("pages.iam.role.fields.dataScope")} value={dataScopeLabel(row)} /><MobileRecordField label={t("pages.common.status")} value={renderStatus(row)} /></MobileRecordFields><MobileRecordActions>{renderActions(row)}</MobileRecordActions></MobileRecordCard>)}</MobileRecordList>
    </Card><RoleDrawer api={api} capabilities={capabilities} menuApi={menuApi} onClose={() => setDrawerId(undefined)} onSaved={refresh} open={drawerId !== undefined} roleId={drawerId === "new" ? undefined : drawerId} /></section>;
}
