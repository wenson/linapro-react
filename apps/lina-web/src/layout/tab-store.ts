import { createStore } from "zustand/vanilla";

import type { TabMetadata } from "#/router/contracts";

interface TabState {
  clear(): void;
  close(path: string): void;
  open(tab: TabMetadata): void;
  relabel(titles: ReadonlyMap<string, string>): void;
  retain(paths: ReadonlySet<string>): void;
  tabs: TabMetadata[];
}

const tabStorageKey = "linapro:web:tabs:v1";

function readTabs(): TabMetadata[] {
  try {
    const value = JSON.parse(globalThis.localStorage?.getItem(tabStorageKey) ?? "[]") as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is TabMetadata => {
      if (!item || typeof item !== "object") return false;
      const tab = item as Partial<TabMetadata>;
      return typeof tab.path === "string" && typeof tab.query === "string" && typeof tab.title === "string";
    });
  } catch {
    return [];
  }
}

function persistTabs(tabs: readonly TabMetadata[]): void {
  try {
    globalThis.localStorage?.setItem(tabStorageKey, JSON.stringify(tabs));
  } catch {
    // Storage is optional in restricted browser contexts and unit tests.
  }
}

export const tabStore = createStore<TabState>((set) => ({
  clear: () => {
    persistTabs([]);
    set({ tabs: [] });
  },
  close: (path) => set((state) => {
    const tabs = state.tabs.filter((tab) => tab.path !== path);
    persistTabs(tabs);
    return { tabs };
  }),
  open: (tab) =>
    set((state) => {
      const tabs = state.tabs.some((item) => item.path === tab.path)
        ? state.tabs.map((item) => (item.path === tab.path ? tab : item))
        : [...state.tabs, tab];
      persistTabs(tabs);
      return { tabs };
    }),
  relabel: (titles) =>
    set((state) => {
      const tabs = state.tabs.map((tab) => {
        const title = titles.get(tab.path);
        return title && title !== tab.title ? { ...tab, title } : tab;
      });
      persistTabs(tabs);
      return { tabs };
    }),
  retain: (paths) =>
    set((state) => {
      const tabs = state.tabs.filter((tab) => paths.has(tab.path));
      if (tabs.length === state.tabs.length) return state;
      persistTabs(tabs);
      return { tabs };
    }),
  tabs: readTabs(),
}));
