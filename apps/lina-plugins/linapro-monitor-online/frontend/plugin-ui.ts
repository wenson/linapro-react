import { definePluginUI } from "@linapro/plugin-ui";

export default definePluginUI({
  pages: {
    "/monitor/online": {
      capabilities: [],
      load: () => import("./pages/online-user"),
      surface: "page",
    },
  },
  slots: {},
});
