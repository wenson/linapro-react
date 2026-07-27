import Banner from "@douyinfe/semi-ui/lib/es/banner";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import Checkbox from "@douyinfe/semi-ui/lib/es/checkbox";
import DatePicker from "@douyinfe/semi-ui/lib/es/datePicker";
import Descriptions from "@douyinfe/semi-ui/lib/es/descriptions";
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

import { createSystemJobApi } from "#/api/system/job";
import type { JobLog } from "#/api/system/job";
import { useWorkbenchRuntime } from "#/app/workbench-runtime-context";
import { useAuthContext } from "#/auth/auth-context";
import { MobileRecordActions, MobileRecordCard, MobileRecordField, MobileRecordFields, MobileRecordList, MobileRecordTitle } from "#/plugin-ui/mobile-record";
import { formatTimestamp } from "#/shared/format";

interface LogSearchValues {
  jobId?: number;
  nodeId?: string;
  startTime?: Date[];
  status?: string;
}

type LogFilters = Record<string, number | string | undefined>;

function can(permissions: readonly string[], key: string) {
  return permissions.includes("*") || permissions.includes(key);
}

function formatDateTime(value: Date) {
  const part = (number: number) => String(number).padStart(2, "0");
  return `${value.getFullYear()}-${part(value.getMonth() + 1)}-${part(value.getDate())} ${part(value.getHours())}:${part(value.getMinutes())}:${part(value.getSeconds())}`;
}

function formatDate(value: Date) {
  const part = (number: number) => String(number).padStart(2, "0");
  return `${value.getFullYear()}-${part(value.getMonth() + 1)}-${part(value.getDate())}`;
}

function parseJSON(value: string) {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function prettyJSON(value: string) {
  const parsed = parseJSON(value);
  return parsed === null ? value || "-" : JSON.stringify(parsed, null, 2);
}

function isShellLog(row: JobLog) {
  const snapshot = parseJSON(row.jobSnapshot);
  return Boolean(snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) && (snapshot as { taskType?: unknown }).taskType === "shell");
}

export default function JobLogPage() {
  const { apiClient } = useWorkbenchRuntime();
  const auth = useAuthContext();
  const { i18n, t } = useTranslation();
  const api = useMemo(() => createSystemJobApi(apiClient), [apiClient]);
  const permissions = auth?.user.permissions ?? [];
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<LogFilters>({});
  const [searchKey, setSearchKey] = useState(0);
  const [detailId, setDetailId] = useState<number>();
  const [clearOpen, setClearOpen] = useState(false);
  const [deleteAll, setDeleteAll] = useState(false);
  const [deleteRange, setDeleteRange] = useState<Date[]>([]);
  const [deleting, setDeleting] = useState(false);
  const list = useQuery({
    queryFn: () => api.listLogs({ ...filters, pageNum: page, pageSize: 10 }),
    queryKey: ["scheduler", "logs", filters, page],
  });
  const jobs = useQuery({
    queryFn: () => api.list({ pageNum: 1, pageSize: 100 }),
    queryKey: ["scheduler", "jobs", "log-options"],
  });
  const detail = useQuery({
    enabled: Boolean(detailId),
    queryFn: () => api.getLog(detailId!),
    queryKey: ["scheduler", "log", detailId],
  });

  async function refresh() {
    await list.refetch();
  }

  function statusLabel(status: string) {
    const keys: Record<string, string> = {
      cancelled: "cancelled",
      failed: "failed",
      running: "running",
      skipped_max_concurrency: "skippedMaxConcurrency",
      skipped_not_primary: "skippedNotPrimary",
      skipped_singleton: "skippedSingleton",
      success: "success",
      timeout: "timeout",
    };
    const key = keys[status];
    return key ? t(`pages.scheduler.log.${key}`) : status;
  }

  function statusColor(status: string) {
    if (status === "success") {
      return "green";
    }
    if (status === "failed") {
      return "red";
    }
    if (status === "running") {
      return "blue";
    }
    if (status === "timeout" || status.startsWith("skipped_")) {
      return "amber";
    }
    return "grey";
  }

  function canCancel(row: JobLog) {
    return row.status === "running"
      && can(permissions, "system:joblog:cancel")
      && (!isShellLog(row) || can(permissions, "system:job:shell"));
  }

  async function cancel(row: JobLog) {
    await api.cancelLog(row.id);
    Toast.success(t("pages.scheduler.log.cancelSent"));
    await refresh();
  }

  async function deleteOne(row: JobLog) {
    await api.deleteLog(row.id);
    Toast.success(t("pages.common.deleteSuccess"));
    await refresh();
  }

  function openClear() {
    setDeleteAll(false);
    setDeleteRange([]);
    setClearOpen(true);
  }

  async function clearLogs() {
    if (!deleteAll && deleteRange.length !== 2) {
      Toast.warning(t("pages.scheduler.log.deleteRangeRequired"));
      return;
    }
    setDeleting(true);
    try {
      const result = await api.clearLogs(deleteAll ? undefined : {
        beginTime: formatDate(deleteRange[0]!),
        endTime: formatDate(deleteRange[1]!),
      });
      Toast.success(t("pages.scheduler.log.deleteRangeSuccess", { count: result.deleted }));
      setClearOpen(false);
      await refresh();
    } finally {
      setDeleting(false);
    }
  }

  function search(values: LogSearchValues) {
    const range = Array.isArray(values.startTime) ? values.startTime : [];
    setFilters({
      beginTime: range[0] instanceof Date ? formatDateTime(range[0]) : undefined,
      endTime: range[1] instanceof Date ? formatDateTime(range[1]) : undefined,
      jobId: values.jobId,
      nodeId: values.nodeId?.trim() || undefined,
      status: values.status,
    });
    setPage(1);
  }

  function resetSearch() {
    setFilters({});
    setSearchKey((value) => value + 1);
    setPage(1);
  }

  function renderActions(row: JobLog) {
    return (
      <Space>
        <Button data-testid={`job-log-detail-${row.id}`} onClick={() => setDetailId(row.id)} theme="borderless">{t("pages.common.detail")}</Button>
        {canCancel(row) ? (
          <Popconfirm content={t("pages.scheduler.log.cancelConfirm")} onConfirm={() => void cancel(row)}>
            <Button data-testid={`job-log-cancel-${row.id}`} theme="borderless" type="danger">{t("pages.scheduler.log.cancel")}</Button>
          </Popconfirm>
        ) : null}
        {row.status !== "running" && can(permissions, "system:joblog:remove") ? (
          <Popconfirm content={t("pages.settings.deleteConfirm")} onConfirm={() => void deleteOne(row)}>
            <Button data-testid={`job-log-delete-row-${row.id}`} theme="borderless" type="danger">{t("pages.common.delete")}</Button>
          </Popconfirm>
        ) : null}
      </Space>
    );
  }

  const columns: ColumnProps<JobLog>[] = [
    { dataIndex: "jobName", title: t("pages.scheduler.log.job"), width: 180 },
    { dataIndex: "trigger", title: t("pages.scheduler.log.trigger"), width: 110 },
    { dataIndex: "nodeId", title: t("pages.scheduler.log.node"), width: 160 },
    {
      dataIndex: "status",
      render: (value) => <Tag color={statusColor(String(value))}>{statusLabel(String(value))}</Tag>,
      title: t("pages.scheduler.log.status"),
      width: 160,
    },
    { dataIndex: "startAt", render: (value) => formatTimestamp(value as number | null, i18n.resolvedLanguage || "en-US"), title: t("pages.scheduler.log.started"), width: 180 },
    { dataIndex: "endAt", render: (value) => formatTimestamp(value as number | null, i18n.resolvedLanguage || "en-US"), title: t("pages.scheduler.log.ended"), width: 180 },
    { dataIndex: "durationMs", title: t("pages.scheduler.log.duration"), width: 120 },
    { dataIndex: "errMsg", render: (value) => String(value || "-"), title: t("pages.scheduler.log.errorSummary"), width: 220 },
    {
      fixed: "right",
      render: (_, row) => renderActions(row),
      title: t("pages.common.actions"),
      width: 220,
    },
  ];

  const detailData = detail.data;
  const shellResult = detailData ? parseJSON(detailData.resultJson) : null;
  const shellOutput = shellResult && typeof shellResult === "object" && !Array.isArray(shellResult)
    && (Object.hasOwn(shellResult, "stdout") || Object.hasOwn(shellResult, "stderr") || Object.hasOwn(shellResult, "exitCode"))
    ? shellResult as { exitCode?: unknown; stderr?: unknown; stdout?: unknown }
    : null;

  return (
    <section className="feature-page" data-testid="job-log-page">
      <Typography.Title heading={3}>{t("pages.scheduler.log.title")}</Typography.Title>
      <Card>
        <Form<LogSearchValues> className="iam-search-form" id="job-log-filter-form" key={searchKey} layout="horizontal" onSubmit={search}>
          <Form.Select
            field="jobId"
            id="job-log-filter-job"
            label={t("pages.scheduler.log.job")}
            optionList={(jobs.data?.list ?? []).map((job) => ({ label: job.name, value: job.id }))}
          />
          <Form.Select
            field="status"
            id="job-log-filter-status"
            label={t("pages.scheduler.log.status")}
            optionList={["running", "success", "failed", "cancelled", "timeout"].map((value) => ({ label: statusLabel(value), value }))}
          />
          <Form.Input field="nodeId" id="job-log-filter-node" label={t("pages.scheduler.log.node")} />
          <Form.DatePicker field="startTime" label={t("pages.scheduler.log.started")} type="dateTimeRange" />
          <Button htmlType="reset" onClick={resetSearch}>{t("pages.common.reset")}</Button>
          <Button htmlType="submit" theme="solid" type="primary">{t("pages.common.search")}</Button>
        </Form>
      </Card>
      <Card>
        <div className="iam-toolbar">
          {can(permissions, "system:joblog:remove") ? (
            <Button data-testid="job-log-delete" onClick={openClear} type="danger">{t("pages.common.delete")}</Button>
          ) : null}
        </div>
        <div className="responsive-desktop-table" data-testid="job-log-table">
          <Table<JobLog>
            columns={columns}
            dataSource={list.data?.list ?? []}
            pagination={{ currentPage: page, onChange: setPage, pageSize: 10, total: list.data?.total ?? 0 }}
            rowKey="id"
            scroll={{ x: 1600 }}
          />
        </div>
        <MobileRecordList testId="job-log-mobile-list">
          {(list.data?.list ?? []).map((row) => (
            <MobileRecordCard key={row.id} testId={`job-log-mobile-card-${row.id}`}>
              <MobileRecordTitle>{row.jobName}</MobileRecordTitle>
              <MobileRecordFields>
                <MobileRecordField label={t("pages.scheduler.log.status")} value={<Tag color={statusColor(row.status)}>{statusLabel(row.status)}</Tag>} />
                <MobileRecordField label={t("pages.scheduler.log.started")} value={formatTimestamp(row.startAt, i18n.resolvedLanguage || "en-US")} />
                <MobileRecordField label={t("pages.scheduler.log.node")} value={row.nodeId || "-"} />
                <MobileRecordField label={t("pages.scheduler.log.duration")} value={`${row.durationMs} ms`} />
              </MobileRecordFields>
              <MobileRecordActions>{renderActions(row)}</MobileRecordActions>
            </MobileRecordCard>
          ))}
        </MobileRecordList>
      </Card>
      <Modal footer={null} onCancel={() => setDetailId(undefined)} title={t("pages.scheduler.log.detailTitle")} visible={detailId !== undefined} width="min(900px, calc(100vw - 24px))">
        {detailData ? (
          <div className="scheduler-form-stack" data-testid="job-log-detail-modal">
            <Descriptions
              column={2}
              data={[
                { key: t("pages.scheduler.log.logId"), value: detailData.id },
                { key: t("pages.scheduler.log.job"), value: detailData.jobName },
                { key: t("pages.scheduler.log.status"), value: <Tag color={statusColor(detailData.status)}>{statusLabel(detailData.status)}</Tag> },
                { key: t("pages.scheduler.log.trigger"), value: detailData.trigger },
                { key: t("pages.scheduler.log.node"), value: detailData.nodeId || "-" },
                { key: t("pages.scheduler.log.duration"), value: `${detailData.durationMs} ms` },
                { key: t("pages.scheduler.log.started"), value: formatTimestamp(detailData.startAt, i18n.resolvedLanguage || "en-US") },
                { key: t("pages.scheduler.log.ended"), value: formatTimestamp(detailData.endAt, i18n.resolvedLanguage || "en-US") },
                { hidden: !detailData.errMsg, key: t("pages.scheduler.log.error"), span: 2, value: <Typography.Text type="danger">{detailData.errMsg}</Typography.Text> },
              ]}
              row
            />
            <Card title={t("pages.scheduler.log.jobSnapshot")}><pre className="scheduler-json-code">{prettyJSON(detailData.jobSnapshot)}</pre></Card>
            <Card title={t("pages.scheduler.log.paramsSnapshot")}><pre className="scheduler-json-code">{prettyJSON(detailData.paramsSnapshot)}</pre></Card>
            <Card title={t("pages.scheduler.log.result")}>
              {shellOutput ? (
                <div className="scheduler-form-stack">
                  <div><Typography.Text type="tertiary">stdout</Typography.Text><pre className="scheduler-json-code">{String(shellOutput.stdout ?? "")}</pre></div>
                  <div><Typography.Text type="tertiary">stderr</Typography.Text><pre className="scheduler-json-code">{String(shellOutput.stderr ?? "")}</pre></div>
                  <Typography.Text type="tertiary">exitCode={String(shellOutput.exitCode ?? "-")}</Typography.Text>
                </div>
              ) : <pre className="scheduler-json-code">{prettyJSON(detailData.resultJson)}</pre>}
            </Card>
          </div>
        ) : <Typography.Text>{t("pages.common.loading")}</Typography.Text>}
      </Modal>
      <Modal
        footer={(
          <Space>
            <Button onClick={() => setClearOpen(false)}>{t("pages.common.cancel")}</Button>
            <Button data-testid="job-log-delete-confirm" loading={deleting} onClick={() => void clearLogs()} theme="solid" type="danger">
              {t("pages.common.confirm")}
            </Button>
          </Space>
        )}
        onCancel={() => setClearOpen(false)}
        title={t("pages.scheduler.log.deleteRangeTitle")}
        visible={clearOpen}
        width="min(520px, calc(100vw - 24px))"
      >
        <div className="scheduler-form-stack">
          <div data-testid="job-log-delete-alert">
            <Banner description={t("pages.scheduler.log.deleteRangeDescription")} type="warning" />
          </div>
          <div data-testid="job-log-delete-all-option">
            <Checkbox checked={deleteAll} onChange={(event) => setDeleteAll(Boolean(event.target.checked))}>
              {t("pages.scheduler.log.deleteAllLabel")}
            </Checkbox>
            <Typography.Paragraph type="tertiary">{t("pages.scheduler.log.deleteAllHint")}</Typography.Paragraph>
          </div>
          <div data-testid="job-log-delete-range-section">
            <DatePicker
              data-testid="job-log-delete-range"
              disabled={deleteAll}
              onChange={(value) => setDeleteRange(Array.isArray(value) ? value.map((item) => new Date(item as Date | number | string)) : [])}
              style={{ width: "100%" }}
              type="dateRange"
              value={deleteRange}
            />
          </div>
        </div>
      </Modal>
    </section>
  );
}
