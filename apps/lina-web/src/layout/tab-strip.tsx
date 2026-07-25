import { IconClose } from "@douyinfe/semi-icons";
import Button from "@douyinfe/semi-ui/lib/es/button";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";

import { tabStore } from "#/layout/tab-store";

export function TabStrip({ activePath, onNavigate }: { activePath: string; onNavigate(path: string): void }) {
  const { t } = useTranslation();
  const tabs = useStore(tabStore, (state) => state.tabs);
  const close = useStore(tabStore, (state) => state.close);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const closeTab = useCallback((path: string) => {
    const index = tabs.findIndex((tab) => tab.path === path);
    const fallback = tabs[index - 1] ?? tabs[index + 1];
    close(path);
    if (path === activePath && fallback) onNavigate(fallback.path);
    if (fallback) window.requestAnimationFrame(() => tabRefs.current.get(fallback.path)?.focus());
  }, [activePath, close, onNavigate, tabs]);
  return (
    <nav className="tab-strip" aria-label={t("workbench.openPages")} data-testid="workbench-tabs">
      {tabs.map((tab) => (
        <div
          className={tab.path === activePath ? "tab-item tab-item-active is-active" : "tab-item"}
          data-tab-item="true"
          key={tab.path}
        >
          <button
            aria-current={tab.path === activePath ? "page" : undefined}
            className="tab-label"
            onClick={() => onNavigate(tab.path)}
            ref={(element) => {
              if (element) tabRefs.current.set(tab.path, element);
              else tabRefs.current.delete(tab.path);
            }}
            type="button"
          >
            <span title={tab.title}>{tab.title}</span>
          </button>
          <Button
            aria-label={t("workbench.closePage", { title: tab.title })}
            icon={<IconClose />}
            onClick={() => closeTab(tab.path)}
            size="small"
            theme="borderless"
          />
        </div>
      ))}
    </nav>
  );
}
