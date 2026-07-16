import { Suspense } from "react";
import type { ReactNode } from "react";

import type { RegisteredPluginSlot } from "#/plugin-ui/registry";

export function PluginSlotOutlet({
  fallback = null,
  items,
}: {
  fallback?: ReactNode;
  items: readonly RegisteredPluginSlot[];
}) {
  if (!items.length) {
    return null;
  }
  return (
    <Suspense fallback={fallback}>
      {items.map((item) => {
        const Component = item.component;
        return (
          <div
            data-plugin-generation={item.generation}
            data-plugin-id={item.pluginId}
            data-plugin-slot-item={item.key}
            key={`${item.pluginId}:${item.key}`}
          >
            <Component />
          </div>
        );
      })}
    </Suspense>
  );
}
