import Banner from "@douyinfe/semi-ui/lib/es/banner";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import Checkbox from "@douyinfe/semi-ui/lib/es/checkbox";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Input from "@douyinfe/semi-ui/lib/es/input";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Select from "@douyinfe/semi-ui/lib/es/select";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { MobileRecordActions, MobileRecordCard, MobileRecordField, MobileRecordFields, MobileRecordList, MobileRecordTitle, useLinaPluginHost } from "@linapro/plugin-ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { dictColor, dictLabel, downloadBlob, formatTimestamp } from "./data";
import { createLoginLogApi, type DictOption, type LoginLog, type LoginLogListParams } from "./loginlog-client";
import { LoginLogDetailModal } from "./loginlog-detail-modal";
import "./loginlog.css";

function can(permissions: ReadonlySet<string>, permission: string): boolean { return permissions.has("*") || permissions.has(permission); }
function message(error: unknown): string { return error instanceof Error ? error.message : String(error); }

export default function LoginLogManagement() {
  const host = useLinaPluginHost();
  const api = useMemo(() => createLoginLogApi(host.api), [host.api]);
  const [params, setParams] = useState<LoginLogListParams>({ pageNum: 1, pageSize: 10 });
  const [rows, setRows] = useState<LoginLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<DictOption[]>([]);
  const [searchStatus, setSearchStatus] = useState<string>();
  const searchStatusRef = useRef<string | undefined>(undefined);
  const [detail, setDetail] = useState<LoginLog>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteAll, setDeleteAll] = useState(false);
  const [beginTime, setBeginTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.list(params);
      setRows(result.items);
      setTotal(result.total);
    } catch (error) {
      Toast.error(message(error));
    } finally {
      setLoading(false);
    }
  }, [api, params]);

  useEffect(() => { queueMicrotask(() => void load()); }, [load]);
  useEffect(() => { queueMicrotask(() => void api.dict("sys_login_status").then(setStatuses).catch((error: unknown) => Toast.error(message(error)))); }, [api]);

  function search(values: LoginLogListParams): void {
    setParams({ ...values, pageNum: 1, pageSize: params.pageSize, status: searchStatusRef.current });
  }

  function reset(): void {
    searchStatusRef.current = undefined;
    setSearchStatus(undefined);
    setParams({ pageNum: 1, pageSize: params.pageSize });
  }

  function updateSearchStatus(value: unknown): void {
    const normalized = value === undefined || value === null ? undefined : String(value);
    searchStatusRef.current = normalized;
    setSearchStatus(normalized);
  }

  function cleanAll(): void {
    Modal.confirm({
      cancelText: host.t("pages.common.cancel"),
      content: host.t("plugin.linapro-monitor-loginlog.messages.clearConfirm"),
      okButtonProps: { type: "danger" },
      okText: host.t("pages.common.confirm"),
      onOk: async () => {
        try {
          await api.clean();
          Toast.success(host.t("plugin.linapro-monitor-loginlog.messages.clearSuccess"));
          await load();
        } catch (error) {
          Toast.error(message(error));
          throw error;
        }
      },
      title: host.t("pages.common.confirmTitle"),
    });
  }

  function exportLogs(): void {
    Modal.confirm({
      cancelText: host.t("pages.common.cancel"),
      content: host.t("pages.exportConfirm.all"),
      okText: host.t("pages.common.confirm"),
      onOk: async () => {
        try {
          downloadBlob(await api.export(params), host.t("plugin.linapro-monitor-loginlog.exportFileName"));
          Toast.success(host.t("pages.common.exportSuccess"));
        } catch (error) {
          Toast.error(host.t("pages.common.exportFailed"));
          throw error;
        }
      },
      title: host.t("pages.common.confirmTitle"),
    });
  }

  async function deleteLogs(): Promise<void> {
    if (!deleteAll && (!beginTime || !endTime)) {
      Toast.warning(host.t("plugin.linapro-monitor-loginlog.messages.deleteRangeRequired"));
      return;
    }
    setDeleting(true);
    try {
      const result = await api.clean(deleteAll ? undefined : { beginTime, endTime });
      Toast.success(host.t("plugin.linapro-monitor-loginlog.messages.deleteRangeSuccess", { count: result.deleted }));
      setDeleteOpen(false);
      await load();
    } catch (error) {
      Toast.error(message(error));
    } finally {
      setDeleting(false);
    }
  }

  function renderActions(row: LoginLog) { return <Button onClick={() => setDetail(row)} theme="borderless">{host.t("pages.common.detail")}</Button>; }

  const columns: ColumnProps<LoginLog>[] = [
    { dataIndex: "userName", title: host.t("plugin.linapro-monitor-loginlog.fields.userName"), width: 150 },
    { dataIndex: "ip", title: host.t("plugin.linapro-monitor-loginlog.fields.ipAddress"), width: 150 },
    { dataIndex: "browser", title: host.t("plugin.linapro-monitor-loginlog.fields.browser"), width: 150 },
    { dataIndex: "os", title: host.t("plugin.linapro-monitor-loginlog.fields.os"), width: 160 },
    { dataIndex: "status", render: (value) => <Tag color={dictColor(statuses, Number(value))}>{dictLabel(statuses, Number(value))}</Tag>, title: host.t("plugin.linapro-monitor-loginlog.fields.status"), width: 120 },
    { dataIndex: "msg", ellipsis: true, title: host.t("plugin.linapro-monitor-loginlog.fields.message"), width: 220 },
    { dataIndex: "loginTime", render: (value) => formatTimestamp(value as number | null, host.locale), sorter: true, title: host.t("plugin.linapro-monitor-loginlog.fields.loginDate"), width: 190 },
    { fixed: "right", render: (_, row) => renderActions(row), title: host.t("pages.common.actions"), width: 100 },
  ];

  return <section className="monitor-loginlog-page" data-testid="loginlog-management-page">
    <Typography.Title heading={3}>{host.t("plugin.linapro-monitor-loginlog.tableTitle")}</Typography.Title>
    <Card><Form<LoginLogListParams> className="monitor-loginlog-search" layout="horizontal" onReset={reset} onSubmit={search}>
      <Form.Input field="userName" label={host.t("plugin.linapro-monitor-loginlog.fields.userName")} />
      <Form.Input field="ip" label={host.t("plugin.linapro-monitor-loginlog.fields.ipAddress")} />
      <Form.Slot label={host.t("plugin.linapro-monitor-loginlog.fields.status")}>
        <Select
          aria-label={host.t("plugin.linapro-monitor-loginlog.fields.status")}
          data-testid="loginlog-status-filter"
          onChange={updateSearchStatus}
          onSelect={updateSearchStatus}
          optionList={statuses.map((item) => ({ label: item.label, value: String(item.value) }))}
          value={searchStatus}
        />
      </Form.Slot>
      <Form.Input field="beginTime" label={host.t("plugin.linapro-monitor-loginlog.fields.beginDate")} type="date" />
      <Form.Input field="endTime" label={host.t("plugin.linapro-monitor-loginlog.fields.endDate")} type="date" />
      <Space><Button htmlType="submit" theme="solid" type="primary">{host.t("pages.common.search")}</Button><Button htmlType="reset">{host.t("pages.common.reset")}</Button></Space>
    </Form></Card>
    <Card><div className="monitor-loginlog-toolbar"><Space>
      {can(host.permissions, "monitor:loginlog:clear") ? <Button onClick={cleanAll}>{host.t("pages.common.clear")}</Button> : null}
      {can(host.permissions, "monitor:loginlog:export") ? <Button onClick={exportLogs}>{host.t("pages.common.export")}</Button> : null}
      {can(host.permissions, "monitor:loginlog:remove") ? <Button data-testid="loginlog-range-delete" onClick={() => { setBeginTime(""); setEndTime(""); setDeleteAll(false); setDeleteOpen(true); }} theme="solid" type="danger">{host.t("pages.common.delete")}</Button> : null}
    </Space></div><div className="responsive-desktop-table" data-testid="loginlog-table"><Table<LoginLog> columns={columns} dataSource={rows} loading={loading} onChange={({ pagination, sorter }) => setParams((current) => ({ ...current, orderBy: sorter?.dataIndex ? String(sorter.dataIndex) : undefined, orderDirection: sorter?.sortOrder === "ascend" ? "asc" : sorter?.sortOrder === "descend" ? "desc" : undefined, pageNum: pagination?.currentPage ?? current.pageNum }))} pagination={{ currentPage: params.pageNum, onChange: (pageNum) => setParams((current) => ({ ...current, pageNum })), pageSize: params.pageSize, total }} rowKey="id" scroll={{ x: 1200 }} /></div><MobileRecordList testId="loginlog-mobile-list">{rows.map((row) => <MobileRecordCard key={row.id} testId={`loginlog-mobile-card-${row.id}`}><MobileRecordTitle>{row.userName || "-"}</MobileRecordTitle><MobileRecordFields><MobileRecordField label={host.t("plugin.linapro-monitor-loginlog.fields.status")} value={<Tag color={dictColor(statuses, row.status)}>{dictLabel(statuses, row.status)}</Tag>} /><MobileRecordField label={host.t("plugin.linapro-monitor-loginlog.fields.ipAddress")} value={row.ip || "-"} /><MobileRecordField label={host.t("plugin.linapro-monitor-loginlog.fields.message")} value={row.msg || "-"} /><MobileRecordField label={host.t("plugin.linapro-monitor-loginlog.fields.loginDate")} value={formatTimestamp(row.loginTime, host.locale)} /></MobileRecordFields><MobileRecordActions>{renderActions(row)}</MobileRecordActions></MobileRecordCard>)}</MobileRecordList></Card>
    <LoginLogDetailModal locale={host.locale} onClose={() => setDetail(undefined)} open={Boolean(detail)} record={detail} statuses={statuses} t={host.t} />
    <Modal footer={<Space><Button onClick={() => setDeleteOpen(false)}>{host.t("pages.common.cancel")}</Button><Button loading={deleting} onClick={() => void deleteLogs()} theme="solid" type="danger">{host.t("pages.common.confirm")}</Button></Space>} onCancel={() => setDeleteOpen(false)} title={host.t("plugin.linapro-monitor-loginlog.messages.deleteRangeTitle")} visible={deleteOpen} width="min(520px, calc(100vw - 24px))">
      <div data-testid="loginlog-delete-alert"><Banner description={host.t("plugin.linapro-monitor-loginlog.messages.deleteRangeDescription")} type="warning" /></div>
      <div className="monitor-loginlog-delete-all" data-testid="loginlog-delete-all-option"><Checkbox checked={deleteAll} onChange={(event) => setDeleteAll(Boolean(event.target.checked))}>{host.t("plugin.linapro-monitor-loginlog.messages.deleteAllLabel")}</Checkbox><Typography.Paragraph type="tertiary">{host.t("plugin.linapro-monitor-loginlog.messages.deleteAllHint")}</Typography.Paragraph></div>
      <div data-testid="loginlog-delete-range-section"><Space vertical><Input aria-label={host.t("plugin.linapro-monitor-loginlog.fields.beginDate")} disabled={deleteAll} onChange={setBeginTime} type="date" value={beginTime} /><Input aria-label={host.t("plugin.linapro-monitor-loginlog.fields.endDate")} disabled={deleteAll} onChange={setEndTime} type="date" value={endTime} /></Space></div>
    </Modal>
  </section>;
}
