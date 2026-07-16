import { IconHelpCircle } from "@douyinfe/semi-icons";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Switch from "@douyinfe/semi-ui/lib/es/switch";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Tooltip from "@douyinfe/semi-ui/lib/es/tooltip";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { createSystemPluginApi, type PluginItem } from "#/api/system/plugin";
import { useWorkbenchRuntime } from "#/app/workbench-runtime-context";
import { useAuthContext, useAuthContextRefresh } from "#/auth/auth-context";
import type { GovernanceMode } from "#/features/plugins/plugin-governance-dialog";
import { formatTimestamp } from "#/shared/format";

const PluginGovernanceDialog = lazy(() => import("#/features/plugins/plugin-governance-dialog"));

interface Filters {
  id?: string;
  installed?: number;
  name?: string;
  status?: number;
  type?: string;
}

type HelpColumn = "mockData" | "runtimeState" | "supportsMultiTenant" | "tenantProvisioning" | "type";

function can(values: readonly string[], permission: string) {
  return values.includes("*") || values.includes(permission);
}

function isBuiltin(row: PluginItem) {
  return row.distribution === "builtin";
}

function isTenantPolicySupported(row: PluginItem) {
  return !isBuiltin(row)
    && row.supportsMultiTenant === true
    && row.scopeNature === "tenant_aware"
    && row.installMode === "tenant_scoped";
}

function effectiveVersion(row: PluginItem) {
  return row.effectiveVersion || row.version || "-";
}

function discoveredVersion(row: PluginItem) {
  return row.discoveredVersion || row.version || "-";
}

function ColumnHeader({ help, label, testId }: { help: string; label: string; testId: string }) {
  return (
    <span className="plugin-column-heading">
      {label}
      <Tooltip content={help}>
        <IconHelpCircle aria-label={`${label} help`} data-testid={testId} />
      </Tooltip>
    </span>
  );
}

export default function PluginPage() {
  const { apiClient } = useWorkbenchRuntime();
  const auth = useAuthContext();
  const refreshAuth = useAuthContextRefresh();
  const queryClient = useQueryClient();
  const { i18n, t } = useTranslation();
  const api = useMemo(() => createSystemPluginApi(apiClient), [apiClient]);
  const permissions = auth?.user.permissions ?? [];
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({});
  const [formKey, setFormKey] = useState(0);
  const [searchExpanded, setSearchExpanded] = useState(true);
  const [dialog, setDialog] = useState<GovernanceMode>();
  const [dialogPlugin, setDialogPlugin] = useState<PluginItem>();
  const [statusPending, setStatusPending] = useState<Record<string, boolean>>({});
  const [statusOverrides, setStatusOverrides] = useState<Record<string, number>>({});

  const list = useQuery({
    queryFn: () => api.list({ ...filters, pageNum: page, pageSize: 10 }),
    queryKey: ["plugins", "management", filters, page],
  });
  const rows = (list.data?.list ?? []).map((row) => ({
    ...row,
    enabled: statusOverrides[row.id] ?? row.enabled,
  }));

  async function refresh() {
    await Promise.all([
      list.refetch(),
      refreshAuth?.(),
      queryClient.invalidateQueries({ queryKey: ["plugin-ui"] }),
    ]);
    setStatusOverrides({});
  }

  async function open(mode: GovernanceMode, row?: PluginItem) {
    setDialog(undefined);
    setDialogPlugin(undefined);
    if (!row) {
      setDialog(mode);
      return;
    }
    try {
      const detail = await api.detail(row.id);
      setDialogPlugin(detail);
      setDialog(mode);
    } catch (error) {
      Toast.error(error instanceof Error ? error.message : t("pages.plugins.detailFailed"));
    }
  }

  async function changeStatus(row: PluginItem, enabled: boolean) {
    if (isBuiltin(row) || statusPending[row.id]) {
      return;
    }
    if (enabled && row.authorizationRequired === 1 && row.authorizationStatus !== "confirmed") {
      await open("enable", row);
      return;
    }
    if (!enabled && row.autoEnableManaged === 1) {
      const confirmed = await new Promise<boolean>((resolve) => {
        const actionLabel = t("pages.plugins.disable");
        Modal.confirm({
          cancelText: t("pages.common.cancel"),
          content: t("pages.plugins.autoEnableRuntimeHint", { actionLabel }),
          okText: t("pages.plugins.continueAction", { actionLabel }),
          onCancel: () => resolve(false),
          onOk: () => resolve(true),
          title: t("pages.plugins.autoEnableConfirmTitle", { actionLabel }),
        });
      });
      if (!confirmed) {
        return;
      }
    }
    const previous = row.enabled;
    setStatusOverrides((current) => ({ ...current, [row.id]: enabled ? 1 : 0 }));
    setStatusPending((current) => ({ ...current, [row.id]: true }));
    try {
      if (enabled) {
        await api.enable(row.id);
      } else {
        await api.disable(row.id);
      }
      Toast.success(t(enabled ? "pages.plugins.enabledSuccess" : "pages.plugins.disabledSuccess"));
      await refresh();
    } catch (error) {
      setStatusOverrides((current) => ({ ...current, [row.id]: previous }));
      Toast.error(error instanceof Error ? error.message : t("pages.plugins.actionFailed"));
    } finally {
      setStatusPending((current) => {
        const next = { ...current };
        delete next[row.id];
        return next;
      });
    }
  }

  async function updatePolicy(row: PluginItem, enabled: boolean) {
    try {
      await api.policy(row.id, enabled);
      Toast.success(t("pages.plugins.tenantPolicyUpdated"));
      await refresh();
    } catch (error) {
      Toast.error(error instanceof Error ? error.message : t("pages.plugins.actionFailed"));
    }
  }

  async function sync() {
    const result = await api.sync();
    Toast.success(t("pages.plugins.synced", { total: result.total }));
    await refresh();
  }

  function typeLabel(type: string) {
    return type === "dynamic" ? t("pages.plugins.dynamic") : t("pages.plugins.source");
  }

  function runtimeLabel(state: string | undefined) {
    const labels: Record<string, string> = {
      abnormal: t("pages.plugins.runtime.abnormal"),
      normal: t("pages.plugins.runtime.normal"),
      pending_upgrade: t("pages.plugins.runtime.pendingUpgrade"),
      upgrade_failed: t("pages.plugins.runtime.upgradeFailed"),
      upgrade_running: t("pages.plugins.runtime.upgradeRunning"),
    };
    return labels[state || "normal"] ?? state ?? "-";
  }

  function help(name: HelpColumn) {
    return t(`pages.plugins.columnHelp.${name}`);
  }

  const columns: ColumnProps<PluginItem>[] = [
    {
      dataIndex: "id",
      render: (value, row) => <span data-testid={`plugin-id-${row.id}`}>{String(value)}</span>,
      title: t("pages.plugins.id"),
      width: 220,
    },
    {
      dataIndex: "name",
      render: (value, row) => (
        <span className="plugin-name-cell" data-testid={`plugin-name-cell-${row.id}`}>
          <span className="plugin-name-label" title={String(value)}>{String(value)}</span>
          {row.autoEnableManaged === 1 ? (
            <Tooltip content={t("pages.plugins.autoEnableManagedHint", { pluginId: row.id })}>
              <Tag color="amber" data-testid={`plugin-auto-enable-tag-${row.id}`}>{t("pages.plugins.autoEnableBadge")}</Tag>
            </Tooltip>
          ) : null}
        </span>
      ),
      title: t("pages.plugins.name"),
      width: 200,
    },
    {
      dataIndex: "description",
      render: (value, row) => (
        <span className="plugin-description-cell" data-testid={`plugin-description-${row.id}`} title={String(value || "-")}>
          {String(value || "-")}
        </span>
      ),
      title: t("pages.plugins.description"),
      width: 280,
    },
    {
      dataIndex: "effectiveVersion",
      render: (_, row) => (
        <code className="plugin-version" data-testid={`plugin-version-${row.id}`} title={`${effectiveVersion(row)}${effectiveVersion(row) === discoveredVersion(row) ? "" : ` -> ${discoveredVersion(row)}`}`}>
          {effectiveVersion(row)}
          {effectiveVersion(row) === discoveredVersion(row) ? null : <><span> -&gt; </span><span className="plugin-version-target">{discoveredVersion(row)}</span></>}
        </code>
      ),
      title: t("pages.plugins.version"),
      width: 148,
    },
    {
      dataIndex: "type",
      render: (value) => <Tag color={value === "dynamic" ? "green" : "blue"}>{typeLabel(String(value))}</Tag>,
      title: <ColumnHeader help={help("type")} label={t("pages.plugins.type")} testId="plugin-type-column-help-icon" />,
      width: 108,
    },
    {
      dataIndex: "enabled",
      render: (value, row) => isBuiltin(row) ? null : (
        <Switch
          checked={value === 1}
          data-testid={`plugin-enabled-${row.id}`}
          disabled={row.installed !== 1 || !can(permissions, value === 1 ? "plugin:disable" : "plugin:enable") || statusPending[row.id]}
          loading={Boolean(statusPending[row.id])}
          onChange={(checked) => void changeStatus(row, checked)}
        />
      ),
      title: t("pages.common.status"),
      width: 96,
    },
    {
      dataIndex: "runtimeState",
      render: (value, row) => (
        <Tooltip content={t("pages.plugins.runtimeHint", { state: runtimeLabel(String(value || "normal")) })}>
          <Tag
            color={value === "abnormal" || value === "upgrade_failed" ? "red" : value === "pending_upgrade" ? "amber" : value === "upgrade_running" ? "blue" : "green"}
            data-testid={`plugin-runtime-state-${row.id}`}
          >
            {runtimeLabel(String(value || "normal"))}
          </Tag>
        </Tooltip>
      ),
      title: <ColumnHeader help={help("runtimeState")} label={t("pages.plugins.runtimeState")} testId="plugin-runtime-state-column-help-icon" />,
      width: 112,
    },
    {
      dataIndex: "hasMockData",
      render: (value, row) => <Tag color={value === 1 ? "green" : "grey"} data-testid={`plugin-mock-data-value-${row.id}`}>{value === 1 ? t("pages.common.yes") : t("pages.common.no")}</Tag>,
      title: <ColumnHeader help={help("mockData")} label={t("pages.plugins.hasMockData")} testId="plugin-mock-data-column-help-icon" />,
      width: 104,
    },
    {
      dataIndex: "supportsMultiTenant",
      render: (value, row) => <Tag color={value ? "green" : "grey"} data-testid={`plugin-supports-multi-tenant-${row.id}`}>{value ? t("pages.common.yes") : t("pages.common.no")}</Tag>,
      title: <ColumnHeader help={help("supportsMultiTenant")} label={t("pages.plugins.supportsMultiTenant")} testId="plugin-supports-multi-tenant-column-help-icon" />,
      width: 122,
    },
    {
      dataIndex: "autoEnableForNewTenants",
      render: (value, row) => isBuiltin(row) ? null : (
        <Tooltip content={t(isTenantPolicySupported(row) ? "pages.plugins.tenantPolicyEffective" : "pages.plugins.tenantPolicyUnsupported")}>
          <Switch
            checked={value === true}
            data-testid={`plugin-tenant-provisioning-${row.id}`}
            disabled={!isTenantPolicySupported(row) || !can(permissions, "plugin:edit")}
            onChange={(checked) => void updatePolicy(row, checked)}
            size="small"
          />
        </Tooltip>
      ),
      title: <ColumnHeader help={help("tenantProvisioning")} label={t("pages.plugins.tenantPolicy")} testId="plugin-tenant-provisioning-column-help-icon" />,
      width: 126,
    },
    {
      dataIndex: "installedAt",
      render: (value) => formatTimestamp(value as number | null, i18n.resolvedLanguage || "en-US"),
      title: t("pages.plugins.installedAt"),
      width: 180,
    },
    {
      dataIndex: "updatedAt",
      render: (value) => formatTimestamp(value as number | null, i18n.resolvedLanguage || "en-US"),
      title: t("pages.common.updatedAt"),
      width: 180,
    },
    {
      fixed: "right",
      render: (_, row) => (
        <Space>
          <Button data-testid={`plugin-detail-button-${row.id}`} onClick={() => void open("detail", row)} theme="borderless">
            {t("pages.common.detail")}
          </Button>
          {!isBuiltin(row) && row.installed !== 1 && can(permissions, "plugin:install") ? (
            <Button data-testid={`plugin-install-${row.id}`} onClick={() => void open("install", row)} theme="borderless">
              {t("pages.plugins.install")}
            </Button>
          ) : null}
          {!isBuiltin(row) && row.installed === 1 && row.upgradeAvailable && (row.runtimeState === "pending_upgrade" || row.runtimeState === "upgrade_failed") && can(permissions, "plugin:install") ? (
            <Button data-testid={`plugin-upgrade-${row.id}`} onClick={() => void open("upgrade", row)} theme="borderless">
              {t(row.runtimeState === "upgrade_failed" ? "pages.plugins.retryUpgrade" : "pages.plugins.upgrade")}
            </Button>
          ) : null}
          {!isBuiltin(row) && row.runtimeState === "abnormal" ? (
            <Tooltip content={t("pages.plugins.manualRepairHint")}>
              <span>
                <Button data-testid={`plugin-abnormal-repair-${row.id}`} disabled theme="borderless" type="danger">
                  {t("pages.plugins.manualRepair")}
                </Button>
              </span>
            </Tooltip>
          ) : null}
          {!isBuiltin(row) && row.installed === 1 && can(permissions, "plugin:uninstall") ? (
            <Button data-testid={`plugin-uninstall-${row.id}`} onClick={() => void open("uninstall", row)} theme="borderless" type="danger">
              {t("pages.plugins.uninstall")}
            </Button>
          ) : null}
        </Space>
      ),
      title: t("pages.common.actions"),
      width: 280,
    },
  ];

  return (
    <section className="feature-page" data-testid="plugin-page">
      <Typography.Title heading={3}>{t("pages.plugins.title")}</Typography.Title>
      <Card>
        <Form<Filters>
          className="iam-search-form"
          key={formKey}
          layout="horizontal"
          onSubmit={(values) => { setFilters(values); setPage(1); }}
        >
          <Form.Input field="id" label={t("pages.plugins.id")} />
          <Form.Input field="name" label={t("pages.plugins.name")} />
          <Form.Select
            field="type"
            label={t("pages.plugins.type")}
            optionList={[
              { label: t("pages.plugins.source"), value: "source" },
              { label: t("pages.plugins.dynamic"), value: "dynamic" },
            ]}
          />
          {searchExpanded ? (
            <>
              <Form.Select
                field="installed"
                label={t("pages.plugins.installed")}
                optionList={[
                  { label: t("pages.common.yes"), value: 1 },
                  { label: t("pages.common.no"), value: 0 },
                ]}
              />
              <Form.Select
                field="status"
                label={t("pages.common.status")}
                optionList={[
                  { label: t("pages.common.enabled"), value: 1 },
                  { label: t("pages.common.disabled"), value: 0 },
                ]}
              />
            </>
          ) : null}
          <Button data-testid="search-collapse-toggle" onClick={() => setSearchExpanded((value) => !value)} theme="borderless">
            {t(searchExpanded ? "pages.common.collapseSearch" : "pages.common.expandSearch")}
          </Button>
          <Button htmlType="reset" onClick={() => { setFilters({}); setFormKey((value) => value + 1); setPage(1); }}>
            {t("pages.common.reset")}
          </Button>
          <Button htmlType="submit" theme="solid" type="primary">{t("pages.common.search")}</Button>
        </Form>
      </Card>
      <Card>
        <div className="plugin-table-heading">
          <span className="plugin-table-title">
            <Typography.Title heading={5}>{t("pages.plugins.tableTitle")}</Typography.Title>
          </span>
          <Space>
            {can(permissions, "plugin:install") ? (
              <Button
                data-testid="plugin-dynamic-upload-trigger"
                onClick={() => void open("upload")}
                theme="solid"
                type="primary"
              >
                {t("pages.plugins.upload")}
              </Button>
            ) : null}
            {can(permissions, "plugin:install") ? (
              <Button data-testid="plugin-sync" onClick={() => void sync()} theme="solid" type="primary">
                {t("pages.plugins.sync")}
              </Button>
            ) : null}
          </Space>
        </div>
        <div className="plugin-table" data-testid="plugin-table">
          <Table<PluginItem>
            columns={columns}
            dataSource={rows}
            loading={list.isPending}
            pagination={{ currentPage: page, onChange: setPage, pageSize: 10, total: list.data?.total ?? 0 }}
            rowKey="id"
            scroll={{ x: 2200 }}
          />
        </div>
      </Card>
      {dialog ? (
        <Suspense fallback={<p role="status">{t("pages.common.loading")}</p>}>
          <PluginGovernanceDialog
            allowInstallAndEnable={can(permissions, "plugin:install") && can(permissions, "plugin:enable")}
            api={api}
            key={`${dialog}-${dialogPlugin?.id ?? "none"}`}
            mode={dialog}
            onClose={() => { setDialog(undefined); setDialogPlugin(undefined); }}
            onSaved={refresh}
            open
            plugin={dialogPlugin}
          />
        </Suspense>
      ) : null}
    </section>
  );
}
