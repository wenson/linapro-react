import "@douyinfe/semi-ui/dist/css/semi.min.css";
import "#/styles/tokens.css";
import "#/styles/global.css";

import { bootstrapApp } from "#/app/bootstrap";

void bootstrapApp().catch((error: unknown) => {
  console.error("React workbench bootstrap failed", error);
});
