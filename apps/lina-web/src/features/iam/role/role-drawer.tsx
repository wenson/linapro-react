import Banner from "@douyinfe/semi-ui/lib/es/banner";
import Button from "@douyinfe/semi-ui/lib/es/button";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import RadioGroup from "@douyinfe/semi-ui/lib/es/radio/radioGroup";
import SideSheet from "@douyinfe/semi-ui/lib/es/sideSheet";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Tree from "@douyinfe/semi-ui/lib/es/tree";
import type { Value } from "@douyinfe/semi-ui/lib/es/tree/interface";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { MenuTreeNode, SystemMenuApi } from "#/api/system/menu";
import type { Role, SystemRoleApi } from "#/api/system/role";
import {
  getDataScopeOptions,
  getDefaultDataScope,
  normalizeDataScope,
} from "#/features/iam/role/data-scope";
import { shouldUseAssociatedMenuSelection } from "#/features/iam/role/menu-selection";
import type { CapabilityProjection } from "#/plugins/capabilities";
import { formatMenuPermissionLabel } from "#/shared/permission-display";
import { toSemiTree } from "#/shared/tree";

const PERMISSION_GUIDE_STORAGE_KEY = "menu_select_fullscreen_read";

function selectedKeys(value: Value | undefined): number[] {
  const items = Array.isArray(value) ? value : value === undefined ? [] : [value];
  return items
    .map((item) => typeof item === "object" ? Number(item.value ?? item.key) : Number(item))
    .filter(Number.isFinite);
}

interface RoleDrawerProps {
  api: SystemRoleApi;
  capabilities: CapabilityProjection;
  menuApi: SystemMenuApi;
  onClose(): void;
  onSaved(): Promise<void>;
  open: boolean;
  roleId?: number;
}

export function RoleDrawer(props: RoleDrawerProps) {
  return <RoleDrawerSession key={`${props.open ? "open" : "closed"}-${props.roleId ?? "new"}`} {...props} />;
}

function RoleDrawerSession({ api, capabilities, menuApi, onClose, onSaved, open, roleId }: RoleDrawerProps) {
  const { t } = useTranslation();
  const [dirty, setDirty] = useState(false);
  const detail = useQuery({
    enabled: open && Boolean(roleId),
    queryFn: () => api.get(roleId!),
    queryKey: ["iam", "role", roleId],
  });
  const menus = useQuery({
    enabled: open,
    queryFn: () => menuApi.getTreeSelect(),
    queryKey: ["iam", "menu-tree-select"],
  });

  function closeNow() {
    setDirty(false);
    onClose();
  }

  function requestClose() {
    if (!dirty) {
      closeNow();
      return;
    }
    Modal.confirm({
      cancelText: t("pages.common.cancel"),
      content: t("pages.iam.role.messages.discardChangesConfirm"),
      okText: t("pages.common.confirm"),
      onOk: closeNow,
      title: t("pages.common.confirmTitle"),
    });
  }

  const pending = menus.isPending || Boolean(roleId && detail.isPending);
  const role = detail.data;
  return (
    <SideSheet
      onCancel={requestClose}
      title={t(roleId ? "pages.iam.role.editTitle" : "pages.iam.role.createTitle")}
      visible={open}
      width={720}
    >
      {open && pending ? <Spin aria-label={t("pages.common.loading")} /> : null}
      {open && !pending ? (
        <RoleDrawerForm
          api={api}
          capabilities={capabilities}
          key={`${roleId ?? "new"}-${role?.updatedAt ?? 0}`}
          menus={menus.data ?? []}
          onClose={requestClose}
          onDirty={() => setDirty(true)}
          onSaved={async () => {
            setDirty(false);
            await onSaved();
            closeNow();
          }}
          role={role}
          roleId={roleId}
        />
      ) : null}
    </SideSheet>
  );
}

function RoleDrawerForm({ api, capabilities, menus, onClose, onDirty, onSaved, role, roleId }: {
  api: SystemRoleApi;
  capabilities: CapabilityProjection;
  menus: MenuTreeNode[];
  onClose(): void;
  onDirty(): void;
  onSaved(): Promise<void>;
  role?: Role;
  roleId?: number;
}) {
  const { i18n, t } = useTranslation();
  const initialMenuIds = role?.menuIds ?? [];
  const [menuIds, setMenuIds] = useState<number[]>(initialMenuIds);
  const [association, setAssociation] = useState(
    shouldUseAssociatedMenuSelection(menus, initialMenuIds),
  );
  const [guideOpen, setGuideOpen] = useState(
    () => localStorage.getItem(PERMISSION_GUIDE_STORAGE_KEY) !== "true",
  );

  function dismissGuide() {
    localStorage.setItem(PERMISSION_GUIDE_STORAGE_KEY, "true");
    setGuideOpen(false);
  }

  async function submit(values: Partial<Role>) {
    const payload = {
      ...values,
      dataScope: normalizeDataScope(Number(values.dataScope), capabilities),
      menuIds,
    };
    try {
      if (roleId) await api.update(roleId, payload); else await api.create(payload);
      Toast.success(t(roleId ? "pages.common.updateSuccess" : "pages.common.createSuccess"));
      await onSaved();
    } catch (error) {
      Toast.error(error instanceof Error && error.message ? error.message : t("pages.common.loadFailed"));
    }
  }

  return (
    <Form<Partial<Role>>
      data-testid="role-drawer-form"
      initValues={role ? { ...role, dataScope: normalizeDataScope(role.dataScope, capabilities) } : { dataScope: getDefaultDataScope(capabilities), sort: 0, status: 1 }}
      labelPosition="top"
      onSubmit={submit}
      onValueChange={onDirty}
    >
      <Form.Input field="name" label={t("pages.iam.role.fields.name")} rules={[{ required: true, message: t("pages.iam.role.validation.name") }]} />
      <Form.Input field="key" label={t("pages.iam.role.fields.key")} rules={[{ required: true, message: t("pages.iam.role.validation.key") }]} />
      <Form.InputNumber field="sort" label={t("pages.common.sort")} min={0} />
      <Form.RadioGroup field="status" label={t("pages.common.status")} options={[{ label: t("pages.common.enabled"), value: 1 }, { label: t("pages.common.disabled"), value: 0 }]} />
      <Form.Select field="dataScope" label={t("pages.iam.role.fields.dataScope")} optionList={getDataScopeOptions(capabilities).map((option) => ({ label: t(option.labelKey), value: option.value }))} />
      <Form.TextArea field="remark" label={t("pages.common.remark")} rows={3} />
      <div className="iam-tree-field">
        <span>{t("pages.iam.role.fields.menuPermissions")}</span>
        {guideOpen ? (
          <Banner
            closeIcon={<span aria-label={t("pages.iam.role.menuSelection.guideDismiss")}>×</span>}
            data-testid="menu-permission-guide"
            description={t("pages.iam.role.menuSelection.guide")}
            onClose={dismissGuide}
            type="info"
          />
        ) : null}
        <div className="menu-permission-toolbar" data-testid="menu-permission-toolbar">
          <div
            data-selection-mode={association ? "linked" : "independent"}
            data-testid="menu-permission-association-mode"
          >
            <RadioGroup
              aria-label={t("pages.iam.role.menuSelection.mode")}
              onChange={(event) => {
                setAssociation(event.target.value === "linked");
                onDirty();
              }}
              options={[
                { label: t("pages.iam.role.menuSelection.linked"), value: "linked" },
                { label: t("pages.iam.role.menuSelection.independent"), value: "independent" },
              ]}
              type="button"
              value={association ? "linked" : "independent"}
            />
          </div>
          <div className="permission-selection-count" data-testid="menu-permission-selected-count">
            {t("pages.iam.role.menuSelection.selected", { count: menuIds.length })}
          </div>
        </div>
        <div className="menu-permission-tree" data-testid="menu-permission-tree">
          <Tree
            autoMergeValue={false}
            checkRelation={association ? "related" : "unRelated"}
            defaultExpandAll
            multiple
            onChange={(value) => {
              setMenuIds(selectedKeys(value));
              onDirty();
            }}
            showClear
            showLine
            treeData={toSemiTree<MenuTreeNode>(
              menus,
              (node) => node.id,
              (node) => formatMenuPermissionLabel(
                node.label,
                t,
                i18n.resolvedLanguage || "en-US",
              ),
            )}
            value={menuIds}
          />
        </div>
      </div>
      <div className="iam-form-actions">
        <Button onClick={onClose}>{t("pages.common.cancel")}</Button>
        <Button htmlType="submit" theme="solid" type="primary">{t("pages.common.save")}</Button>
      </div>
    </Form>
  );
}
