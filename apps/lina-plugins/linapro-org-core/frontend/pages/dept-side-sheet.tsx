import Button from "@douyinfe/semi-ui/lib/es/button";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import SideSheet from "@douyinfe/semi-ui/lib/es/sideSheet";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import type { TreeNodeData } from "@douyinfe/semi-ui/lib/es/tree/interface";
import { useEffect, useState } from "react";

import type { Dept, DeptApi, DeptUser, DictOption } from "./dept-client";
import { toDeptSelectTree, toDeptSelectTreeFromRows } from "./dept-data";

type Translate = (key: string, options?: Record<string, unknown>) => string;
interface DeptValues extends Omit<Partial<Dept>, "leader"> { leader?: string }

function message(error: unknown, fallback: string): string { return error instanceof Error ? error.message : fallback; }

export function DeptSideSheet({ api, deptId, onClose, onSaved, open, parentId, t }: {
  api: DeptApi;
  deptId?: number;
  onClose(): void;
  onSaved(): Promise<void>;
  open: boolean;
  parentId?: number;
  t: Translate;
}) {
  const [loading, setLoading] = useState(false); const [saving, setSaving] = useState(false); const [initial, setInitial] = useState<DeptValues>(); const [tree, setTree] = useState<TreeNodeData[]>([]); const [leaders, setLeaders] = useState<DeptUser[]>([]); const [statuses, setStatuses] = useState<DictOption[]>([]);
  async function loadLeaders(keyword?: string): Promise<void> { try { setLeaders(await api.users(deptId ?? 0, { keyword, limit: 10 })); } catch (error) { Toast.error(message(error, t("plugin.linapro-org-core.dept.messages.loadLeadersFailed"))); } }
  useEffect(() => {
    if (!open) return;
    let active = true;
    queueMicrotask(() => { if (!active) return; setLoading(true); setInitial(undefined); void Promise.all([
      deptId ? api.exclude(deptId).then(toDeptSelectTreeFromRows) : api.tree().then(toDeptSelectTree),
      api.dict("sys_normal_disable"), api.users(deptId ?? 0, { limit: 10 }), deptId ? api.info(deptId) : Promise.resolve(undefined),
    ]).then(([nodes, statusOptions, users, record]) => { if (!active) return; setTree([{ children: nodes, key: "0", label: t("plugin.linapro-org-core.dept.tree.topLevelDept"), value: 0 }]); setStatuses(statusOptions); setLeaders(users); setInitial(record ? { ...record, leader: record.leader ? String(record.leader) : undefined } : { orderNum: 0, parentId: parentId ?? 0, status: 1 }); }).catch((error: unknown) => { if (active) Toast.error(message(error, t("plugin.linapro-org-core.dept.messages.loadFailed"))); }).finally(() => { if (active) setLoading(false); }); });
    return () => { active = false; };
  }, [api, deptId, open, parentId, t]);
  async function submit(values: DeptValues): Promise<void> { setSaving(true); try { const payload: Partial<Dept> = { ...values, leader: values.leader ? Number(values.leader) : 0 }; if (deptId) await api.update(deptId, payload); else await api.add(payload); Toast.success(t(deptId ? "pages.common.updateSuccess" : "pages.common.createSuccess")); onClose(); await onSaved(); } catch (error) { Toast.error(message(error, t("plugin.linapro-org-core.dept.messages.saveFailed"))); } finally { setSaving(false); } }
  return <SideSheet className="org-core-dept-sheet" closable onCancel={onClose} title={t(deptId ? "plugin.linapro-org-core.dept.drawer.editTitle" : "plugin.linapro-org-core.dept.drawer.createTitle")} visible={open} width={640}>{loading || !initial ? <Spin aria-label={t("pages.common.loading")} /> : <Form<DeptValues> className="org-core-drawer-form" initValues={initial} key={`${deptId ?? "new"}-${parentId ?? 0}`} labelPosition="top" onSubmit={submit}>
    <Form.TreeSelect field="parentId" label={t("plugin.linapro-org-core.dept.fields.parentDept")} rules={[{ required: true, message: t("pages.settings.required") }]} treeData={tree} />
    <Form.Input field="name" label={t("plugin.linapro-org-core.dept.fields.name")} rules={[{ required: true, message: t("pages.settings.required") }]} />
    <Form.Input field="code" label={t("plugin.linapro-org-core.dept.fields.code")} />
    <Form.InputNumber field="orderNum" label={t("plugin.linapro-org-core.dept.fields.sortOrder")} min={0} rules={[{ required: true, message: t("pages.settings.required") }]} />
    <Form.Select field="leader" filter label={t("plugin.linapro-org-core.dept.fields.leader")} onSearch={(value) => void loadLeaders(value)} optionList={leaders.map((user) => ({ label: `${user.username} | ${user.nickname}`, value: user.id }))} placeholder={t("plugin.linapro-org-core.dept.placeholders.selectLeader")} showClear />
    <Form.Input field="phone" label={t("plugin.linapro-org-core.dept.fields.phone")} />
    <Form.Input field="email" label={t("plugin.linapro-org-core.dept.fields.email")} type="email" />
    <div aria-label={t("pages.common.status")} role="radiogroup"><Form.RadioGroup field="status" label={t("pages.common.status")} options={statuses.map((item) => ({ label: item.label, value: Number(item.value) }))} /></div>
    <Form.TextArea field="remark" label={t("pages.common.remark")} rows={3} />
    <Button htmlType="submit" loading={saving} theme="solid" type="primary">{t("pages.common.confirm")}</Button>
  </Form>}</SideSheet>;
}
