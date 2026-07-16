import { lazy } from "react";

import type { HostPageRegistry } from "#/router/contracts";

export const hostPages: HostPageRegistry = {
  "about/api-docs/index": {
    component: lazy(() => import("#/features/about/api-docs-page")),
    surface: "workspace",
  },
  "about/index": {
    component: lazy(() => import("#/features/about/about-page")),
    surface: "page",
  },
  "about/system-info/index": {
    component: lazy(() => import("#/features/about/system-info-page")),
    surface: "page",
  },
  "dashboard/analytics/index": {
    component: lazy(() => import("#/features/dashboard/analytics-page")),
    surface: "page",
  },
  "dashboard/workspace/index": {
    component: lazy(() => import("#/features/dashboard/workspace-page")),
    surface: "workspace",
  },
  "profile/index": {
    component: lazy(() => import("#/features/profile/profile-page")),
    surface: "page",
  },
  "system/menu/index": {
    component: lazy(() => import("#/features/iam/menu/menu-page")),
    surface: "page",
  },
  "system/config/index": {
    component: lazy(() => import("#/features/settings/config/config-page")),
    surface: "page",
  },
  "system/dict/index": {
    component: lazy(() => import("#/features/settings/dict/dict-page")),
    surface: "page",
  },
  "system/file/index": {
    component: lazy(() => import("#/features/settings/file/file-page")),
    surface: "page",
  },
  "system/message/index": {
    component: lazy(() => import("#/features/settings/message/message-page")),
    surface: "page",
  },
  "system/job-group/index": {
    component: lazy(() => import("#/features/scheduler/job-group-page")),
    surface: "page",
  },
  "system/job/index": {
    component: lazy(() => import("#/features/scheduler/job-page")),
    surface: "page",
  },
  "system/job-log/index": {
    component: lazy(() => import("#/features/scheduler/job-log-page")),
    surface: "page",
  },
  "system/role/index": {
    component: lazy(() => import("#/features/iam/role/role-page")),
    surface: "page",
  },
  "system/role-auth/index": {
    component: lazy(() => import("#/features/iam/role/role-auth-page")),
    surface: "page",
  },
  "system/user/index": {
    component: lazy(() => import("#/features/iam/user/user-page")),
    surface: "page",
  },
  "system/plugin/dynamic-page": {
    component: lazy(() => import("#/features/fallback/empty-workbench-page")),
    surface: "page",
  },
  "system/plugin/index": {
    component: lazy(() => import("#/features/plugins/plugin-page")),
    surface: "page",
  },
};
