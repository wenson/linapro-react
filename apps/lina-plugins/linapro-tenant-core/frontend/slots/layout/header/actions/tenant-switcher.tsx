import Button from "@douyinfe/semi-ui/lib/es/button";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import { requestTenantImpersonationExit, useLinaPluginHost } from "@linapro/plugin-ui";
import { useState } from "react";

import "../../../../pages/tenant.css";

export default function TenantSwitcherSlot() {
  const host = useLinaPluginHost();
  const [loading, setLoading] = useState(false);
  if (!host.tenant?.impersonated) return null;
  async function exit(): Promise<void> { setLoading(true); try { await requestTenantImpersonationExit(); } finally { setLoading(false); } }
  const label = host.t("plugin.linapro-tenant-core.impersonation.banner", { tenant: host.tenant.name });
  return <div className="tenant-core-impersonation" data-testid="impersonation-banner"><Tag color="red"><span data-testid="impersonation-banner-text" title={label}>{label}</span></Tag><Button data-testid="impersonation-exit" loading={loading} onClick={() => void exit()} size="small" type="danger">{host.t("plugin.linapro-tenant-core.impersonation.exit")}</Button></div>;
}
