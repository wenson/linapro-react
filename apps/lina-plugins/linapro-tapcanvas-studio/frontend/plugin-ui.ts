import { definePluginUI } from "@linapro/plugin-ui";

export default definePluginUI({
  pages: {
    "/tapcanvas/projects": {
      capabilities: [],
      load: () => import("./pages/project-entry"),
      surface: "page",
    },
    "/tapcanvas/studio": {
      capabilities: [],
      load: () => import("./pages/studio-workspace"),
      surface: "workspace",
    },
  },
  slots: {},
});
