import { Suspense, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { NotFoundPage, UnregisteredPage } from "#/features/fallback/status-pages";
import { PageSurface } from "#/layout/page-surface";
import { HostedPage } from "#/plugin-ui/hosted-page";
import { AccessGate } from "#/router/access-gate";
import type { HostPageRegistry, WorkbenchRoute } from "#/router/contracts";
import { safeNavigationTarget } from "#/router/url-safety";

function ExternalRoute({ href }: { href: string }) {
  const { t } = useTranslation();
  const opened = useRef(false);
  useEffect(() => {
    if (!opened.current) {
      opened.current = true;
      window.open(href, "_blank", "noopener,noreferrer");
    }
  }, [href]);
  return <p role="status">{t("workbench.external.opened")}</p>;
}

export function RouteView({ registry, route }: { registry: HostPageRegistry; route?: WorkbenchRoute }) {
  const { t } = useTranslation();
  if (!route) {
    return <NotFoundPage />;
  }
  if (route.externalHref) {
    const href = safeNavigationTarget(route.externalHref);
    return href ? <ExternalRoute href={href} /> : <UnregisteredPage componentKey={route.externalHref} />;
  }
  if (route.iframeSrc) {
    const source = safeNavigationTarget(route.iframeSrc);
    return source ? (
      <iframe
        className="workbench-iframe"
        referrerPolicy="no-referrer"
        sandbox="allow-forms allow-popups allow-scripts"
        src={source}
        title={route.title}
      />
    ) : (
      <UnregisteredPage componentKey={route.iframeSrc} />
    );
  }
  if (route.componentKey === "system/plugin/dynamic-page") {
    return (
      <AccessGate permission={route.permission}>
        <PageSurface surface="workspace">
          <HostedPage route={route} />
        </PageSurface>
      </AccessGate>
    );
  }
  const definition = registry[route.componentKey];
  if (!definition) {
    return <UnregisteredPage componentKey={route.componentKey} />;
  }
  const Component = definition.component;
  return (
    <AccessGate permission={route.permission}>
      <PageSurface surface={definition.surface}>
        <Suspense fallback={<p role="status">{t("workbench.loadingPage")}</p>}>
          <Component />
        </Suspense>
      </PageSurface>
    </AccessGate>
  );
}
