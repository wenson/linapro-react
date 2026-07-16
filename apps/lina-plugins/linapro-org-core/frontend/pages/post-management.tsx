import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Table from "@douyinfe/semi-ui/lib/es/table";
import type { ColumnProps } from "@douyinfe/semi-ui/lib/es/table/interface";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Tree from "@douyinfe/semi-ui/lib/es/tree";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useLinaPluginHost } from "@linapro/plugin-ui";
import { useCallback, useEffect, useMemo, useState } from "react";

import { dictColor, dictLabel, formatTimestamp } from "./dept-data";
import type { DictOption } from "./dept-client";
import { createPostApi, type Post, type PostDeptTreeNode, type PostListParams } from "./post-client";
import { downloadBlob, toPostDeptTree } from "./post-data";
import { PostSideSheet } from "./post-side-sheet";
import "./org-core.css";

function can(permissions: ReadonlySet<string>, permission: string): boolean { return permissions.has("*") || permissions.has(permission); }
function message(error: unknown): string { return error instanceof Error ? error.message : String(error); }

export default function PostManagement() {
  const host = useLinaPluginHost(); const api = useMemo(() => createPostApi(host.api), [host.api]); const [params, setParams] = useState<PostListParams>({ pageNum: 1, pageSize: 10 }); const [rows, setRows] = useState<Post[]>([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(false); const [statuses, setStatuses] = useState<DictOption[]>([]); const [deptTree, setDeptTree] = useState<PostDeptTreeNode[]>([]); const [selected, setSelected] = useState<number[]>([]); const [editing, setEditing] = useState<number | "new">();
  const load = useCallback(async () => { setLoading(true); try { const result = await api.list(params); setRows(result.items); setTotal(result.total); } catch (error) { Toast.error(message(error)); } finally { setLoading(false); } }, [api, params]);
  const loadTree = useCallback(async () => { try { setDeptTree(await api.deptTree()); } catch (error) { Toast.error(message(error)); } }, [api]);
  useEffect(() => { queueMicrotask(() => void load()); }, [load]); useEffect(() => { queueMicrotask(() => void Promise.all([api.dict("sys_normal_disable"), loadTree()]).then(([options]) => setStatuses(options)).catch((error: unknown) => Toast.error(message(error)))); }, [api, loadTree]);
  async function remove(ids: number[]): Promise<void> { try { await api.delete(ids); setSelected([]); Toast.success(host.t("pages.common.deleteSuccess")); await Promise.all([load(), loadTree()]); } catch (error) { Toast.error(message(error)); } }
  function batchRemove(): void { Modal.confirm({ cancelText: host.t("pages.common.cancel"), content: host.t("plugin.linapro-org-core.post.messages.deleteSelectedConfirm", { count: selected.length }), okButtonProps: { type: "danger" }, okText: host.t("pages.common.confirm"), onOk: () => remove(selected), title: host.t("pages.common.confirmTitle") }); }
  function exportPosts(): void { Modal.confirm({ cancelText: host.t("pages.common.cancel"), content: host.t("pages.exportConfirm.all"), okText: host.t("pages.common.confirm"), onOk: async () => { try { downloadBlob(await api.export(params), host.t("plugin.linapro-org-core.post.exportFileName")); Toast.success(host.t("pages.common.exportSuccess")); } catch (error) { Toast.error(host.t("pages.common.exportFailed")); throw error; } }, title: host.t("pages.common.confirmTitle") }); }
  function reset(): void { setParams({ pageNum: 1, pageSize: params.pageSize }); }
  const columns: ColumnProps<Post>[] = [
    { dataIndex: "code", title: host.t("plugin.linapro-org-core.post.fields.code"), width: 160 }, { dataIndex: "name", title: host.t("plugin.linapro-org-core.post.fields.name"), width: 180 }, { dataIndex: "sort", title: host.t("plugin.linapro-org-core.post.fields.sortOrder"), width: 100 }, { dataIndex: "status", render: (value) => <Tag color={dictColor(statuses, Number(value))}>{dictLabel(statuses, Number(value))}</Tag>, title: host.t("pages.common.status"), width: 120 }, { dataIndex: "createdAt", render: (value) => formatTimestamp(value as number | null, host.locale), title: host.t("pages.common.createdAt"), width: 190 },
    { fixed: "right", render: (_, row) => <Space>{can(host.permissions, "system:post:edit") ? <Button onClick={() => setEditing(row.id)} theme="borderless">{host.t("pages.common.edit")}</Button> : null}{can(host.permissions, "system:post:remove") ? <Popconfirm content={host.t("pages.common.deleteConfirm")} onConfirm={() => void remove([row.id])}><Button theme="borderless" type="danger">{host.t("pages.common.delete")}</Button></Popconfirm> : null}</Space>, title: host.t("pages.common.actions"), width: 150 },
  ];
  return <section className="org-core-page" data-testid="org-post-page"><Typography.Title heading={3}>{host.t("plugin.linapro-org-core.post.tableTitle")}</Typography.Title><div className="org-core-post-layout"><Card className="org-core-tree" title={host.t("plugin.linapro-org-core.post.tree.title")}><div data-testid="org-post-dept-tree"><Tree aria-label={host.t("plugin.linapro-org-core.post.tree.title")} defaultExpandAll filterTreeNode key={deptTree.length ? "loaded" : "loading"} onSelect={(key) => setParams((current) => ({ ...current, deptId: key ? Number(key) : undefined, pageNum: 1 }))} searchPlaceholder={host.t("plugin.linapro-org-core.post.tree.searchPlaceholder")} showClear showLine treeData={toPostDeptTree(deptTree)} /></div></Card><div className="org-core-post-main"><Card><Form<PostListParams> className="org-core-search" layout="horizontal" onReset={reset} onSubmit={(values) => setParams((current) => ({ ...current, ...values, pageNum: 1 }))}><Form.Input field="code" label={host.t("plugin.linapro-org-core.post.fields.code")} /><Form.Input field="name" label={host.t("plugin.linapro-org-core.post.fields.name")} /><Form.Select field="status" label={host.t("pages.common.status")} optionList={statuses.map((item) => ({ label: item.label, value: Number(item.value) }))} /><Space><Button htmlType="submit" theme="solid" type="primary">{host.t("pages.common.search")}</Button><Button htmlType="reset">{host.t("pages.common.reset")}</Button></Space></Form></Card><Card><div className="org-core-toolbar"><Space>{can(host.permissions, "system:post:remove") ? <Button data-testid="org-post-batch-delete" disabled={!selected.length} onClick={batchRemove} type="danger">{host.t("pages.common.delete")}</Button> : null}{can(host.permissions, "system:post:export") ? <Button onClick={exportPosts}>{host.t("pages.common.export")}</Button> : null}{can(host.permissions, "system:post:add") ? <Button data-testid="org-post-add" onClick={() => setEditing("new")} theme="solid" type="primary">{host.t("pages.common.add")}</Button> : null}</Space></div><div data-testid="org-post-table"><Table<Post> columns={columns} dataSource={rows} loading={loading} pagination={{ currentPage: params.pageNum, onChange: (pageNum) => setParams((current) => ({ ...current, pageNum })), pageSize: params.pageSize, showTotal: true, total }} rowKey="id" rowSelection={{ onChange: (keys) => setSelected((keys ?? []).map(Number)), selectedRowKeys: selected }} scroll={{ x: 950 }} /></div></Card></div></div><PostSideSheet api={api} onClose={() => setEditing(undefined)} onSaved={async () => { await Promise.all([load(), loadTree()]); }} open={editing !== undefined} postId={editing === "new" ? undefined : editing} t={host.t} /></section>;
}
