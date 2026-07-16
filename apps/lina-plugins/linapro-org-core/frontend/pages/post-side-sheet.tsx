import Button from "@douyinfe/semi-ui/lib/es/button";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import SideSheet from "@douyinfe/semi-ui/lib/es/sideSheet";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import type { TreeNodeData } from "@douyinfe/semi-ui/lib/es/tree/interface";
import { useEffect, useState } from "react";

import type { DictOption } from "./dept-client";
import type { Post, PostApi } from "./post-client";
import { toPostDeptTree } from "./post-data";

type Translate = (key: string, options?: Record<string, unknown>) => string;
function message(error: unknown, fallback: string): string { return error instanceof Error ? error.message : fallback; }

export function PostSideSheet({ api, onClose, onSaved, open, postId, t }: { api: PostApi; onClose(): void; onSaved(): Promise<void>; open: boolean; postId?: number; t: Translate }) {
  const [loading, setLoading] = useState(false); const [saving, setSaving] = useState(false); const [initial, setInitial] = useState<Partial<Post>>(); const [tree, setTree] = useState<TreeNodeData[]>([]); const [statuses, setStatuses] = useState<DictOption[]>([]);
  useEffect(() => { if (!open) return; let active = true; queueMicrotask(() => { if (!active) return; setLoading(true); setInitial(undefined); void Promise.all([api.deptTree(), api.dict("sys_normal_disable"), postId ? api.info(postId) : Promise.resolve(undefined)]).then(([nodes, statusOptions, record]) => { if (!active) return; setTree(toPostDeptTree(nodes)); setStatuses(statusOptions); setInitial(record ?? { sort: 0, status: 1 }); }).catch((error: unknown) => { if (active) Toast.error(message(error, t("plugin.linapro-org-core.post.messages.loadFailed"))); }).finally(() => { if (active) setLoading(false); }); }); return () => { active = false; }; }, [api, open, postId, t]);
  async function submit(values: Partial<Post>): Promise<void> { setSaving(true); try { if (postId) await api.update(postId, values); else await api.add(values); Toast.success(t(postId ? "pages.common.updateSuccess" : "pages.common.createSuccess")); onClose(); await onSaved(); } catch (error) { Toast.error(message(error, t("plugin.linapro-org-core.post.messages.saveFailed"))); } finally { setSaving(false); } }
  return <SideSheet className="org-core-post-sheet" closable onCancel={onClose} title={t(postId ? "plugin.linapro-org-core.post.drawer.editTitle" : "plugin.linapro-org-core.post.drawer.createTitle")} visible={open} width={680}>{loading || !initial ? <Spin aria-label={t("pages.common.loading")} /> : <Form<Partial<Post>> className="org-core-drawer-form" initValues={initial} key={postId ?? "new"} labelPosition="top" onSubmit={submit}>
    <Form.TreeSelect field="deptId" label={t("plugin.linapro-org-core.post.fields.dept")} rules={[{ required: true, message: t("pages.settings.required") }]} treeData={tree} />
    <Form.Input field="name" label={t("plugin.linapro-org-core.post.fields.name")} rules={[{ required: true, message: t("pages.settings.required") }]} />
    <Form.Input field="code" label={t("plugin.linapro-org-core.post.fields.code")} rules={[{ required: true, message: t("pages.settings.required") }]} />
    <Form.InputNumber field="sort" label={t("plugin.linapro-org-core.post.fields.sortOrder")} min={0} />
    <div aria-label={t("pages.common.status")} role="radiogroup"><Form.RadioGroup field="status" label={t("pages.common.status")} options={statuses.map((item) => ({ label: item.label, value: Number(item.value) }))} /></div>
    <Form.TextArea field="remark" label={t("pages.common.remark")} rows={3} />
    <Button htmlType="submit" loading={saving} theme="solid" type="primary">{t("pages.common.confirm")}</Button>
  </Form>}</SideSheet>;
}
