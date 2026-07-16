import { definePluginUI } from "@linapro/plugin-ui";

export default definePluginUI({
  pages: {
    "/extension/linapro-demo-source-sidebar-entry": {
      capabilities: [],
      load: () => import("./pages/sidebar-entry"),
      surface: "page",
    },
  },
  slots: {},
});
