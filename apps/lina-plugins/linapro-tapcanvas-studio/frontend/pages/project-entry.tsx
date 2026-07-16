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
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useLinaPluginHost } from "@linapro/plugin-ui";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createProjectApi,
  type ChapterItem,
  type ChapterSaveInput,
  type DictOption,
  type ProjectItem,
  type ProjectListInput,
  type ProjectSaveInput,
} from "./project-client";
import "./studio-bootstrap.css";

type Translate = (key: string, options?: Record<string, unknown>) => string;

function can(permissions: ReadonlySet<string>, permission: string): boolean {
  return permissions.has("*") || permissions.has(permission);
}

function timestamp(value: number | null, locale: string): string {
  return typeof value === "number" ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(value) : "—";
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function chapterStatusLabel(t: Translate, statuses: DictOption[], value: string): string {
  const key = `plugin.linapro-tapcanvas-studio.projects.chapters.status.${value}`;
  const translated = t(key);
  return translated === key
    ? (statuses.find((item) => item.value === value)?.label ?? value)
    : translated;
}

function ProjectEditor(props: {
  item?: ProjectItem;
  onClose: () => void;
  onSave: (values: ProjectSaveInput) => Promise<void>;
  open: boolean;
  t: Translate;
}) {
  const [saving, setSaving] = useState(false);
  const submit = async (values: ProjectSaveInput) => {
    setSaving(true);
    try { await props.onSave(values); } finally { setSaving(false); }
  };
  return (
    <Modal footer={null} onCancel={props.onClose} title={props.t(props.item ? "plugin.linapro-tapcanvas-studio.projects.editTitle" : "plugin.linapro-tapcanvas-studio.projects.createTitle")} visible={props.open}>
      <Form<ProjectSaveInput> key={`${props.item?.id ?? "new"}:${String(props.open)}`} initValues={{ description: props.item?.description ?? "", name: props.item?.name ?? "" }} onSubmit={(values) => void submit(values)}>
        <Form.Input field="name" label={props.t("plugin.linapro-tapcanvas-studio.projects.fields.name")} maxLength={200} rules={[{ required: true }]} />
        <Form.TextArea field="description" label={props.t("plugin.linapro-tapcanvas-studio.projects.fields.description")} maxCount={1000} rows={4} />
        <div className="tapcanvas-projects__modal-actions"><Space><Button onClick={props.onClose}>{props.t("pages.common.cancel")}</Button><Button htmlType="submit" loading={saving} theme="solid" type="primary">{props.t("pages.common.save")}</Button></Space></div>
      </Form>
    </Modal>
  );
}

function ChapterEditor(props: {
  item?: ChapterItem;
  onClose: () => void;
  onSave: (values: ChapterSaveInput) => Promise<void>;
  open: boolean;
  statuses: DictOption[];
  t: Translate;
}) {
  const [saving, setSaving] = useState(false);
  const submit = async (values: ChapterSaveInput) => {
    setSaving(true);
    try { await props.onSave(values); } finally { setSaving(false); }
  };
  return (
    <Modal footer={null} onCancel={props.onClose} title={props.t(props.item ? "plugin.linapro-tapcanvas-studio.projects.chapters.editTitle" : "plugin.linapro-tapcanvas-studio.projects.chapters.createTitle")} visible={props.open}>
      <Form<ChapterSaveInput> key={`${props.item?.id ?? "new"}:${String(props.open)}`} initValues={{ status: props.item?.status ?? "draft", summary: props.item?.summary ?? "", title: props.item?.title ?? "" }} onSubmit={(values) => void submit(values)}>
        <Form.Input field="title" label={props.t("plugin.linapro-tapcanvas-studio.projects.chapters.fields.title")} maxLength={200} rules={[{ required: true }]} />
        <Form.TextArea field="summary" label={props.t("plugin.linapro-tapcanvas-studio.projects.chapters.fields.summary")} maxCount={5000} rows={5} />
        {props.item ? <Form.Select field="status" label={props.t("plugin.linapro-tapcanvas-studio.projects.chapters.fields.status")} optionList={props.statuses.map((item) => ({ label: chapterStatusLabel(props.t, props.statuses, item.value), value: item.value }))} /> : null}
        <div className="tapcanvas-projects__modal-actions"><Space><Button onClick={props.onClose}>{props.t("pages.common.cancel")}</Button><Button htmlType="submit" loading={saving} theme="solid" type="primary">{props.t("pages.common.save")}</Button></Space></div>
      </Form>
    </Modal>
  );
}

export default function ProjectEntry() {
  const host = useLinaPluginHost();
  const api = useMemo(() => createProjectApi(host.api), [host.api]);
  const [params, setParams] = useState<ProjectListInput>({ pageNum: 1, pageSize: 10 });
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [total, setTotal] = useState(0);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectEditor, setProjectEditor] = useState<"new" | ProjectItem>();
  const [selectedProject, setSelectedProject] = useState<ProjectItem>();
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [chapterEditor, setChapterEditor] = useState<"new" | ChapterItem>();
  const [statuses, setStatuses] = useState<DictOption[]>([]);
  const canViewProjects = can(host.permissions, "tapcanvas:project:view");

  const loadProjects = useCallback(async () => {
    if (!host.tenant || !canViewProjects) {
      setProjects([]);
      setTotal(0);
      setSelectedProject(undefined);
      return;
    }
    setProjectLoading(true);
    try {
      const result = await api.listProjects(params);
      setProjects(result.items);
      setTotal(result.total);
      setSelectedProject((current) => current ? result.items.find((item) => item.id === current.id) : undefined);
    } catch (error) { Toast.error(errorText(error)); } finally { setProjectLoading(false); }
  }, [api, canViewProjects, host.tenant, params]);

  const loadChapters = useCallback(async (project?: ProjectItem) => {
    if (!host.tenant || !canViewProjects || !project) { setChapters([]); return; }
    setChapterLoading(true);
    try { setChapters(await api.listChapters(project.id)); } catch (error) { Toast.error(errorText(error)); } finally { setChapterLoading(false); }
  }, [api, canViewProjects, host.tenant]);

  useEffect(() => { queueMicrotask(() => void loadProjects()); }, [loadProjects]);
  useEffect(() => { queueMicrotask(() => void loadChapters(selectedProject)); }, [loadChapters, selectedProject]);
  useEffect(() => {
    if (!host.tenant || !canViewProjects) {
      queueMicrotask(() => setStatuses([]));
      return;
    }
    queueMicrotask(() => void api.listStatuses().then(setStatuses).catch(() => setStatuses([
      { label: host.t("plugin.linapro-tapcanvas-studio.projects.chapters.status.draft"), value: "draft" },
      { label: host.t("plugin.linapro-tapcanvas-studio.projects.chapters.status.planning"), value: "planning" },
      { label: host.t("plugin.linapro-tapcanvas-studio.projects.chapters.status.producing"), value: "producing" },
      { label: host.t("plugin.linapro-tapcanvas-studio.projects.chapters.status.review"), value: "review" },
      { label: host.t("plugin.linapro-tapcanvas-studio.projects.chapters.status.approved"), value: "approved" },
      { label: host.t("plugin.linapro-tapcanvas-studio.projects.chapters.status.locked"), value: "locked" },
      { label: host.t("plugin.linapro-tapcanvas-studio.projects.chapters.status.archived"), value: "archived" },
    ])));
  }, [api, canViewProjects, host]);

  const saveProject = async (values: ProjectSaveInput) => {
    try {
      if (projectEditor === "new") await api.createProject(values);
      else if (projectEditor) await api.updateProject(projectEditor.id, values);
      Toast.success(host.t(projectEditor === "new" ? "pages.common.createSuccess" : "pages.common.updateSuccess"));
      setProjectEditor(undefined);
      await loadProjects();
    } catch (error) { Toast.error(errorText(error)); throw error; }
  };

  const removeProject = async (project: ProjectItem) => {
    try {
      await api.deleteProject(project.id);
      if (selectedProject?.id === project.id) setSelectedProject(undefined);
      Toast.success(host.t("pages.common.deleteSuccess"));
      await loadProjects();
    } catch (error) { Toast.error(errorText(error)); }
  };

  const saveChapter = async (values: ChapterSaveInput) => {
    if (!selectedProject) return;
    try {
      if (chapterEditor === "new") await api.createChapter(selectedProject.id, values);
      else if (chapterEditor) await api.updateChapter(chapterEditor.id, values);
      Toast.success(host.t(chapterEditor === "new" ? "pages.common.createSuccess" : "pages.common.updateSuccess"));
      setChapterEditor(undefined);
      await Promise.all([loadChapters(selectedProject), loadProjects()]);
    } catch (error) { Toast.error(errorText(error)); throw error; }
  };

  const removeChapter = async (chapter: ChapterItem) => {
    if (!selectedProject) return;
    try {
      await api.deleteChapter(chapter.id);
      Toast.success(host.t("pages.common.deleteSuccess"));
      await Promise.all([loadChapters(selectedProject), loadProjects()]);
    } catch (error) { Toast.error(errorText(error)); }
  };

  const moveChapter = async (index: number, direction: -1 | 1) => {
    if (!selectedProject) return;
    const target = index + direction;
    if (target < 0 || target >= chapters.length) return;
    const ordered = [...chapters];
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    try { setChapters(await api.reorderChapters(selectedProject.id, ordered.map((item) => item.id))); } catch (error) { Toast.error(errorText(error)); }
  };

  const projectColumns: ColumnProps<ProjectItem>[] = [
    { dataIndex: "name", title: host.t("plugin.linapro-tapcanvas-studio.projects.fields.name") },
    { dataIndex: "description", title: host.t("plugin.linapro-tapcanvas-studio.projects.fields.description") },
    { dataIndex: "chapterCount", title: host.t("plugin.linapro-tapcanvas-studio.projects.fields.chapterCount"), width: 100 },
    { dataIndex: "updatedAt", render: (value) => timestamp(value as number | null, host.locale), title: host.t("pages.common.updatedAt"), width: 170 },
    { fixed: "right", render: (_, item) => <Space>{can(host.permissions, "tapcanvas:project:view") ? <Button onClick={() => setSelectedProject(item)} theme="borderless">{host.t("plugin.linapro-tapcanvas-studio.projects.chapters.manage")}</Button> : null}{can(host.permissions, "tapcanvas:project:update") ? <Button onClick={() => setProjectEditor(item)} theme="borderless">{host.t("pages.common.edit")}</Button> : null}{can(host.permissions, "tapcanvas:project:delete") ? <Popconfirm content={host.t("plugin.linapro-tapcanvas-studio.projects.deleteConfirm")} onConfirm={() => void removeProject(item)}><Button theme="borderless" type="danger">{host.t("pages.common.delete")}</Button></Popconfirm> : null}</Space>, title: host.t("pages.common.actions"), width: 250 },
  ];

  const chapterColumns: ColumnProps<ChapterItem>[] = [
    { dataIndex: "index", title: host.t("plugin.linapro-tapcanvas-studio.projects.chapters.fields.index"), width: 70 },
    { dataIndex: "title", title: host.t("plugin.linapro-tapcanvas-studio.projects.chapters.fields.title") },
    { dataIndex: "status", render: (value) => <Tag>{chapterStatusLabel(host.t, statuses, String(value))}</Tag>, title: host.t("plugin.linapro-tapcanvas-studio.projects.chapters.fields.status"), width: 100 },
    { dataIndex: "updatedAt", render: (value) => timestamp(value as number | null, host.locale), title: host.t("pages.common.updatedAt"), width: 160 },
    { fixed: "right", render: (_, item, index) => can(host.permissions, "tapcanvas:project:update") ? <Space><Button disabled={index === 0} onClick={() => void moveChapter(index, -1)} theme="borderless">{host.t("plugin.linapro-tapcanvas-studio.projects.chapters.moveUp")}</Button><Button disabled={index === chapters.length - 1} onClick={() => void moveChapter(index, 1)} theme="borderless">{host.t("plugin.linapro-tapcanvas-studio.projects.chapters.moveDown")}</Button><Button onClick={() => setChapterEditor(item)} theme="borderless">{host.t("pages.common.edit")}</Button><Popconfirm content={host.t("plugin.linapro-tapcanvas-studio.projects.chapters.deleteConfirm")} onConfirm={() => void removeChapter(item)}><Button theme="borderless" type="danger">{host.t("pages.common.delete")}</Button></Popconfirm></Space> : null, title: host.t("pages.common.actions"), width: 360 },
  ];

  if (!host.tenant) {
    return <section className="tapcanvas-studio-bootstrap tapcanvas-studio-bootstrap--blocked" data-testid="tapcanvas-projects-tenant-required" role="alert"><h2>{host.t("plugin.linapro-tapcanvas-studio.studio.tenantRequiredTitle")}</h2><p>{host.t("plugin.linapro-tapcanvas-studio.common.tenantRequired")}</p></section>;
  }

  return (
    <section className="tapcanvas-studio-bootstrap tapcanvas-studio-bootstrap--page tapcanvas-projects" data-testid="tapcanvas-project-entry">
      <header className="tapcanvas-projects__header"><div><Typography.Title heading={2}>{host.t("plugin.linapro-tapcanvas-studio.projects.title")}</Typography.Title><Typography.Paragraph>{host.t("plugin.linapro-tapcanvas-studio.projects.description", { tenant: host.tenant.name })}</Typography.Paragraph></div>{can(host.permissions, "tapcanvas:project:create") ? <Button onClick={() => setProjectEditor("new")} theme="solid" type="primary">{host.t("plugin.linapro-tapcanvas-studio.projects.create")}</Button> : null}</header>
      <Card>
        <Form<{ keyword?: string }> className="tapcanvas-projects__search" layout="horizontal" onReset={() => setParams((current) => ({ ...current, keyword: undefined, pageNum: 1 }))} onSubmit={(values) => setParams((current) => ({ ...current, keyword: values.keyword, pageNum: 1 }))}><Form.Input field="keyword" noLabel placeholder={host.t("plugin.linapro-tapcanvas-studio.projects.searchPlaceholder")} showClear /><Button htmlType="reset">{host.t("pages.common.reset")}</Button><Button htmlType="submit" theme="solid" type="primary">{host.t("pages.common.search")}</Button></Form>
        <Table<ProjectItem> columns={projectColumns} dataSource={projects} empty={host.t("plugin.linapro-tapcanvas-studio.projects.empty")} loading={projectLoading} pagination={{ currentPage: params.pageNum, onChange: (pageNum) => setParams((current) => ({ ...current, pageNum })), pageSize: params.pageSize, showTotal: true, total }} rowKey="id" scroll={{ x: 900 }} />
      </Card>
      {selectedProject ? <Card className="tapcanvas-projects__chapters" title={`${host.t("plugin.linapro-tapcanvas-studio.projects.chapters.title")}: ${selectedProject.name}`}><div className="tapcanvas-projects__chapter-toolbar">{can(host.permissions, "tapcanvas:project:update") ? <Button onClick={() => setChapterEditor("new")} theme="solid" type="primary">{host.t("plugin.linapro-tapcanvas-studio.projects.chapters.create")}</Button> : null}</div><Table<ChapterItem> columns={chapterColumns} dataSource={chapters} empty={host.t("plugin.linapro-tapcanvas-studio.projects.chapters.empty")} loading={chapterLoading} pagination={false} rowKey="id" scroll={{ x: 900 }} /></Card> : null}
      <ProjectEditor item={projectEditor === "new" ? undefined : projectEditor} onClose={() => setProjectEditor(undefined)} onSave={saveProject} open={projectEditor !== undefined} t={host.t} />
      <ChapterEditor item={chapterEditor === "new" ? undefined : chapterEditor} onClose={() => setChapterEditor(undefined)} onSave={saveChapter} open={chapterEditor !== undefined} statuses={statuses} t={host.t} />
    </section>
  );
}
