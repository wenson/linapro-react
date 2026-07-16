import { IconClose } from "@douyinfe/semi-icons";
import Button from "@douyinfe/semi-ui/lib/es/button";
import { useStore } from "zustand";

import { tabStore } from "#/layout/tab-store";

export function TabStrip({ activePath, onNavigate }: { activePath: string; onNavigate(path: string): void }) {
  const tabs = useStore(tabStore, (state) => state.tabs);
  const close = useStore(tabStore, (state) => state.close);
  return (
    <nav className="tab-strip" aria-label="Open pages" data-testid="workbench-tabs">
      {tabs.map((tab) => (
        <div
          className={tab.path === activePath ? "tab-item tab-item-active is-active" : "tab-item"}
          data-tab-item="true"
          key={tab.path}
        >
          <button className="tab-label" onClick={() => onNavigate(tab.path)} type="button">
            <span title={tab.title}>{tab.title}</span>
          </button>
          <Button
            aria-label={`Close ${tab.title}`}
            icon={<IconClose />}
            onClick={() => close(tab.path)}
            size="small"
            theme="borderless"
          />
        </div>
      ))}
    </nav>
  );
}
