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
import { createOperLogApi, type DictOption, type OperLog, type OperLogListParams } from "./operlog-client";
import { OperLogDetailSideSheet } from "./operlog-detail-side-sheet";
import "./operlog.css";

function can(permissions: ReadonlySet<string>, permission: string): boolean { return permissions.has("*") || permissions.has(permission); }
function message(error: unknown): string { return error instanceof Error ? error.message : String(error); }

export default function OperLogManagement() {
  const host = useLinaPluginHost();
  const api = useMemo(() => createOperLogApi(host.api), [host.api]);
  const [params, setParams] = useState<OperLogListParams>({ pageNum: 1, pageSize: 10 });
  const [rows, setRows] = useState<OperLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<DictOption[]>([]);
  const [statuses, setStatuses] = useState<DictOption[]>([]);
  const [searchType, setSearchType] = useState<string>();
  const searchTypeRef = useRef<string | undefined>(undefined);
  const [searchStatus, setSearchStatus] = useState<number>();
  const searchStatusRef = useRef<number | undefined>(undefined);
  const [selected, setSelected] = useState<number[]>([]);
  const [detail, setDetail] = useState<OperLog>();
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
  useEffect(() => { queueMicrotask(() => void Promise.all([api.dict("sys_oper_type"), api.dict("sys_oper_status")]).then(([typeOptions, statusOptions]) => { setTypes(typeOptions); setStatuses(statusOptions); }).catch((error: unknown) => Toast.error(message(error)))); }, [api]);

  function search(values: OperLogListParams): void {
    setParams({
      ...values,
      operType: searchTypeRef.current,
      pageNum: 1,
      pageSize: params.pageSize,
      status: searchStatusRef.current,
    });
  }

  function reset(): void {
    searchTypeRef.current = undefined;
    searchStatusRef.current = undefined;
    setSearchType(undefined);
    setSearchStatus(undefined);
    setParams({ pageNum: 1, pageSize: params.pageSize });
  }

  function updateSearchType(value: unknown): void {
    const normalized = value === undefined || value === null ? undefined : String(value);
    searchTypeRef.current = normalized;
    setSearchType(normalized);
  }

  function updateSearchStatus(value: unknown): void {
    const normalized = value === undefined || value === null ? undefined : Number(value);
    searchStatusRef.current = normalized;
    setSearchStatus(normalized);
  }

  function cleanAll(): void {
    Modal.confirm({
      cancelText: host.t("pages.common.cancel"),
      content: host.t("plugin.linapro-monitor-operlog.messages.clearConfirm"),
      okButtonProps: { type: "danger" },
      okText: host.t("pages.common.confirm"),
      onOk: async () => {
        try {
          await api.clean();
          Toast.success(host.t("plugin.linapro-monitor-operlog.messages.clearSuccess"));
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
      content: host.t(selected.length ? "pages.exportConfirm.selected" : "pages.exportConfirm.all"),
      okText: host.t("pages.common.confirm"),
      onOk: async () => {
        try {
          downloadBlob(await api.export({ ...params, ids: selected.length ? selected : undefined }), host.t("plugin.linapro-monitor-operlog.exportFileName"));
          Toast.success(host.t("pages.common.exportSuccess"));
        } catch (error) {
          Toast.error(host.t("pages.common.exportFailed"));
          throw error;
        }
      },
      title: host.t("pages.common.confirmTitle"),
    });
  }

  async function openDetail(row: OperLog): Promise<void> {
    try {
      setDetail(await api.detail(row.id));
    } catch (error) {
      Toast.error(message(error));
    }
  }

  async function deleteLogs(): Promise<void> {
    if (!deleteAll && (!beginTime || !endTime)) {
      Toast.warning(host.t("plugin.linapro-monitor-operlog.messages.deleteRangeRequired"));
      return;
    }
    setDeleting(true);
    try {
      const result = await api.clean(deleteAll ? undefined : { beginTime, endTime });
      Toast.success(host.t("plugin.linapro-monitor-operlog.messages.deleteRangeSuccess", { count: result.deleted }));
      setDeleteOpen(false);
      setSelected([]);
      await load();
    } catch (error) {
      Toast.error(message(error));
    } finally {
      setDeleting(false);
    }
  }

  function renderActions(row: OperLog) { return <Button onClick={() => void openDetail(row)} theme="borderless">{host.t("pages.common.detail")}</Button>; }

  const columns: ColumnProps<OperLog>[] = [
    { dataIndex: "id", title: host.t("plugin.linapro-monitor-operlog.fields.logId"), width: 100 },
    { dataIndex: "title", title: host.t("plugin.linapro-monitor-operlog.fields.moduleName"), width: 150 },
    { dataIndex: "operSummary", ellipsis: true, title: host.t("plugin.linapro-monitor-operlog.fields.operSummary"), width: 200 },
    { dataIndex: "operType", render: (value) => <Tag color={dictColor(types, String(value))}>{dictLabel(types, String(value))}</Tag>, title: host.t("plugin.linapro-monitor-operlog.fields.operType"), width: 130 },
    { dataIndex: "operName", title: host.t("plugin.linapro-monitor-operlog.fields.operator"), width: 140 },
    { dataIndex: "operIp", title: host.t("plugin.linapro-monitor-operlog.fields.ipAddress"), width: 150 },
    { dataIndex: "status", render: (value) => <Tag color={dictColor(statuses, Number(value))}>{dictLabel(statuses, Number(value))}</Tag>, title: host.t("plugin.linapro-monitor-operlog.fields.operResult"), width: 130 },
    { dataIndex: "operTime", render: (value) => formatTimestamp(value as number | null, host.locale), sorter: true, title: host.t("plugin.linapro-monitor-operlog.fields.operDate"), width: 190 },
    { dataIndex: "costTime", render: (value) => `${Number(value)} ms`, sorter: true, title: host.t("plugin.linapro-monitor-operlog.fields.duration"), width: 110 },
    { fixed: "right", render: (_, row) => renderActions(row), title: host.t("pages.common.actions"), width: 100 },
  ];

  return <section className="monitor-operlog-page" data-testid="operlog-management-page">
    <Typography.Title heading={3}>{host.t("plugin.linapro-monitor-operlog.tableTitle")}</Typography.Title>
    <Card><Form<OperLogListParams> className="monitor-operlog-search" layout="horizontal" onReset={reset} onSubmit={search}>
      <Form.Input field="title" label={host.t("plugin.linapro-monitor-operlog.fields.moduleName")} />
      <Form.Input field="operName" label={host.t("plugin.linapro-monitor-operlog.fields.operator")} />
      <Form.Slot label={host.t("plugin.linapro-monitor-operlog.fields.operType")}>
        <Select
          aria-label={host.t("plugin.linapro-monitor-operlog.fields.operType")}
          data-testid="operlog-type-filter"
          onChange={updateSearchType}
          onSelect={updateSearchType}
          optionList={types.map((item) => ({ label: item.label, value: String(item.value) }))}
          value={searchType}
        />
      </Form.Slot>
      <Form.Slot label={host.t("plugin.linapro-monitor-operlog.fields.operResult")}>
        <Select
          aria-label={host.t("plugin.linapro-monitor-operlog.fields.operResult")}
          data-testid="operlog-status-filter"
          onChange={updateSearchStatus}
          onSelect={updateSearchStatus}
          optionList={statuses.map((item) => ({ label: item.label, value: Number(item.value) }))}
          value={searchStatus}
        />
      </Form.Slot>
      <Form.Input field="beginTime" label={host.t("plugin.linapro-monitor-operlog.fields.beginDate")} type="date" />
      <Form.Input field="endTime" label={host.t("plugin.linapro-monitor-operlog.fields.endDate")} type="date" />
      <Space><Button htmlType="submit" theme="solid" type="primary">{host.t("pages.common.search")}</Button><Button htmlType="reset">{host.t("pages.common.reset")}</Button></Space>
    </Form></Card>
    <Card><div className="monitor-operlog-toolbar"><Space>
      {can(host.permissions, "monitor:operlog:clear") ? <Button onClick={cleanAll}>{host.t("pages.common.clear")}</Button> : null}
      {can(host.permissions, "monitor:operlog:export") ? <Button onClick={exportLogs}>{host.t("pages.common.export")}</Button> : null}
      {can(host.permissions, "monitor:operlog:remove") ? <Button data-testid="operlog-range-delete" onClick={() => { setBeginTime(""); setEndTime(""); setDeleteAll(false); setDeleteOpen(true); }} theme="solid" type="danger">{host.t("pages.common.delete")}</Button> : null}
    </Space></div><div className="responsive-desktop-table" data-testid="operlog-table"><Table<OperLog> columns={columns} dataSource={rows} loading={loading} onChange={({ pagination, sorter }) => setParams((current) => ({ ...current, orderBy: sorter?.dataIndex ? String(sorter.dataIndex) : undefined, orderDirection: sorter?.sortOrder === "ascend" ? "asc" : sorter?.sortOrder === "descend" ? "desc" : undefined, pageNum: pagination?.currentPage ?? current.pageNum }))} pagination={{ currentPage: params.pageNum, onChange: (pageNum) => setParams((current) => ({ ...current, pageNum })), pageSize: params.pageSize, total }} rowKey="id" rowSelection={{ onChange: (keys) => setSelected((keys ?? []).map(Number)), selectedRowKeys: selected }} scroll={{ x: 1450 }} /></div><MobileRecordList testId="operlog-mobile-list">{rows.map((row) => <MobileRecordCard key={row.id} testId={`operlog-mobile-card-${row.id}`}><MobileRecordTitle>{row.title || String(row.id)}</MobileRecordTitle><MobileRecordFields><MobileRecordField label={host.t("plugin.linapro-monitor-operlog.fields.operType")} value={<Tag color={dictColor(types, row.operType)}>{dictLabel(types, row.operType)}</Tag>} /><MobileRecordField label={host.t("plugin.linapro-monitor-operlog.fields.operator")} value={row.operName || "-"} /><MobileRecordField label={host.t("plugin.linapro-monitor-operlog.fields.operResult")} value={<Tag color={dictColor(statuses, row.status)}>{dictLabel(statuses, row.status)}</Tag>} /><MobileRecordField label={host.t("plugin.linapro-monitor-operlog.fields.operDate")} value={formatTimestamp(row.operTime, host.locale)} /></MobileRecordFields><MobileRecordActions>{renderActions(row)}</MobileRecordActions></MobileRecordCard>)}</MobileRecordList></Card>
    <OperLogDetailSideSheet locale={host.locale} onClose={() => setDetail(undefined)} open={Boolean(detail)} record={detail} statuses={statuses} t={host.t} types={types} />
    <Modal footer={<Space><Button onClick={() => setDeleteOpen(false)}>{host.t("pages.common.cancel")}</Button><Button loading={deleting} onClick={() => void deleteLogs()} theme="solid" type="danger">{host.t("pages.common.confirm")}</Button></Space>} onCancel={() => setDeleteOpen(false)} title={host.t("plugin.linapro-monitor-operlog.messages.deleteRangeTitle")} visible={deleteOpen} width="min(520px, calc(100vw - 24px))">
      <div data-testid="operlog-delete-alert"><Banner description={host.t("plugin.linapro-monitor-operlog.messages.deleteRangeDescription")} type="warning" /></div>
      <div className="monitor-operlog-delete-all" data-testid="operlog-delete-all-option"><Checkbox checked={deleteAll} onChange={(event) => setDeleteAll(Boolean(event.target.checked))}>{host.t("plugin.linapro-monitor-operlog.messages.deleteAllLabel")}</Checkbox><Typography.Paragraph type="tertiary">{host.t("plugin.linapro-monitor-operlog.messages.deleteAllHint")}</Typography.Paragraph></div>
      <div data-testid="operlog-delete-range-section"><Space vertical><Input aria-label={host.t("plugin.linapro-monitor-operlog.fields.beginDate")} disabled={deleteAll} onChange={setBeginTime} type="date" value={beginTime} /><Input aria-label={host.t("plugin.linapro-monitor-operlog.fields.endDate")} disabled={deleteAll} onChange={setEndTime} type="date" value={endTime} /></Space></div>
    </Modal>
  </section>;
}
