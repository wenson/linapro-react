import { IconHelpCircle } from "@douyinfe/semi-icons";
import Banner from "@douyinfe/semi-ui/lib/es/banner";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Checkbox from "@douyinfe/semi-ui/lib/es/checkbox";
import Descriptions from "@douyinfe/semi-ui/lib/es/descriptions";
import Input from "@douyinfe/semi-ui/lib/es/input";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Select from "@douyinfe/semi-ui/lib/es/select";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Tooltip from "@douyinfe/semi-ui/lib/es/tooltip";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import Upload from "@douyinfe/semi-ui/lib/es/upload";
import type { FileItem, OnChangeProps } from "@douyinfe/semi-ui/lib/es/upload/interface";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ApiError } from "#/api/contracts";
import {
  authorizationPayload,
  type PluginItem,
  type UpgradePreview,
} from "#/api/system/plugin";
import {
  DependencySummary,
  HostServiceReview,
  RouteReviewList,
} from "#/features/plugins/plugin-governance-sections";
import type { ReturnTypeOfPluginApi } from "#/features/plugins/types";
import { formatTimestamp } from "#/shared/format";

export type GovernanceMode = "detail" | "enable" | "install" | "uninstall" | "upgrade" | "upload";

interface PluginGovernanceDialogProps {
  allowInstallAndEnable: boolean;
  api: ReturnTypeOfPluginApi;
  mode?: GovernanceMode;
  onClose(): void;
  onSaved(): Promise<void>;
  open: boolean;
  plugin?: PluginItem;
}

function dependencyBlocked(check: PluginItem["dependencyCheck"] | undefined) {
  return Boolean(
    check?.blockers?.length
    || check?.cycle?.length
    || check?.framework?.status === "unsatisfied",
  );
}

function uninstallBlocked(check: PluginItem["dependencyCheck"] | undefined) {
  return Boolean(check?.reverseDependents?.length || check?.reverseBlockers?.length);
}

function typeLabel(type: string, t: (key: string) => string) {
  return type === "dynamic" ? t("pages.plugins.dynamic") : t("pages.plugins.source");
}

function authorizationStatusLabel(status: string, t: (key: string) => string) {
  const keys: Record<string, string> = {
    confirmed: "pages.plugins.authorizationConfirmed",
    not_required: "pages.plugins.authorizationNotRequired",
    pending: "pages.plugins.authorizationPending",
  };
  return keys[status] ? t(keys[status]) : status || "-";
}

function scopeNatureLabel(scope: string | undefined, t: (key: string) => string) {
  if (scope === "tenant_aware") {
    return t("pages.plugins.scopeTenantAware");
  }
  if (scope === "platform_only") {
    return t("pages.plugins.scopePlatformOnly");
  }
  return scope || "-";
}

function installModeLabel(mode: string | undefined, t: (key: string) => string) {
  if (mode === "tenant_scoped") {
    return t("pages.plugins.tenantScopedMode");
  }
  if (mode === "global") {
    return t("pages.plugins.globalMode");
  }
  return mode || "-";
}

function runtimeStateLabel(state: string | undefined, t: (key: string) => string) {
  const keys: Record<string, string> = {
    abnormal: "pages.plugins.runtime.abnormal",
    normal: "pages.plugins.runtime.normal",
    pending_upgrade: "pages.plugins.runtime.pendingUpgrade",
    upgrade_failed: "pages.plugins.runtime.upgradeFailed",
    upgrade_running: "pages.plugins.runtime.upgradeRunning",
  };
  return keys[state || "normal"] ? t(keys[state || "normal"]!) : state || "-";
}

export default function PluginGovernanceDialog({
  allowInstallAndEnable,
  api,
  mode,
  onClose,
  onSaved,
  open,
  plugin,
}: PluginGovernanceDialogProps) {
  const { i18n, t } = useTranslation();
  const [installMode, setInstallMode] = useState(
    plugin?.installMode || (plugin?.supportsMultiTenant ? "tenant_scoped" : "global"),
  );
  const [mockData, setMockData] = useState(false);
  const [purge, setPurge] = useState(true);
  const [forceReasons, setForceReasons] = useState<string[]>([]);
  const [forceText, setForceText] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [overwrite, setOverwrite] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadSucceeded, setUploadSucceeded] = useState(false);
  const [visible, setVisible] = useState(false);
  const dependencyErrorShown = useRef(false);

  const dependency = useQuery({
    enabled: open && Boolean(plugin) && (mode === "install" || mode === "uninstall"),
    queryFn: () => api.dependency(plugin!.id),
    queryKey: ["plugins", "dependency", plugin?.id, mode],
    retry: false,
  });
  const preview = useQuery({
    enabled: open && Boolean(plugin) && mode === "upgrade",
    queryFn: () => api.upgradePreview(plugin!.id),
    queryKey: ["plugins", "upgrade-preview", plugin?.id],
    retry: false,
  });

  useEffect(() => {
    if (dependency.isError && !dependencyErrorShown.current) {
      dependencyErrorShown.current = true;
      Toast.error(t("pages.plugins.dependencyRefreshFailed"));
    }
  }, [dependency.isError, t]);

  useEffect(() => {
    // Semi Modal needs one committed frame before an on-demand portal opens.
    const frame = window.requestAnimationFrame(() => setVisible(open));
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  async function finish(action: () => Promise<unknown>, message: string, close = true) {
    setSubmitting(true);
    try {
      await action();
      Toast.success(message);
      await onSaved();
      if (close) {
        onClose();
      }
      return true;
    } catch (error) {
      Toast.error(error instanceof Error && error.message ? error.message : t("pages.plugins.actionFailed"));
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function upload() {
    const file = files[0]?.fileInstance;
    if (!file) {
      return;
    }
    const succeeded = await finish(
      () => api.upload(file, overwrite),
      t("pages.plugins.uploadSuccess"),
      false,
    );
    if (succeeded) {
      setUploadSucceeded(true);
    }
  }

  function installPayload() {
    if (!plugin) {
      return undefined;
    }
    return authorizationPayload(plugin, {
      ...(mockData ? { installMockData: true } : {}),
      ...(installMode ? { installMode } : {}),
    });
  }

  async function submit(action: "default" | "install-and-enable" = "default") {
    if (mode === "upload") {
      await upload();
      return;
    }
    if (!plugin) {
      return;
    }
    if (mode === "install" && !dependencyBlocked(dependency.data)) {
      setSubmitting(true);
      try {
        await api.install(plugin.id, installPayload());
      } catch (error) {
        Toast.error(error instanceof Error && error.message ? error.message : t("pages.plugins.actionFailed"));
        setSubmitting(false);
        return;
      }

      if (action === "install-and-enable") {
        try {
          await api.enable(plugin.id, authorizationPayload(plugin));
          Toast.success(t("pages.plugins.installedAndEnabled"));
        } catch (error) {
          Toast.warning(t("pages.plugins.installSucceededEnableFailed"));
          Toast.error(error instanceof Error && error.message ? error.message : t("pages.plugins.actionFailed"));
          await onSaved();
          onClose();
          setSubmitting(false);
          return;
        }
      } else {
        Toast.success(t("pages.plugins.installedSuccess"));
      }
      await onSaved();
      onClose();
      setSubmitting(false);
    } else if (mode === "enable") {
      await finish(
        () => api.enable(plugin.id, authorizationPayload(plugin)),
        t("pages.plugins.enabledSuccess"),
      );
    } else if (mode === "upgrade" && preview.data && !upgradeBlocked(preview.data)) {
      const target = {
        ...plugin,
        requestedHostServices: preview.data.toManifest?.requestedHostServices ?? [],
      };
      await finish(
        () => api.upgrade(plugin.id, authorizationPayload(target)),
        t("pages.plugins.upgradedSuccess"),
      );
    } else if (mode === "uninstall" && !uninstallBlocked(dependency.data)) {
      setSubmitting(true);
      try {
        await api.uninstall(plugin.id, { purgeStorageData: purge });
        Toast.success(t("pages.plugins.uninstalledSuccess"));
        await onSaved();
        onClose();
      } catch (error) {
        const apiError = error as ApiError;
        const reasons = apiError.messageParams?.reasons;
        const isLifecyclePrecondition =
          apiError.messageKey === "error.plugin.lifecycle.precondition.vetoed"
          || (Array.isArray(reasons) && reasons.length > 0)
          || (typeof reasons === "string" && reasons.trim().length > 0);
        if (!isLifecyclePrecondition) {
          Toast.error(error instanceof Error && error.message ? error.message : t("pages.plugins.actionFailed"));
          return;
        }
        setForceReasons(
          Array.isArray(reasons)
            ? reasons.map(String)
            : typeof reasons === "string"
              ? reasons.split(";").map((item) => item.trim()).filter(Boolean)
              : [t("pages.plugins.preconditionDefault")],
        );
      } finally {
        setSubmitting(false);
      }
    }
  }

  async function forceUninstall() {
    if (plugin && forceText === plugin.id) {
      await finish(
        () => api.uninstall(plugin.id, { force: true, purgeStorageData: purge }),
        t("pages.plugins.uninstalledSuccess"),
      );
    }
  }

  const title = t(`pages.plugins.dialog.${mode ?? "detail"}`);
  const blockedInstall = dependencyBlocked(dependency.data);
  const blockedUninstall = uninstallBlocked(dependency.data);

  return (
    <>
      <Modal
      closeOnEsc={!submitting}
      closable={!uploadSucceeded}
      footer={null}
      onCancel={onClose}
      title={title}
      visible={visible && forceReasons.length === 0}
      width={820}
    >
      <div className="plugin-governance-dialog" data-testid={`plugin-${mode}-dialog`}>
        {mode === "detail" && plugin ? (
          <div className="plugin-governance-stack" data-testid="plugin-detail-modal">
            <Descriptions
              column={2}
              data-testid="plugin-detail-descriptions"
              data={[
                { key: t("pages.plugins.id"), value: plugin.id },
                { key: t("pages.plugins.name"), value: plugin.name },
                { key: t("pages.plugins.version"), value: plugin.effectiveVersion || plugin.version || "-" },
                { key: t("pages.plugins.type"), value: typeLabel(plugin.type, t) },
                { key: t("pages.plugins.runtimeState"), value: runtimeStateLabel(plugin.runtimeState, t) },
                { key: t("pages.plugins.effectiveVersion"), value: plugin.effectiveVersion || "-" },
                { key: t("pages.plugins.discoveredVersion"), value: plugin.discoveredVersion || "-" },
                { key: t("pages.plugins.installed"), value: plugin.installed === 1 ? t("pages.common.yes") : t("pages.common.no") },
                { key: t("pages.common.status"), value: plugin.enabled === 1 ? t("pages.common.enabled") : t("pages.common.disabled") },
                { key: t("pages.plugins.startupManagement"), value: plugin.autoEnableManaged === 1 ? t("pages.plugins.autoEnableManagedValue") : t("pages.plugins.manualManagedValue") },
                { key: t("pages.plugins.authorizationStatus"), value: authorizationStatusLabel(plugin.authorizationStatus, t) },
                { key: t("pages.plugins.hasMockData"), value: <span data-testid="plugin-detail-has-mock-data">{plugin.hasMockData === 1 ? t("pages.common.yes") : t("pages.common.no")}</span> },
                { key: t("pages.plugins.supportsMultiTenant"), value: <span data-testid="plugin-detail-supports-multi-tenant">{plugin.supportsMultiTenant ? t("pages.common.yes") : t("pages.common.no")}</span> },
                { key: t("pages.plugins.tenantPolicy"), value: <span data-testid="plugin-detail-tenant-provisioning">{plugin.autoEnableForNewTenants ? t("pages.common.yes") : t("pages.common.no")}</span> },
                { key: t("pages.plugins.scopeNature"), value: <span data-testid="plugin-detail-scope-nature">{scopeNatureLabel(plugin.scopeNature, t)}</span> },
                { key: t("pages.plugins.installMode"), value: <span data-testid="plugin-detail-install-mode">{installModeLabel(plugin.installMode, t)}</span> },
                { key: t("pages.plugins.installedAt"), value: formatTimestamp(plugin.installedAt, i18n.resolvedLanguage || "en-US") },
                { key: t("pages.common.updatedAt"), value: formatTimestamp(plugin.updatedAt, i18n.resolvedLanguage || "en-US") },
                { key: t("pages.plugins.description"), span: 2, value: <span data-testid="plugin-detail-description-row">{plugin.description || "-"}</span> },
              ]}
              row
            />
            {plugin.autoEnableManaged === 1 ? (
              <Banner data-testid="plugin-auto-enable-detail-alert" description={t("pages.plugins.autoEnableManagedHint", { pluginId: plugin.id })} type="warning" />
            ) : null}
            {plugin.type === "dynamic" ? (
              <>
                <Typography.Title className="plugin-section-title" data-testid="plugin-host-service-section-title" heading={6}>
                  {t("pages.plugins.hostServiceScope")}
                </Typography.Title>
                <Typography.Text type="tertiary">{t("pages.plugins.detailScopeHint")}</Typography.Text>
                <HostServiceReview
                  authorized={plugin.authorizedHostServices}
                  pluginId={plugin.id}
                  requested={plugin.requestedHostServices}
                />
                <Typography.Title className="plugin-section-title" data-testid="plugin-route-section-title" heading={6}>
                  {t("pages.plugins.declaredRoutes")}
                </Typography.Title>
                <RouteReviewList routes={plugin.declaredRoutes} />
              </>
            ) : null}
          </div>
        ) : null}

        {(mode === "install" || mode === "enable") && plugin ? (
          <div className="plugin-governance-stack" data-testid="plugin-host-service-auth-modal">
            <Descriptions
              column={2}
              data-testid="plugin-install-descriptions"
              data={[
                { key: t("pages.plugins.name"), value: plugin.name },
                { key: t("pages.plugins.id"), value: plugin.id },
                { key: t("pages.plugins.version"), value: plugin.version || plugin.effectiveVersion || "-" },
                { key: t("pages.plugins.type"), value: typeLabel(plugin.type, t) },
                { key: t("pages.plugins.description"), span: 2, value: plugin.description || "-" },
              ]}
              row
            />
            {mode === "install" ? (
              <DependencySummary check={dependency.data} loading={dependency.isPending} mode="install" />
            ) : null}
            <Typography.Title className="plugin-section-title" data-testid="plugin-host-service-section-title" heading={6}>
              {t("pages.plugins.hostServiceReview")}
            </Typography.Title>
            <HostServiceReview pluginId={plugin.id} requested={plugin.requestedHostServices} review />
            <Typography.Title className="plugin-section-title" data-testid="plugin-route-section-title" heading={6}>
              {t("pages.plugins.declaredRoutes")}
            </Typography.Title>
            <RouteReviewList routes={plugin.declaredRoutes} />
            {mode === "install" ? (
              <div className="plugin-install-options">
                <div className="plugin-install-mode-section" data-testid="plugin-install-mode-section">
                  <Typography.Text strong>{t("pages.plugins.installMode")}</Typography.Text>
                  <div className="plugin-install-mode-row" data-testid="plugin-install-mode-row">
                    <Select
                      data-testid="plugin-install-mode-select"
                      disabled={!plugin.supportsMultiTenant}
                      onChange={(value) => setInstallMode(String(value))}
                      optionList={[
                        { label: t("pages.plugins.globalMode"), value: "global" },
                        ...(plugin.supportsMultiTenant
                          ? [{ label: t("pages.plugins.tenantScopedMode"), value: "tenant_scoped" }]
                          : []),
                      ]}
                      value={installMode}
                    />
                    <Typography.Text data-testid="plugin-install-mode-description" type="tertiary">
                      {t(installMode === "tenant_scoped" ? "pages.plugins.tenantScopedDescription" : "pages.plugins.globalDescription")}
                    </Typography.Text>
                  </div>
                  {!plugin.supportsMultiTenant ? (
                    <Banner description={t("pages.plugins.platformOnlyGlobalHint")} type="info" />
                  ) : null}
                </div>
                {plugin.hasMockData === 1 ? (
                  <div data-testid="plugin-install-mock-data-section">
                    <Space>
                      <Checkbox checked={mockData} onChange={(event) => setMockData(Boolean(event.target.checked))}>
                        {t("pages.plugins.installMockQuestion")}
                      </Checkbox>
                      <Tooltip content={t("pages.plugins.installMockDataTooltip")}>
                        <IconHelpCircle
                          aria-label={t("pages.plugins.installMockDataHelpHint")}
                          data-testid="plugin-install-mock-data-help-icon"
                        />
                      </Tooltip>
                    </Space>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {mode === "upgrade" ? preview.isPending ? <Spin /> : <UpgradeReview preview={preview.data} /> : null}

        {mode === "uninstall" && plugin ? (
          <div className="plugin-governance-stack">
            {plugin.autoEnableManaged === 1 ? (
              <Banner data-testid="plugin-auto-enable-uninstall-alert" description={t("pages.plugins.autoEnableUninstallHint")} type="warning" />
            ) : null}
            <DependencySummary check={dependency.data} loading={dependency.isPending} mode="uninstall" />
            <div data-testid="plugin-uninstall-purge-checkbox">
              <Checkbox checked={purge} onChange={(event) => setPurge(Boolean(event.target.checked))}>
                {t("pages.plugins.purgeStorage")}
              </Checkbox>
            </div>
            <Banner data-testid="plugin-uninstall-purge-warning" description={t("pages.plugins.purgeWarning")} type="warning" />
          </div>
        ) : null}

        {mode === "upload" ? uploadSucceeded ? (
          <div className="plugin-upload-success" data-testid="plugin-dynamic-upload-success">
            <Typography.Title heading={5}>{t("pages.plugins.uploadSuccess")}</Typography.Title>
          </div>
        ) : (
          <div className="plugin-governance-stack">
            <Typography.Text>{t("pages.plugins.uploadHint")}</Typography.Text>
            <div data-testid="plugin-dynamic-upload-dragger">
              <Upload
                accept=".wasm"
                action=""
                beforeUpload={() => false}
                dragMainText={t("pages.plugins.chooseWasm")}
                dragSubText={t("pages.plugins.uploadHint")}
                draggable
                fileList={files}
                limit={1}
                onChange={({ fileList }: OnChangeProps) => setFiles(fileList)}
              />
            </div>
            <div data-testid="plugin-dynamic-overwrite-switch">
              <Checkbox checked={overwrite} onChange={(event) => setOverwrite(Boolean(event.target.checked))}>
                {t("pages.plugins.overwrite")}
              </Checkbox>
            </div>
            <Typography.Text type="tertiary">{t("pages.plugins.overwriteHint")}</Typography.Text>
          </div>
        ) : null}

        {mode !== "detail" && !forceReasons.length ? (
          <Space className="iam-form-actions">
            {!uploadSucceeded ? <Button onClick={onClose}>{t("pages.common.cancel")}</Button> : null}
            {mode === "install" && allowInstallAndEnable ? (
              <Button
                data-testid="plugin-install-enable-button"
                disabled={blockedInstall}
                loading={submitting}
                onClick={() => void submit("install-and-enable")}
                theme="solid"
                type="primary"
              >
                {t("pages.plugins.installAndEnable")}
              </Button>
            ) : null}
            <Button
              data-testid="plugin-governance-confirm"
              disabled={
                blockedInstall
                || (mode === "upgrade" && upgradeBlocked(preview.data))
                || (mode === "uninstall" && blockedUninstall)
                || (mode === "upload" && !uploadSucceeded && !files[0]?.fileInstance)
              }
              loading={submitting}
              onClick={uploadSucceeded ? onClose : () => void submit()}
              theme="solid"
              type={mode === "uninstall" ? "danger" : "primary"}
            >
              {uploadSucceeded ? t("pages.plugins.gotIt") : t("pages.common.confirm")}
            </Button>
          </Space>
        ) : null}
      </div>
      </Modal>
      <Modal
        closeOnEsc={!submitting}
        footer={null}
        onCancel={onClose}
        title={t("pages.plugins.preconditionTitle")}
        visible={visible && forceReasons.length > 0}
        width={620}
      >
        {plugin ? (
          <div className="plugin-governance-stack" data-testid="lifecycle-precondition-dialog">
            <div data-testid="lifecycle-precondition-reason-alert">
              <Typography.Text type="danger">{t("pages.plugins.preconditionReasonTitle")}</Typography.Text>
              <div data-testid="lifecycle-precondition-reason">
                {t("pages.plugins.preconditionBlockedReason")} {forceReasons.join("；")}
              </div>
            </div>
            <Banner
              data-testid="lifecycle-precondition-force-alert"
              description={t("pages.plugins.forceHint", { pluginId: plugin.id })}
              type="danger"
            />
            <Input
              data-testid="lifecycle-precondition-force-plugin-id"
              onChange={setForceText}
              placeholder={plugin.id}
              value={forceText}
            />
            <Space className="iam-form-actions">
              <Button onClick={onClose}>{t("pages.common.cancel")}</Button>
              <Button
                disabled={forceText !== plugin.id}
                loading={submitting}
                onClick={() => void forceUninstall()}
                type="danger"
              >
                {t("pages.common.confirm")}
              </Button>
            </Space>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function upgradeBlocked(preview?: UpgradePreview) {
  return !preview || dependencyBlocked(preview.dependencyCheck);
}

function UpgradeReview({ preview }: { preview?: UpgradePreview }) {
  const { t } = useTranslation();
  if (!preview) {
    return null;
  }
  return (
    <div className="plugin-governance-stack" data-testid="plugin-upgrade-modal">
      <div className="plugin-upgrade-manifests">
        <div data-testid="plugin-upgrade-from-manifest">
          <Typography.Title heading={6}>{t("pages.plugins.currentManifest")}</Typography.Title>
          <Typography.Text>{preview.fromManifest?.name || preview.pluginId} {preview.fromManifest?.version || preview.effectiveVersion}</Typography.Text>
        </div>
        <div data-testid="plugin-upgrade-to-manifest">
          <Typography.Title heading={6}>{t("pages.plugins.targetManifest")}</Typography.Title>
          <Typography.Text>{preview.toManifest?.name || preview.pluginId} {preview.toManifest?.version || preview.discoveredVersion}</Typography.Text>
        </div>
      </div>
      <div data-testid="plugin-upgrade-sql-summary">
        <Typography.Title heading={6}>{t("pages.plugins.sql")}</Typography.Title>
        <Typography.Text>{t("pages.plugins.installSqlCount", { count: preview.sqlSummary.installSqlCount ?? 0 })}</Typography.Text>
        <Typography.Text>{t("pages.plugins.uninstallSqlCount", { count: preview.sqlSummary.uninstallSqlCount ?? 0 })}</Typography.Text>
        <Typography.Text>{t("pages.plugins.mockSqlCount", { count: preview.sqlSummary.mockSqlCount ?? 0 })}</Typography.Text>
      </div>
      <Typography.Title data-testid="plugin-upgrade-risk-section-title" heading={6}>{t("pages.plugins.risks")}</Typography.Title>
      {preview.riskHints.length
        ? preview.riskHints.map((hint) => <Typography.Text key={hint}>{t(`pages.plugins.risk.${hint}`, { defaultValue: hint })}</Typography.Text>)
        : <Typography.Text type="tertiary">{t("pages.plugins.noRisks")}</Typography.Text>}
    </div>
  );
}
