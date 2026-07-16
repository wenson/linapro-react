import { definePluginUI } from "@linapro/plugin-ui";

export default definePluginUI({
  pages: {
    "/system/dept": {
      capabilities: ["organization.management"],
      load: () => import("./pages/dept-management"),
      surface: "page",
    },
    "/system/post": {
      capabilities: ["organization.management"],
      load: () => import("./pages/post-management"),
      surface: "page",
    },
  },
  slots: {},
});
