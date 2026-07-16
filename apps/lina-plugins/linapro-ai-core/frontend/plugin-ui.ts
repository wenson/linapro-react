import { definePluginUI } from "@linapro/plugin-ui";

export default definePluginUI({
  pages: {
    "/ai/invocations": {
      capabilities: [],
      load: () => import("./pages/invocation-logs"),
      surface: "page",
    },
    "/ai/models": {
      capabilities: [],
      load: () => import("./pages/model-management"),
      surface: "page",
    },
    "/ai/providers": {
      capabilities: [],
      load: () => import("./pages/provider-management"),
      surface: "page",
    },
    "/ai/tiers": {
      capabilities: [],
      load: () => import("./pages/tier-management"),
      surface: "page",
    },
  },
  slots: {},
});
