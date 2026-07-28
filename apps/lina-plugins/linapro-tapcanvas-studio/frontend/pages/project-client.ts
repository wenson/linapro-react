import type { PluginHostApi } from "@linapro/plugin-ui";

const pluginId = "linapro-tapcanvas-studio";

export interface ProjectItem {
  chapterCount: number;
  createdAt: number | null;
  description: string;
  id: string;
  latestFlow: null | { id: string; name: string; updatedAt: number | null };
  name: string;
  ownerId: number;
  updatedAt: number | null;
}

export interface ChapterItem {
  createdAt: number | null;
  id: string;
  index: number;
  lastWorkedAt: number | null;
  ownerId: number;
  projectId: string;
  sortOrder: number;
  status: string;
  summary: string;
  title: string;
  updatedAt: number | null;
}

export interface DictOption {
  label: string;
  tagStyle?: string;
  value: string;
}

export interface ProjectSaveInput { description: string; name: string }
export interface ChapterSaveInput { status?: string; summary: string; title: string }
export interface ProjectListInput { keyword?: string; pageNum: number; pageSize: number }

function query(path: string, params: object): string {
  const output = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") output.set(key, String(value));
  }
  return output.size ? `${path}?${output.toString()}` : path;
}

function json(method: string, body?: unknown): RequestInit {
  return {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    method,
  };
}

export interface ProjectApi {
  createChapter(projectId: string, input: ChapterSaveInput): Promise<ChapterItem>;
  createProject(input: ProjectSaveInput): Promise<ProjectItem>;
  deleteChapter(chapterId: string): Promise<void>;
  deleteProject(projectId: string): Promise<void>;
  listChapters(projectId: string): Promise<ChapterItem[]>;
  listProjects(input: ProjectListInput): Promise<{ items: ProjectItem[]; total: number }>;
  listStatuses(): Promise<DictOption[]>;
  reorderChapters(projectId: string, chapterIds: string[]): Promise<ChapterItem[]>;
  updateChapter(chapterId: string, input: ChapterSaveInput): Promise<ChapterItem>;
  updateProject(projectId: string, input: ProjectSaveInput): Promise<ProjectItem>;
}

export function createProjectApi(host: PluginHostApi): ProjectApi {
  const plugin = <T,>(path: string, init?: RequestInit) => host.plugin<T>(pluginId, path, init);
  return {
    createChapter: (projectId, input) => plugin(`projects/${encodeURIComponent(projectId)}/chapters`, json("POST", input)),
    createProject: (input) => plugin("projects", json("POST", input)),
    deleteChapter: (chapterId) => plugin(`chapters/${encodeURIComponent(chapterId)}`, { method: "DELETE" }),
    deleteProject: (projectId) => plugin(`projects/${encodeURIComponent(projectId)}`, { method: "DELETE" }),
    listChapters: async (projectId) => (await plugin<{ list: ChapterItem[] }>(`projects/${encodeURIComponent(projectId)}/chapters`)).list,
    listProjects: async (input) => {
      const result = await plugin<{ list: ProjectItem[]; total: number }>(query("projects", input));
      return { items: result.list, total: result.total };
    },
    listStatuses: async () => (await host.request<{ list: DictOption[] }>("dict/data/type/tapcanvas_chapter_status")).list,
    reorderChapters: async (projectId, chapterIds) => (await plugin<{ list: ChapterItem[] }>(`projects/${encodeURIComponent(projectId)}/chapters/order`, json("PUT", { chapterIds }))).list,
    updateChapter: (chapterId, input) => plugin(`chapters/${encodeURIComponent(chapterId)}`, json("PUT", input)),
    updateProject: (projectId, input) => plugin(`projects/${encodeURIComponent(projectId)}`, json("PUT", input)),
  };
}
