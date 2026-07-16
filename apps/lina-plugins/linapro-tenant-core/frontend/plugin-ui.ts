import { definePluginUI } from "@linapro/plugin-ui";

export default definePluginUI({
  pages: {
    "/platform/tenants": {
      capabilities: ["tenant.management"],
      load: () => import("./pages/tenant-management"),
      surface: "page",
    },
    "/tenant/plugins": {
      capabilities: ["tenant.management"],
      load: () => import("./pages/tenant-plugin-management"),
      surface: "page",
    },
  },
  slots: {
    "layout.header.actions.before": [{
      capabilities: ["tenant.management"],
      key: "tenant-impersonation-status",
      load: () => import("./slots/layout/header/actions/tenant-switcher"),
      order: 0,
    }],
  },
});
