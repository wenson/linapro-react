import { IconHelpCircle } from "@douyinfe/semi-icons";
import Banner from "@douyinfe/semi-ui/lib/es/banner";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import Descriptions from "@douyinfe/semi-ui/lib/es/descriptions";
import Dropdown from "@douyinfe/semi-ui/lib/es/dropdown";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import SideSheet from "@douyinfe/semi-ui/lib/es/sideSheet";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Tooltip from "@douyinfe/semi-ui/lib/es/tooltip";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { createSystemJobApi } from "#/api/system/job";
import type { JobGroup, JobPayload, JobRecord } from "#/api/system/job";
import { useWorkbenchRuntime } from "#/app/workbench-runtime-context";
import { useAuthContext } from "#/auth/auth-context";
import { MobileRecordActions, MobileRecordCard, MobileRecordField, MobileRecordFields, MobileRecordList, MobileRecordTitle } from "#/plugin-ui/mobile-record";
import { formatTimestamp } from "#/shared/format";

interface JobFilters {
  groupId?: number;
  keyword?: string;
  status?: string;
}

interface JobFormValues extends Omit<JobPayload, "env" | "logRetentionOverride" | "params" | "taskType"> {
  envText?: string;
  retentionMode?: string;
  retentionValue?: number;
}

interface RetentionFormValue {
  retentionMode: string;
  retentionValue?: number;
}

interface BuiltinJobDetailValues {
  concurrency: string;
  cronExpr: string;
  groupName: string;
  name: string;
  retentionMode: string;
  scope: string;
  status: string;
  timeoutSeconds: number;
  timezone: string;
}

const monospaceFont = "ui-monospace, 'SFMono-Regular', SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

function can(permissions: readonly string[], key: string) {
  return permissions.includes("*") || permissions.includes(key);
}

function parseObject(value: string | undefined, errorMessage: string) {
  if (!value?.trim()) {
    return {};
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error(errorMessage);
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && error.message === errorMessage) {
      throw error;
    }
    throw new Error(errorMessage, { cause: error });
  }
}

function parseRetention(value: string | null | undefined): RetentionFormValue {
  if (!value) {
    return { retentionMode: "" };
  }
  try {
    const parsed = JSON.parse(value) as { mode?: unknown; value?: unknown };
    return {
      retentionMode: typeof parsed.mode === "string" ? parsed.mode : "",
      retentionValue: typeof parsed.value === "number" && parsed.value > 0 ? parsed.value : undefined,
    };
  } catch {
    return { retentionMode: "" };
  }
}

function prettyJSON(value: string | null | undefined) {
  if (!value) {
    return "{}";
  }
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function editableObjectText(value: string | null | undefined) {
  if (!value) {
    return "{}";
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && !Array.isArray(parsed) && typeof parsed === "object"
      ? JSON.stringify(parsed, null, 2)
      : "{}";
  } catch {
    return value;
  }
}

function isValidTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return Boolean(value.trim());
  } catch {
    return false;
  }
}

function sourceKind(row: JobRecord) {
  if (row.isBuiltin !== 1) {
    return "user" as const;
  }
  return row.handlerRef.startsWith("plugin:") ? "plugin" as const : "host" as const;
}

function ownerPluginId(row: JobRecord) {
  return row.handlerRef.match(/^plugin:([^/]+)\//)?.[1] || "-";
}

function HelpLabel({ content, label }: { content: string; label: string }) {
  const { t } = useTranslation();
  return (
    <span className="scheduler-help-label">
      {label}
      <Tooltip content={<span className="scheduler-help-content">{content}</span>}>
        <IconHelpCircle aria-label={t("pages.scheduler.job.fieldHelp")} />
      </Tooltip>
    </span>
  );
}

export default function JobPage() {
  const { apiClient, config } = useWorkbenchRuntime();
  const auth = useAuthContext();
  const { i18n, t } = useTranslation();
  const api = useMemo(() => createSystemJobApi(apiClient), [apiClient]);
  const permissions = auth?.user.permissions ?? [];
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<JobFilters>({});
  const [searchKey, setSearchKey] = useState(0);
  const [editing, setEditing] = useState<JobRecord | "new">();
  const [newGroupId, setNewGroupId] = useState(0);
  const [cronExpr, setCronExpr] = useState("0 0 1 1 *");
  const [timezone, setTimezone] = useState(config.cron.timezone.current || "Asia/Shanghai");
  const [concurrency, setConcurrency] = useState("singleton");
  const [retentionMode, setRetentionMode] = useState("");
  const [preview, setPreview] = useState<string[]>([]);
  const [previewError, setPreviewError] = useState("");

  const list = useQuery({
    queryFn: () => api.list({ ...filters, pageNum: page, pageSize: 10 }),
    queryKey: ["scheduler", "jobs", filters, page],
  });
  const groups = useQuery({
    queryFn: () => api.listGroups({ pageNum: 1, pageSize: 100 }),
    queryKey: ["scheduler", "groups", "options"],
  });
  const shellAllowed = can(permissions, "system:job:shell") && config.cron.shell.supported && config.cron.shell.enabled;

  function shellBlockedReason() {
    if (!can(permissions, "system:job:shell")) {
      return t("pages.scheduler.job.noShellPermission");
    }
    if (!config.cron.shell.supported) {
      return config.cron.shell.disabledReason || t("pages.scheduler.job.platformUnsupported");
    }
    if (!config.cron.shell.enabled) {
      return config.cron.shell.disabledReason || t("pages.scheduler.job.environmentDisabled");
    }
    return "";
  }

  async function refresh() {
    await list.refetch();
  }

  async function open(row: JobRecord | "new") {
    setPreview([]);
    setPreviewError("");
    if (row === "new") {
      let availableGroups = groups.data?.list ?? [];
      if (!availableGroups.length) {
        availableGroups = (await groups.refetch()).data?.list ?? [];
      }
      const initialGroup = availableGroups.find((group) => group.isDefault === 1) ?? availableGroups[0];
      setNewGroupId(initialGroup?.id ?? 0);
      setCronExpr("0 0 1 1 *");
      setTimezone(config.cron.timezone.current || "Asia/Shanghai");
      setConcurrency("singleton");
      setRetentionMode("");
      setEditing("new");
      return;
    }
    const detail = await api.get(row.id);
    const retention = parseRetention(detail.logRetentionOverride);
    setCronExpr(detail.cronExpr);
    setTimezone(detail.timezone);
    setConcurrency(detail.concurrency);
    setRetentionMode(retention.retentionMode);
    setEditing(detail);
  }

  function close() {
    setEditing(undefined);
    setPreview([]);
    setPreviewError("");
  }

  function buildRetentionOverride(values: JobFormValues) {
    if (!values.retentionMode) {
      return null;
    }
    if (values.retentionMode === "none") {
      return { mode: "none", value: 0 };
    }
    const value = Number(values.retentionValue ?? 0);
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(t("pages.scheduler.job.retentionValuePositive"));
    }
    return { mode: values.retentionMode, value };
  }

  function validate(values: JobFormValues) {
    const cronFields = String(values.cronExpr || "").trim().split(/\s+/).filter(Boolean);
    if (cronFields.length !== 5 && cronFields.length !== 6) {
      throw new Error(t("pages.scheduler.job.cronInvalidCount"));
    }
    if (cronFields.length === 6 && cronFields[0] === "#") {
      throw new Error(t("pages.scheduler.job.cronSecondInvalid"));
    }
    if (!isValidTimezone(String(values.timezone || ""))) {
      throw new Error(t("pages.scheduler.job.timezoneInvalid"));
    }
    if (!Number.isInteger(Number(values.timeoutSeconds)) || Number(values.timeoutSeconds) < 1 || Number(values.timeoutSeconds) > 86400) {
      throw new Error(t("pages.scheduler.job.timeoutInvalid"));
    }
    if (!Number.isInteger(Number(values.maxExecutions)) || Number(values.maxExecutions) < 0) {
      throw new Error(t("pages.scheduler.job.maxExecutionsInvalid"));
    }
    if (values.concurrency === "parallel" && (!Number.isInteger(Number(values.maxConcurrency)) || Number(values.maxConcurrency) < 1 || Number(values.maxConcurrency) > 100)) {
      throw new Error(t("pages.scheduler.job.maxConcurrencyInvalid"));
    }
  }

  async function save(values: JobFormValues) {
    try {
      validate(values);
      const payload: JobPayload = {
        concurrency: values.concurrency,
        cronExpr: String(values.cronExpr).trim(),
        description: values.description?.trim() || "",
        env: parseObject(values.envText, t("pages.scheduler.job.envInvalid")) as Record<string, string>,
        groupId: Number(values.groupId),
        handlerRef: "",
        logRetentionOverride: buildRetentionOverride(values),
        maxConcurrency: values.concurrency === "parallel" ? Number(values.maxConcurrency) : 1,
        maxExecutions: Number(values.maxExecutions ?? 0),
        name: values.name.trim(),
        params: {},
        scope: values.scope,
        shellCmd: values.shellCmd?.trim() || "",
        status: values.status,
        taskType: "shell",
        timeoutSeconds: Number(values.timeoutSeconds),
        timezone: String(values.timezone).trim(),
        workDir: values.workDir?.trim() || "",
      };
      const updating = editing !== "new" && Boolean(editing);
      if (updating) {
        await api.update((editing as JobRecord).id, payload);
      } else {
        await api.create(payload);
      }
      Toast.success(t(updating ? "pages.common.updateSuccess" : "pages.common.createSuccess"));
      close();
      await refresh();
    } catch (error) {
      Toast.error(error instanceof Error && error.message ? error.message : t("pages.scheduler.job.saveFailed"));
    }
  }

  async function previewCron() {
    setPreviewError("");
    try {
      const fields = cronExpr.trim().split(/\s+/).filter(Boolean);
      if (fields.length !== 5 && fields.length !== 6) {
        throw new Error(t("pages.scheduler.job.cronInvalidCount"));
      }
      if (!isValidTimezone(timezone)) {
        throw new Error(t("pages.scheduler.job.timezoneInvalid"));
      }
      const result = await api.preview(cronExpr.trim(), timezone.trim());
      setPreview(result.times);
    } catch (error) {
      setPreview([]);
      setPreviewError(error instanceof Error && error.message ? error.message : t("pages.scheduler.job.previewFailed"));
    }
  }

  async function trigger(row: JobRecord) {
    const result = await api.trigger(row.id);
    Toast.success(t("pages.scheduler.job.triggered", { logId: result.logId }));
    await refresh();
  }

  async function reset(row: JobRecord) {
    await api.reset(row.id);
    Toast.success(t("pages.scheduler.job.resetSuccess"));
    await refresh();
  }

  async function remove(row: JobRecord) {
    await api.delete([row.id]);
    Toast.success(t("pages.common.deleteSuccess"));
    await refresh();
  }

  function resetSearch() {
    setFilters({});
    setSearchKey((value) => value + 1);
    setPage(1);
  }

  function statusLabel(status: string) {
    if (status === "enabled") {
      return t("pages.scheduler.job.enabled");
    }
    if (status === "paused_by_plugin") {
      return t("pages.scheduler.job.pluginUnavailable");
    }
    return t("pages.scheduler.job.disabled");
  }

  function scopeLabel(scope: string) {
    return scope === "all_node" ? t("pages.scheduler.job.allNodes") : t("pages.scheduler.job.masterOnly");
  }

  function concurrencyLabel(value: string) {
    return value === "parallel" ? t("pages.scheduler.job.parallel") : t("pages.scheduler.job.singleton");
  }

  function sourceLabel(row: JobRecord) {
    const kind = sourceKind(row);
    if (kind === "host") {
      return t("pages.scheduler.job.hostBuiltin");
    }
    if (kind === "plugin") {
      return t("pages.scheduler.job.pluginBuiltin");
    }
    return t("pages.scheduler.job.userCreated");
  }

  function renderActions(row: JobRecord) {
    const pluginPaused = row.status === "paused_by_plugin";
    const shellBlocked = row.taskType === "shell" && !shellAllowed;
    const mayTrigger = can(permissions, "system:job:trigger");
    const mayEdit = row.isBuiltin !== 1 && can(permissions, "system:job:edit");
    const mayReset = row.isBuiltin !== 1 && can(permissions, "system:job:reset");
    const mayDelete = row.isBuiltin !== 1 && can(permissions, "system:job:remove");
    return (
      <Space>
        {mayTrigger ? pluginPaused ? (
          <Tooltip content={t("pages.scheduler.job.pluginPausedTooltip")}>
            <span><Button data-testid={`job-trigger-${row.id}`} disabled theme="borderless">{t("pages.scheduler.job.trigger")}</Button></span>
          </Tooltip>
        ) : (
          <Popconfirm cancelText={t("pages.common.cancel")} confirmText={t("pages.common.confirm")} content={t("pages.scheduler.job.triggerConfirm")} onConfirm={() => void trigger(row)}>
            <Button data-testid={`job-trigger-${row.id}`} theme="borderless">{t("pages.scheduler.job.trigger")}</Button>
          </Popconfirm>
        ) : null}
        {row.isBuiltin === 1 ? (
          <Button data-testid={`job-edit-${row.id}`} onClick={() => void open(row)} theme="borderless">{t("pages.common.detail")}</Button>
        ) : mayEdit ? shellBlocked || pluginPaused ? (
          <Tooltip content={pluginPaused ? t("pages.scheduler.job.pluginPausedTooltip") : shellBlockedReason()}>
            <span><Button data-testid={`job-edit-${row.id}`} disabled theme="borderless">{t("pages.common.edit")}</Button></span>
          </Tooltip>
        ) : (
          <Button data-testid={`job-edit-${row.id}`} onClick={() => void open(row)} theme="borderless">{t("pages.common.edit")}</Button>
        ) : null}
        {mayReset || mayDelete ? (
          <Dropdown render={<Dropdown.Menu>{mayReset ? <Dropdown.Item data-testid={`job-reset-${row.id}`} onClick={() => void reset(row)}>{t("pages.scheduler.job.reset")}</Dropdown.Item> : null}{mayDelete ? <Dropdown.Item><Popconfirm content={t("pages.scheduler.job.deleteConfirm")} onConfirm={() => void remove(row)}><span data-testid={`job-delete-${row.id}`}>{t("pages.common.delete")}</span></Popconfirm></Dropdown.Item> : null}</Dropdown.Menu>} trigger="click">
            <Button data-testid={`job-more-${row.id}`} theme="borderless">{t("pages.scheduler.job.more")}</Button>
          </Dropdown>
        ) : null}
      </Space>
    );
  }

  const columns: ColumnProps<JobRecord>[] = [
    { dataIndex: "name", title: t("pages.scheduler.job.name"), width: 180 },
    { dataIndex: "groupName", title: t("pages.scheduler.job.group"), width: 140 },
    {
      render: (_, row) => <Tag color={sourceKind(row) === "host" ? "blue" : sourceKind(row) === "plugin" ? "violet" : "amber"}>{sourceLabel(row)}</Tag>,
      title: t("pages.scheduler.job.source"),
      width: 120,
    },
    {
      dataIndex: "status",
      render: (value, row) => row.status === "paused_by_plugin" ? (
        <Tooltip content={t("pages.scheduler.job.pluginPausedTooltip")}>
          <Tag color="red">{statusLabel(String(value))}</Tag>
        </Tooltip>
      ) : <Tag color={row.status === "enabled" ? "green" : "grey"}>{statusLabel(String(value))}</Tag>,
      title: t("pages.common.status"),
      width: 110,
    },
    {
      dataIndex: "cronExpr",
      render: (value, row) => (
        <Tooltip content={String(value || "-")}>
          <code className="job-cron-code" data-testid={`job-cron-expr-${row.id}`}>{String(value || "-")}</code>
        </Tooltip>
      ),
      title: t("pages.scheduler.job.cronExpr"),
      width: 190,
    },
    { dataIndex: "timezone", title: t("pages.scheduler.job.timezone"), width: 140 },
    { dataIndex: "scope", render: (value) => scopeLabel(String(value)), title: t("pages.scheduler.job.scope"), width: 140 },
    { dataIndex: "concurrency", render: (value) => concurrencyLabel(String(value)), title: t("pages.scheduler.job.concurrency"), width: 150 },
    { dataIndex: "executedCount", title: t("pages.scheduler.job.executedCount"), width: 110 },
    { dataIndex: "stopReason", render: (value) => value ? <Tag color="amber">{String(value)}</Tag> : "-", title: t("pages.scheduler.job.stopReason"), width: 180 },
    { dataIndex: "updatedAt", render: (value) => formatTimestamp(value as number | null, i18n.resolvedLanguage || "en-US"), title: t("pages.common.updatedAt"), width: 180 },
    {
      render: (_, row) => renderActions(row),
      title: t("pages.common.actions"),
      width: 280,
    },
  ];

  const retention = editing && editing !== "new" ? parseRetention(editing.logRetentionOverride) : { retentionMode: "", retentionValue: undefined };
  const initialValues: JobFormValues = editing && editing !== "new" ? {
    concurrency: editing.concurrency,
    cronExpr: editing.cronExpr,
    description: editing.description,
    envText: editableObjectText(editing.env),
    groupId: editing.groupId,
    maxConcurrency: editing.maxConcurrency,
    maxExecutions: editing.maxExecutions,
    name: editing.name,
    retentionMode: retention.retentionMode,
    retentionValue: retention.retentionValue,
    scope: editing.scope,
    shellCmd: editing.shellCmd,
    status: editing.status === "enabled" ? "enabled" : "disabled",
    timeoutSeconds: editing.timeoutSeconds,
    timezone: editing.timezone,
    workDir: editing.workDir,
  } : {
    concurrency: "singleton",
    cronExpr: "0 0 1 1 *",
    description: "",
    envText: "{}",
    groupId: newGroupId,
    maxConcurrency: 1,
    maxExecutions: 0,
    name: "",
    retentionMode: "",
    scope: "master_only",
    shellCmd: "",
    status: "disabled",
    timeoutSeconds: 300,
    timezone: config.cron.timezone.current || "Asia/Shanghai",
    workDir: "",
  };

  const retentionSummary = config.cron.logRetention.mode === "none"
    ? t("pages.scheduler.job.retentionNoneSummary")
    : config.cron.logRetention.mode === "count"
      ? t("pages.scheduler.job.retentionCountSummary", { value: config.cron.logRetention.value })
      : t("pages.scheduler.job.retentionDaysSummary", { value: config.cron.logRetention.value });

  return (
    <section className="feature-page" data-testid="job-page">
      <Typography.Title heading={3}>{t("pages.scheduler.job.title")}</Typography.Title>
      <Card>
        <Form<JobFilters>
          className="iam-search-form"
          key={searchKey}
          layout="horizontal"
          onSubmit={(values) => { setFilters(values); setPage(1); }}
        >
          <Form.Select
            field="groupId"
            label={t("pages.scheduler.job.group")}
            optionList={(groups.data?.list ?? []).map((group) => ({ label: group.name, value: group.id }))}
          />
          <Form.Select
            field="status"
            label={t("pages.scheduler.job.status")}
            optionList={[
              { label: t("pages.scheduler.job.enabled"), value: "enabled" },
              { label: t("pages.scheduler.job.disabled"), value: "disabled" },
              { label: t("pages.scheduler.job.pluginUnavailable"), value: "paused_by_plugin" },
            ]}
          />
          <Form.Input field="keyword" label={t("pages.scheduler.job.keyword")} />
          <Button htmlType="reset" onClick={resetSearch}>{t("pages.common.reset")}</Button>
          <Button htmlType="submit" theme="solid" type="primary">{t("pages.common.search")}</Button>
        </Form>
      </Card>
      <Card>
        <div className="iam-toolbar">
          {can(permissions, "system:job:add") && shellAllowed ? (
            <Button data-testid="job-add" onClick={() => void open("new")} theme="solid" type="primary">{t("pages.common.add")}</Button>
          ) : null}
        </div>
        <div className="responsive-desktop-table" data-testid="job-table">
          <Table<JobRecord>
            columns={columns}
            dataSource={list.data?.list ?? []}
            pagination={{ currentPage: page, onChange: setPage, pageSize: 10, total: list.data?.total ?? 0 }}
            rowKey="id"
            scroll={{ x: 1900 }}
          />
        </div>
        <MobileRecordList testId="job-mobile-list">
          {(list.data?.list ?? []).map((row) => (
            <MobileRecordCard key={row.id} testId={`job-mobile-card-${row.id}`}>
              <MobileRecordTitle>{row.name}</MobileRecordTitle>
              <MobileRecordFields>
                <MobileRecordField label={t("pages.scheduler.job.group")} value={row.groupName || "-"} />
                <MobileRecordField label={t("pages.common.status")} value={<Tag color={row.status === "enabled" ? "green" : row.status === "paused_by_plugin" ? "red" : "grey"}>{statusLabel(row.status)}</Tag>} />
                <MobileRecordField label={t("pages.scheduler.job.cronExpr")} value={row.cronExpr} />
                <MobileRecordField label={t("pages.scheduler.job.scope")} value={scopeLabel(row.scope)} />
              </MobileRecordFields>
              <MobileRecordActions>{renderActions(row)}</MobileRecordActions>
            </MobileRecordCard>
          ))}
        </MobileRecordList>
      </Card>
      <SideSheet
        onCancel={close}
        title={t(editing === "new" ? "pages.scheduler.job.create" : editing?.isBuiltin === 1 ? "pages.scheduler.job.detail" : "pages.scheduler.job.edit")}
        visible={editing !== undefined}
        width="min(760px, 100vw)"
      >
        {editing && editing !== "new" && editing.isBuiltin === 1 ? (
          <div className="scheduler-form-stack">
            <div className="scheduler-banner-padding" data-testid="job-builtin-common-lock-alert">
              <Banner description={t("pages.scheduler.job.builtinReadonly")} type="info" />
            </div>
            <Form<BuiltinJobDetailValues>
              className="scheduler-builtin-readonly-form"
              disabled
              initValues={{
                concurrency: editing.concurrency,
                cronExpr: editing.cronExpr,
                groupName: editing.groupName,
                name: editing.name,
                retentionMode: retention.retentionMode,
                scope: editing.scope,
                status: editing.status,
                timeoutSeconds: editing.timeoutSeconds,
                timezone: editing.timezone,
              }}
              labelPosition="top"
            >
              <div className="scheduler-form-grid">
                <Form.Input field="groupName" label={t("pages.scheduler.job.group")} />
                <Form.Input field="name" label={t("pages.scheduler.job.name")} />
                <Form.Input field="cronExpr" inputStyle={{ fontFamily: monospaceFont }} label={t("pages.scheduler.job.cronExpr")} />
                <Form.Input field="timezone" label={t("pages.scheduler.job.timezone")} />
                <Form.RadioGroup
                  field="scope"
                  label={t("pages.scheduler.job.scope")}
                  options={[
                    { label: t("pages.scheduler.job.masterOnly"), value: "master_only" },
                    { label: t("pages.scheduler.job.allNodes"), value: "all_node" },
                  ]}
                  type="button"
                />
                <Form.RadioGroup
                  field="concurrency"
                  label={t("pages.scheduler.job.concurrency")}
                  options={[
                    { label: t("pages.scheduler.job.singleton"), value: "singleton" },
                    { label: t("pages.scheduler.job.parallel"), value: "parallel" },
                  ]}
                  type="button"
                />
                <Form.InputNumber field="timeoutSeconds" label={t("pages.scheduler.job.timeout")} />
                <Form.Select
                  field="retentionMode"
                  label={t("pages.scheduler.job.retention")}
                  optionList={[
                    { label: t("pages.scheduler.job.retentionFollowSystem"), value: "" },
                    { label: t("pages.scheduler.job.retentionDays"), value: "days" },
                    { label: t("pages.scheduler.job.retentionCount"), value: "count" },
                    { label: t("pages.scheduler.job.retentionNone"), value: "none" },
                  ]}
                />
                <Form.RadioGroup
                  data-testid="job-status-radio-group"
                  field="status"
                  label={t("pages.scheduler.job.status")}
                  options={[
                    { label: t("pages.scheduler.job.enabled"), value: "enabled" },
                    { label: t("pages.scheduler.job.disabled"), value: "disabled" },
                    { label: t("pages.scheduler.job.pluginUnavailable"), value: "paused_by_plugin" },
                  ]}
                  type="button"
                />
              </div>
            </Form>
            <Card data-testid="job-builtin-detail-card" title={t("pages.scheduler.job.builtinTitle")}>
              <Typography.Paragraph type="tertiary">{t("pages.scheduler.job.builtinDescription")}</Typography.Paragraph>
              <Descriptions
                className="job-builtin-descriptions"
                column={1}
                data={[
                  { key: t("pages.scheduler.job.source"), value: <Tag color={sourceKind(editing) === "host" ? "blue" : "violet"}>{sourceLabel(editing)}</Tag> },
                  ...(sourceKind(editing) === "plugin" ? [{ key: t("pages.plugins.owner"), value: ownerPluginId(editing) }] : []),
                  { key: t("pages.scheduler.job.type"), value: editing.taskType === "shell" ? "Shell" : "Handler" },
                  { key: t("pages.scheduler.job.handlerRef"), value: <code>{editing.handlerRef || "-"}</code> },
                  { key: t("pages.scheduler.job.handlerParams"), value: <pre className="scheduler-json-code">{prettyJSON(editing.params)}</pre> },
                ]}
                row
              />
            </Card>
          </div>
        ) : editing ? (
          <Form<JobFormValues>
            initValues={initialValues}
            key={editing === "new" ? `new-${newGroupId}` : editing.id}
            labelPosition="top"
            onSubmit={save}
          >
            <div className="scheduler-form-grid">
              <Form.Select
                field="groupId"
                label={t("pages.scheduler.job.group")}
                optionList={(groups.data?.list ?? []).map((group: JobGroup) => ({ label: group.name, value: group.id }))}
                rules={[{ required: true, message: t("pages.scheduler.job.groupRequired") }]}
              />
              <Form.Input field="name" label={t("pages.scheduler.job.name")} maxLength={128} rules={[{ required: true, message: t("pages.scheduler.job.nameRequired") }]} />
              <Form.TextArea className="scheduler-form-wide" field="description" label={t("pages.scheduler.job.description")} rows={3} />
              <Form.Input
                className="job-cron-editor"
                field="cronExpr"
                inputStyle={{
                  background: "var(--lina-card-background)",
                  borderRadius: "var(--lina-radius-control)",
                  fontFamily: monospaceFont,
                }}
                label={<HelpLabel content={t("pages.scheduler.job.cronHelp")} label={t("pages.scheduler.job.cronExpr")} />}
                onChange={(value) => setCronExpr(value)}
                rules={[{ required: true, message: t("pages.scheduler.job.cronRequired") }]}
              />
              <Form.Input
                field="timezone"
                label={t("pages.scheduler.job.timezone")}
                onChange={(value) => setTimezone(value)}
                rules={[{ required: true, message: t("pages.scheduler.job.timezoneRequired") }]}
              />
              <Form.RadioGroup
                field="scope"
                label={<HelpLabel content={t("pages.scheduler.job.scopeHelp")} label={t("pages.scheduler.job.scope")} />}
                options={[
                  { label: t("pages.scheduler.job.masterOnly"), value: "master_only" },
                  { label: t("pages.scheduler.job.allNodes"), value: "all_node" },
                ]}
                type="button"
              />
              <Form.RadioGroup
                field="concurrency"
                label={<HelpLabel content={t("pages.scheduler.job.concurrencyHelp")} label={t("pages.scheduler.job.concurrency")} />}
                onChange={(event) => setConcurrency(String(event.target.value))}
                options={[
                  { label: t("pages.scheduler.job.singleton"), value: "singleton" },
                  { label: t("pages.scheduler.job.parallel"), value: "parallel" },
                ]}
                type="button"
              />
              {concurrency === "parallel" ? <Form.InputNumber field="maxConcurrency" label={t("pages.scheduler.job.maxConcurrency")} max={100} min={1} /> : null}
              <Form.InputNumber
                field="timeoutSeconds"
                label={<HelpLabel content={t("pages.scheduler.job.timeoutHelp")} label={t("pages.scheduler.job.timeout")} />}
                max={86400}
                min={1}
              />
              <Form.InputNumber
                field="maxExecutions"
                label={<HelpLabel content={t("pages.scheduler.job.maxExecutionsHelp")} label={t("pages.scheduler.job.maxExecutions")} />}
                min={0}
              />
              <Form.RadioGroup
                data-testid="job-status-radio-group"
                field="status"
                label={t("pages.scheduler.job.status")}
                options={[
                  { label: t("pages.scheduler.job.enabled"), value: "enabled" },
                  { label: t("pages.scheduler.job.disabled"), value: "disabled" },
                ]}
                type="button"
              />
              <Form.Select
                field="retentionMode"
                label={<HelpLabel content={t("pages.scheduler.job.retentionHelp", { currentPolicy: retentionSummary })} label={t("pages.scheduler.job.retention")} />}
                onChange={(value) => setRetentionMode(String(value || ""))}
                optionList={[
                  { label: t("pages.scheduler.job.retentionFollowSystem"), value: "" },
                  { label: t("pages.scheduler.job.retentionDays"), value: "days" },
                  { label: t("pages.scheduler.job.retentionCount"), value: "count" },
                  { label: t("pages.scheduler.job.retentionNone"), value: "none" },
                ]}
              />
              {retentionMode === "days" || retentionMode === "count" ? (
                <Form.InputNumber field="retentionValue" label={t("pages.scheduler.job.retentionValue")} min={1} />
              ) : null}
            </div>
            <Card className="scheduler-preview-card" title={t("pages.scheduler.job.previewTitle")}>
              <div className="scheduler-card-heading">
                <Typography.Text type="tertiary">{t("pages.scheduler.job.previewDescription")}</Typography.Text>
                <Button data-testid="job-cron-preview" onClick={() => void previewCron()}>{t("pages.scheduler.job.preview")}</Button>
              </div>
              {previewError ? <Banner description={previewError} type="danger" /> : preview.length ? (
                <div className="scheduler-preview-list">{preview.map((time) => <Tag key={time}>{time}</Tag>)}</div>
              ) : <Typography.Text type="tertiary">{t("pages.scheduler.job.previewEmpty")}</Typography.Text>}
            </Card>
            <Card data-testid="job-form-shell" title={t("pages.scheduler.job.shellTitle")}>
              <Typography.Paragraph type="tertiary">{t("pages.scheduler.job.shellDescription")}</Typography.Paragraph>
              <div className="scheduler-banner-padding" data-testid="job-shell-warning-alert">
                <Banner description={t("pages.scheduler.job.shellWarning")} type="warning" />
              </div>
              <Form.TextArea field="shellCmd" label={t("pages.scheduler.job.shellCommand")} rows={5} rules={[{ required: true, message: t("pages.scheduler.job.shellCommandRequired") }]} />
              <Form.Input field="workDir" label={t("pages.scheduler.job.workDir")} />
              <Form.TextArea field="envText" label={t("pages.scheduler.job.env")} rows={4} />
            </Card>
            <div className="iam-form-actions">
              <Button onClick={close}>{t("pages.common.cancel")}</Button>
              <Button htmlType="submit" theme="solid" type="primary">{t("pages.common.confirm")}</Button>
            </div>
          </Form>
        ) : null}
      </SideSheet>
    </section>
  );
}
