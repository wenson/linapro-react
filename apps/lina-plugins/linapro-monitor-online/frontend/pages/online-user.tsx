import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Tooltip from "@douyinfe/semi-ui/lib/es/tooltip";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useLinaPluginHost } from "@linapro/plugin-ui";
import { useCallback, useEffect, useMemo, useState } from "react";

import { formatTimestamp } from "./data";
import { createOnlineApi, type OnlineListParams, type OnlineUser } from "./online-client";
import "./online.css";

function can(permissions: ReadonlySet<string>, permission: string): boolean { return permissions.has("*") || permissions.has(permission); }
function message(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function truncatedCell(value: unknown) {
  const text = String(value || "-");
  return <Tooltip content={text}><span className="monitor-online-truncated" title={text}>{text}</span></Tooltip>;
}

export default function OnlineUserPage() {
  const host = useLinaPluginHost();
  const api = useMemo(() => createOnlineApi(host.api), [host.api]);
  const [params, setParams] = useState<OnlineListParams>({ pageNum: 1, pageSize: 10 });
  const [rows, setRows] = useState<OnlineUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

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

  async function forceLogout(row: OnlineUser): Promise<void> {
    try {
      await api.forceLogout(row.tokenId);
      await load();
    } catch (error) {
      Toast.error(message(error));
    }
  }

  const columns: ColumnProps<OnlineUser>[] = [
    { dataIndex: "username", title: host.t("plugin.linapro-monitor-online.page.fields.loginAccount"), width: 160 },
    { dataIndex: "deptName", title: host.t("plugin.linapro-monitor-online.page.fields.departmentName"), width: 180 },
    { dataIndex: "ip", title: host.t("plugin.linapro-monitor-online.page.fields.ipAddress"), width: 160 },
    { dataIndex: "browser", render: (value) => truncatedCell(value), title: host.t("plugin.linapro-monitor-online.page.fields.browser"), width: 180 },
    { dataIndex: "os", render: (value) => truncatedCell(value), title: host.t("plugin.linapro-monitor-online.page.fields.os"), width: 200 },
    { dataIndex: "loginTime", render: (value) => formatTimestamp(value as number | null, host.locale), title: host.t("plugin.linapro-monitor-online.page.fields.loginTime"), width: 190 },
    { fixed: "right", render: (_, row) => can(host.permissions, "monitor:online:forceLogout") ? <Popconfirm content={host.t("plugin.linapro-monitor-online.page.messages.forceLogoutConfirm", { username: row.username })} onConfirm={() => void forceLogout(row)}><Button theme="borderless" type="danger">{host.t("plugin.linapro-monitor-online.page.actions.forceLogout")}</Button></Popconfirm> : null, title: host.t("plugin.linapro-monitor-online.page.fields.actions"), width: 130 },
  ];

  return <section className="monitor-online-page" data-testid="online-user-page">
    <Typography.Title heading={3}>{host.t("plugin.linapro-monitor-online.page.tableTitlePrefix")}<strong>{total}</strong>{host.t("plugin.linapro-monitor-online.page.tableTitleSuffix")}</Typography.Title>
    <Card><Form<OnlineListParams> className="monitor-online-search" layout="horizontal" onReset={() => setParams({ pageNum: 1, pageSize: params.pageSize })} onSubmit={(values) => setParams({ ...values, pageNum: 1, pageSize: params.pageSize })}>
      <Form.Input field="username" label={host.t("plugin.linapro-monitor-online.page.fields.userAccount")} />
      <Form.Input field="ip" label={host.t("plugin.linapro-monitor-online.page.fields.ipAddress")} />
      <Space><Button htmlType="submit" theme="solid" type="primary">{host.t("pages.common.search")}</Button><Button htmlType="reset">{host.t("pages.common.reset")}</Button></Space>
    </Form></Card>
    <Card><div data-testid="online-user-table"><Table<OnlineUser> columns={columns} dataSource={rows} loading={loading} pagination={{ currentPage: params.pageNum, onChange: (pageNum) => setParams((current) => ({ ...current, pageNum })), pageSize: params.pageSize, total }} rowKey="tokenId" scroll={{ x: 1050 }} /></div></Card>
  </section>;
}
