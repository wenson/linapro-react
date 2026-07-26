import Button from "@douyinfe/semi-ui/lib/es/button";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import SideSheet from "@douyinfe/semi-ui/lib/es/sideSheet";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { Menu, MenuType, SystemMenuApi } from "#/api/system/menu";
import { descendantIds, filterTree, toSemiTree } from "#/shared/tree";

export function MenuDrawer({ api, menuId, onClose, onSaved, open, parentId }: {
  api: SystemMenuApi; menuId?: number; onClose(): void; onSaved(): Promise<void>; open: boolean; parentId?: number;
}) {
  const { t } = useTranslation();
  const detail = useQuery({ enabled: open && Boolean(menuId), queryFn: () => api.get(menuId!), queryKey: ["iam", "menu", menuId] });
  const menuTree = useQuery({ enabled: open, queryFn: () => api.list({}), queryKey: ["iam", "menus", "drawer"] });
  const record = detail.data;
  return <SideSheet onCancel={onClose} title={t(menuId ? "pages.iam.menu.editTitle" : "pages.iam.menu.createTitle")} visible={open} width="min(620px, 100vw)">
    {menuId && detail.isPending ? <Spin aria-label={t("pages.common.loading")} /> : <MenuDrawerForm api={api} key={`${menuId ?? "new"}-${record?.updatedAt ?? 0}`} menuId={menuId} menus={menuTree.data ?? []} onClose={onClose} onSaved={onSaved} parentId={parentId} record={record} />}
  </SideSheet>;
}

function MenuDrawerForm({ api, menuId, menus, onClose, onSaved, parentId, record }: {
  api: SystemMenuApi; menuId?: number; menus: Menu[]; onClose(): void; onSaved(): Promise<void>; parentId?: number; record?: Menu;
}) {
  const { t } = useTranslation();
  const [type, setType] = useState<MenuType>(record?.type ?? "D");
  async function submit(values: Partial<Menu>) {
    const payload = { ...values, type };
    if (type === "B") { payload.component = ""; payload.icon = ""; payload.isCache = 0; payload.isFrame = 0; payload.path = ""; }
    if (type === "D") payload.perms = "";
    try {
      if (menuId) await api.update(menuId, payload); else await api.create(payload);
      Toast.success(t(menuId ? "pages.common.updateSuccess" : "pages.common.createSuccess")); await onSaved(); onClose();
    } catch (error) {
      Toast.error(error instanceof Error && error.message ? error.message : t("pages.common.loadFailed"));
    }
  }
  const unavailable = menuId ? descendantIds<Menu>(menus, (node) => node.id, menuId) : new Set<number>();
  const parentTree = toSemiTree<Menu>(filterTree(menus, (node) => node.type !== "B" && !unavailable.has(node.id)), (node) => node.id, (node) => node.name);
  return <Form<Partial<Menu>> initValues={record ?? { isCache: 0, isFrame: 0, parentId: parentId ?? 0, sort: 0, status: 1, type: "D", visible: 1 }} labelPosition="top" onSubmit={submit}>
      <Form.TreeSelect field="parentId" label={t("pages.iam.menu.fields.parent")} rules={[{ required: true, message: t("pages.iam.menu.validation.parent") }]} treeData={[{ children: parentTree, key: "0", label: t("pages.iam.menu.root"), value: 0 }]} />
      <Form.RadioGroup field="type" label={t("pages.iam.menu.fields.type")} onChange={(event) => setType(event.target.value as MenuType)} options={[{ label: t("pages.iam.menu.types.directory"), value: "D" }, { label: t("pages.iam.menu.types.menu"), value: "M" }, { label: t("pages.iam.menu.types.button"), value: "B" }]} />
      <Form.Input field="name" label={t("pages.iam.menu.fields.name")} rules={[{ required: true, message: t("pages.iam.menu.validation.name") }]} />
      {type !== "B" ? <Form.Input field="icon" label={t("pages.iam.menu.fields.icon")} /> : null}
      {type !== "D" ? <Form.Input field="perms" label={t("pages.iam.menu.fields.permission")} rules={[{ required: true, message: t("pages.iam.menu.validation.permission") }]} /> : null}
      {type !== "B" ? <Form.Input field="path" label={t("pages.iam.menu.fields.path")} rules={[{ required: true, message: t("pages.iam.menu.validation.path") }]} /> : null}
      {type === "M" ? <Form.Input field="component" label={t("pages.iam.menu.fields.component")} rules={[{ required: true, message: t("pages.iam.menu.validation.component") }]} /> : null}
      <Form.InputNumber field="sort" label={t("pages.common.sort")} min={0} />
      {type !== "B" ? <><Form.RadioGroup field="isFrame" label={t("pages.iam.menu.fields.external")} options={[{ label: t("pages.common.yes"), value: 1 }, { label: t("pages.common.no"), value: 0 }]} /><Form.RadioGroup field="visible" label={t("pages.iam.menu.fields.visible")} options={[{ label: t("pages.common.yes"), value: 1 }, { label: t("pages.common.no"), value: 0 }]} /><Form.RadioGroup field="isCache" label={t("pages.iam.menu.fields.cache")} options={[{ label: t("pages.common.yes"), value: 1 }, { label: t("pages.common.no"), value: 0 }]} /></> : null}
      <Form.RadioGroup field="status" label={t("pages.common.status")} options={[{ label: t("pages.common.enabled"), value: 1 }, { label: t("pages.common.disabled"), value: 0 }]} />
      <Form.TextArea field="remark" label={t("pages.common.remark")} rows={3} />
      <div className="iam-form-actions"><Button onClick={onClose}>{t("pages.common.cancel")}</Button><Button htmlType="submit" theme="solid" type="primary">{t("pages.common.save")}</Button></div>
    </Form>;
}
