import { Component, lazy, Suspense, type ReactNode } from "react";

import { useLinaPluginHost } from "@linapro/plugin-ui";

import "./studio-bootstrap.css";

const TapCanvasWorkspace = lazy(() => import("../tapcanvas/workspace/TapCanvasWorkspace"));

export class StudioModuleBoundary extends Component<{
  children: ReactNode;
  description: string;
  title: string;
}, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <section
          className="tapcanvas-studio-bootstrap tapcanvas-studio-bootstrap--blocked"
          data-testid="tapcanvas-studio-module-unavailable"
          role="alert"
        >
          <h2>{this.props.title}</h2>
          <p>{this.props.description}</p>
        </section>
      );
    }
    return this.props.children;
  }
}

export default function StudioWorkspace() {
  const host = useLinaPluginHost();
  const canUpdateFlow = host.permissions.has("*") || host.permissions.has("tapcanvas:flow:update");

  if (!host.tenant) {
    return (
      <section
        className="tapcanvas-studio-bootstrap tapcanvas-studio-bootstrap--blocked"
        data-testid="tapcanvas-studio-tenant-required"
        role="alert"
      >
        <h2>{host.t("plugin.linapro-tapcanvas-studio.studio.tenantRequiredTitle")}</h2>
        <p>{host.t("plugin.linapro-tapcanvas-studio.common.tenantRequired")}</p>
      </section>
    );
  }

  const workspaceKey = [
    `user:${host.user.id}`,
    `tenant:${host.tenant.id}`,
    `code:${host.tenant.code}`,
    `impersonated:${host.tenant.impersonated === true ? "1" : "0"}`,
  ].join("|");

  return (
    <StudioModuleBoundary
      description={host.t("plugin.linapro-tapcanvas-studio.studio.moduleUnavailableDescription")}
      key={workspaceKey}
      title={host.t("plugin.linapro-tapcanvas-studio.studio.moduleUnavailableTitle")}
    >
      <Suspense
        fallback={(
          <section
            aria-busy="true"
            className="tapcanvas-studio-bootstrap tapcanvas-studio-bootstrap--workspace"
            data-testid="tapcanvas-studio-workspace-loading"
          >
            <p role="status">{host.t("plugin.linapro-tapcanvas-studio.studio.title")}</p>
          </section>
        )}
      >
        <TapCanvasWorkspace
          host={{ ...host, tenant: host.tenant }}
          accessLabel={host.t(canUpdateFlow
            ? "plugin.linapro-tapcanvas-studio.common.editable"
            : "plugin.linapro-tapcanvas-studio.common.readOnly")}
          canUpdateFlow={canUpdateFlow}
          tenantName={host.tenant.name}
          title={host.t("plugin.linapro-tapcanvas-studio.studio.title")}
          userName={host.user.name}
        />
      </Suspense>
    </StudioModuleBoundary>
  );
}
