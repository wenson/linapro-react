import { definePluginUI } from "@linapro/plugin-ui";

export default definePluginUI({
  pages: {
    "/monitor/operlog": {
      capabilities: [],
      load: () => import("./pages/operlog-management"),
      surface: "page",
    },
  },
  slots: {},
});
