import type { ComponentType, LazyExoticComponent } from "react";

export type PageSurface = "page" | "workspace";

export interface HostPageDefinition {
  component: LazyExoticComponent<ComponentType> | ComponentType;
  surface: PageSurface;
}

export type HostPageRegistry = Readonly<Record<string, HostPageDefinition>>;

export interface WorkbenchRoute {
  children: WorkbenchRoute[];
  componentKey: string;
  externalHref?: string;
  generation?: number;
  hidden: boolean;
  hideInBreadcrumb: boolean;
  hideInTab: boolean;
  icon?: string;
  id: number;
  iframeSrc?: string;
  keepAlive: boolean;
  name: string;
  path: string;
  permission?: string;
  pluginId?: string;
  query: Record<string, string>;
  redirect?: string;
  title: string;
  titleKey?: string;
}

export interface TabMetadata {
  generation?: number;
  path: string;
  query: string;
  title: string;
  titleKey?: string;
}
