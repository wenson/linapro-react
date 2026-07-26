import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import Checkbox from "@douyinfe/semi-ui/lib/es/checkbox";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
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

import { createSystemMenuApi, type Menu, type MenuListParams } from "#/api/system/menu";
import { useWorkbenchRuntime } from "#/app/workbench-runtime-context";
import { useAuthContext } from "#/auth/auth-context";
import { useAuthContextRefresh } from "#/auth/auth-context";
import { MenuDrawer } from "#/features/iam/menu/menu-drawer";
import { workbenchIcon } from "#/layout/icon-map";
import { MobileRecordActions, MobileRecordCard, MobileRecordField, MobileRecordFields, MobileRecordList, MobileRecordTitle } from "#/plugin-ui/mobile-record";
import { DictTag } from "#/features/settings/dict/dict-options";
import { formatTimestamp } from "#/shared/format";
import { formatMenuPermissionShortLabel } from "#/shared/permission-display";

interface DrawerState { menuId?: number; parentId?: number }
function hasPermission(values: readonly string[], permission: string) { return values.includes("*") || values.includes(permission); }
function flattenMenuCards(rows: readonly Menu[], depth = 0): Array<{ depth: number; row: Menu }> { return rows.flatMap((row) => [{ depth, row }, ...flattenMenuCards(row.children ?? [], depth + 1)]); }

export default function MenuPage() {
  const { apiClient } = useWorkbenchRuntime(); const auth = useAuthContext(); const refreshAuthContext = useAuthContextRefresh(); const { i18n, t } = useTranslation(); const api = useMemo(() => createSystemMenuApi(apiClient), [apiClient]);
  const permissions = auth?.user.permissions ?? []; const [params, setParams] = useState<MenuListParams>({}); const [searchFormKey, setSearchFormKey] = useState(0); const [drawer, setDrawer] = useState<DrawerState>(); const [cascade, setCascade] = useState(false); const [expandAll, setExpandAll] = useState(false);
  const query = useQuery({ queryFn: () => api.list(params), queryKey: ["iam", "menus", params] }); async function refresh() { await Promise.all([query.refetch(), refreshAuthContext?.()]); }
  async function remove(row: Menu) { await api.delete(row.id, cascade); Toast.success(t("pages.common.deleteSuccess")); await refresh(); }
  const typeKeys = { B: "button", D: "directory", M: "menu" } as const;
  function typeLabel(row: Menu) { return t(`pages.iam.menu.types.${typeKeys[row.type]}`); }
  function renderActions(row: Menu) { return <>{hasPermission(permissions, "system:menu:edit") ? <Button onClick={() => setDrawer({ menuId: row.id })} theme="borderless">{t("pages.common.edit")}</Button> : null}{row.type !== "B" && hasPermission(permissions, "system:menu:add") ? <Button onClick={() => setDrawer({ parentId: row.id })} theme="borderless">{t("pages.iam.menu.actions.addChild")}</Button> : null}{hasPermission(permissions, "system:menu:remove") ? <Popconfirm content={cascade ? t("pages.iam.menu.messages.cascadeDeleteConfirm", { name: row.name }) : t("pages.iam.menu.messages.deleteConfirm", { name: row.name })} onConfirm={() => void remove(row)}><Button theme="borderless" type="danger">{t("pages.common.delete")}</Button></Popconfirm> : null}</>; }
  const columns: ColumnProps<Menu>[] = [
    { dataIndex: "name", render: (value) => formatMenuPermissionShortLabel(String(value), t, i18n.resolvedLanguage || "en-US"), title: t("pages.iam.menu.fields.name"), width: 220 },
    { dataIndex: "status", render: (value, row) => <span data-testid={`menu-status-${row.id}`}><DictTag dictType="sys_normal_disable" value={String(value)} /></span>, title: t("pages.common.status"), width: 100 },
    { dataIndex: "visible", render: (value) => t(value === 1 ? "pages.common.yes" : "pages.common.no"), title: t("pages.iam.menu.fields.visible"), width: 100 },
    { dataIndex: "icon", render: (value) => <span aria-label={`${t("pages.iam.menu.fields.icon")}: ${String(value || "default")}`} className="menu-icon-preview" role="img">{workbenchIcon(String(value || ""))}</span>, title: t("pages.iam.menu.fields.icon"), width: 100 }, { dataIndex: "sort", title: t("pages.common.sort"), width: 80 },
    { dataIndex: "type", render: (_, row) => <Tag>{typeLabel(row)}</Tag>, title: t("pages.iam.menu.fields.type"), width: 110 },
    { dataIndex: "perms", title: t("pages.iam.menu.fields.permission"), width: 180 }, { dataIndex: "component", title: t("pages.iam.menu.fields.component"), width: 200 },
    { dataIndex: "createdAt", render: (value) => formatTimestamp(value as number | null, i18n.resolvedLanguage || "en-US"), title: t("pages.common.createdAt"), width: 180 },
    { render: (_, row) => <Space>{renderActions(row)}</Space>, title: t("pages.common.actions"), width: 260 },
  ];
  return <section className="feature-page iam-page" data-testid="menu-page"><header><Typography.Title heading={3}>{t("pages.iam.menu.title")}</Typography.Title></header><Card><Form<MenuListParams> className="iam-search-form" key={searchFormKey} layout="horizontal" onSubmit={setParams}><Form.Input field="name" label={t("pages.iam.menu.fields.name")} /><Form.Select field="status" label={t("pages.common.status")} optionList={[{ label: t("pages.common.enabled"), value: 1 }, { label: t("pages.common.disabled"), value: 0 }]} /><Form.Select field="visible" label={t("pages.iam.menu.fields.visible")} optionList={[{ label: t("pages.common.yes"), value: 1 }, { label: t("pages.common.no"), value: 0 }]} /><Button htmlType="reset" onClick={() => { setParams({}); setSearchFormKey((value) => value + 1); }}>{t("pages.common.reset")}</Button><Button htmlType="submit" theme="solid" type="primary">{t("pages.common.search")}</Button></Form></Card><Card><div className="iam-toolbar"><Space>{hasPermission(permissions, "system:menu:add") ? <Button onClick={() => setDrawer({})} theme="solid" type="primary">{t("pages.common.add")}</Button> : null}<Button onClick={() => setExpandAll((value) => !value)}>{t(expandAll ? "pages.common.collapse" : "pages.common.expand")}</Button><Checkbox checked={cascade} onChange={(event) => setCascade(Boolean(event.target.checked))}>{t("pages.iam.menu.fields.cascadeDelete")}</Checkbox></Space></div><div className="responsive-desktop-table" data-testid="menu-table"><Table<Menu> columns={columns} dataSource={query.data ?? []} defaultExpandAllRows={false} expandAllRows={expandAll} loading={query.isPending} pagination={false} rowKey="id" scroll={{ x: 1400 }} /></div><MobileRecordList testId="menu-mobile-list">{flattenMenuCards(query.data ?? []).filter(({ depth }) => expandAll || depth === 0).map(({ depth, row }) => <MobileRecordCard key={row.id} testId={`menu-mobile-card-${row.id}`}><div style={{ paddingInlineStart: `${depth * 16}px` }}><MobileRecordTitle>{formatMenuPermissionShortLabel(row.name, t, i18n.resolvedLanguage || "en-US")}</MobileRecordTitle><MobileRecordFields><MobileRecordField label={t("pages.iam.menu.fields.type")} value={typeLabel(row)} /><MobileRecordField label={t("pages.common.status")} value={<DictTag dictType="sys_normal_disable" value={String(row.status)} />} /><MobileRecordField label={t("pages.iam.menu.fields.permission")} value={row.perms || t("pages.common.none")} /></MobileRecordFields><MobileRecordActions>{renderActions(row)}</MobileRecordActions></div></MobileRecordCard>)}</MobileRecordList></Card><MenuDrawer api={api} menuId={drawer?.menuId} onClose={() => setDrawer(undefined)} onSaved={refresh} open={drawer !== undefined} parentId={drawer?.parentId} /></section>;
}
