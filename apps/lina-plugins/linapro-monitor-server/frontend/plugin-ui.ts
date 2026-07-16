import { definePluginUI } from "@linapro/plugin-ui";

export default definePluginUI({
  pages: {
    "/monitor/server": {
      capabilities: [],
      load: () => import("./pages/server-monitor"),
      surface: "page",
    },
  },
  slots: {},
});
