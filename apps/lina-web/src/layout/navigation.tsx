import Navigation from "@douyinfe/semi-ui/lib/es/navigation";
import type { NavItems } from "@douyinfe/semi-ui/lib/es/navigation";
import { useTranslation } from "react-i18next";

import { workbenchIcon } from "#/layout/icon-map";
import type { WorkbenchRoute } from "#/router/contracts";

function navigationItems(
  routes: readonly WorkbenchRoute[],
  translate: (key: string, options: { defaultValue: string }) => string,
): NavItems {
  return routes.filter((route) => !route.hidden).map((route) => ({
    icon: workbenchIcon(route.icon),
    itemKey: route.path,
    items: route.children.length ? navigationItems(route.children, translate) : undefined,
    text: route.titleKey ? translate(route.titleKey, { defaultValue: route.title }) : route.title,
  }));
}

export function WorkbenchNavigation({
  activePath,
  onNavigate,
  routes,
}: {
  activePath: string;
  onNavigate(path: string): void;
  routes: readonly WorkbenchRoute[];
}) {
  const { t } = useTranslation();
  return (
    <Navigation
      aria-label="Workbench navigation"
      items={navigationItems(routes, t)}
      onSelect={({ itemKey }) => onNavigate(String(itemKey))}
      selectedKeys={[activePath]}
    />
  );
}
