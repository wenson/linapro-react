import { definePluginUI } from "@linapro/plugin-ui";

export default definePluginUI({
  pages: {
    "/monitor/loginlog": {
      capabilities: [],
      load: () => import("./pages/loginlog-management"),
      surface: "page",
    },
  },
  slots: {},
});
