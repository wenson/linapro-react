import { definePluginUI } from "@linapro/plugin-ui";

export default definePluginUI({
  pages: {
    "/system/notice": {
      capabilities: [],
      load: () => import("./pages/notice-management"),
      surface: "page",
    },
  },
  slots: {},
});
