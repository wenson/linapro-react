import Button from "@douyinfe/semi-ui/lib/es/button";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type {
  DependencyBlocker,
  DependencyCheck,
  HostServicePermission,
  HostServicePermissionTable,
  PluginRouteReviewItem,
} from "#/api/system/plugin";

const serviceOrder: Record<string, number> = {
  data: 0,
  storage: 1,
  network: 2,
  runtime: 3,
  jobs: 4,
  plugins: 5,
  notifications: 6,
};

function normalize(values: string[] | undefined) {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
}

function identity(service: HostServicePermission) {
  const owner = service.owner?.trim() || "";
  const name = service.service.trim();
  const version = service.version?.trim() || "";
  const key = owner ? `${owner}/${name}/${version}` : name;
  return {
    key,
    name,
    owner,
    testId: key.replaceAll(/[^A-Za-z0-9_-]+/gu, "-"),
    version,
  };
}

function sortServices(services: HostServicePermission[] | undefined) {
  return [...(services ?? [])].sort((left, right) => {
    const leftIdentity = identity(left);
    const rightIdentity = identity(right);
    const order = (serviceOrder[leftIdentity.name] ?? 999) - (serviceOrder[rightIdentity.name] ?? 999);
    return order || leftIdentity.name.localeCompare(rightIdentity.name)
      || leftIdentity.owner.localeCompare(rightIdentity.owner)
      || leftIdentity.version.localeCompare(rightIdentity.version);
  });
}

function tableItems(service: HostServicePermission): HostServicePermissionTable[] {
  if (service.tableItems?.length) {
    return service.tableItems;
  }
  return normalize(service.tables).map((name) => ({ name }));
}

function comparable(service: HostServicePermission) {
  return JSON.stringify({
    methods: normalize(service.methods),
    owner: service.owner?.trim() || "",
    paths: normalize(service.paths),
    resources: normalize(service.resources?.map((resource) => resource.ref)),
    service: service.service.trim(),
    tables: normalize(tableItems(service).map((table) => table.name)),
    version: service.version?.trim() || "",
  });
}

function targets(service: HostServicePermission) {
  if (service.service === "storage") {
    return normalize(service.paths).map((value) => ({ label: value, testId: value }));
  }
  if (service.service === "data") {
    return tableItems(service).map((table) => ({
      label: table.comment ? `${table.name} (${table.comment})` : table.name,
      testId: table.name,
    }));
  }
  return (service.resources ?? []).map((resource) => ({
    label: resource.allowMethods?.length
      ? `${resource.ref} [${normalize(resource.allowMethods).join(", ")}]`
      : resource.ref,
    testId: resource.ref,
  }));
}

function serviceLabel(service: string, t: (key: string) => string) {
  const key = `pages.plugins.services.${service}`;
  const translated = t(key);
  return translated === key ? service : translated;
}

function summaryLabel(service: string, t: (key: string) => string) {
  if (service === "storage") {
    return t("pages.plugins.scope.storage");
  }
  if (service === "data") {
    return t("pages.plugins.scope.table");
  }
  if (service === "network") {
    return t("pages.plugins.scope.path");
  }
  return t("pages.plugins.scope.resource");
}

interface ServiceScope {
  containerTestId?: string;
  itemPrefix?: string;
  key: string;
  label: string;
  service: HostServicePermission;
  summaryColor: "amber" | "cyan";
}

function HostServiceCard({ scopes }: { scopes: ServiceScope[] }) {
  const { t } = useTranslation();
  const current = scopes[0]!.service;
  const serviceIdentity = identity(current);
  return (
    <div className="plugin-service-card">
      <div className="plugin-service-card-heading">
        <Typography.Text strong>{serviceLabel(serviceIdentity.name, t)}</Typography.Text>
        <Tag color="blue">{serviceIdentity.name}</Tag>
        {serviceIdentity.owner ? (
          <Tag
            color="violet"
            data-testid={`plugin-host-service-owner-${serviceIdentity.testId}`}
          >
            {t("pages.plugins.owner")}: {serviceIdentity.owner}
          </Tag>
        ) : null}
        {serviceIdentity.version ? (
          <Tag
            color="cyan"
            data-testid={`plugin-host-service-version-${serviceIdentity.testId}`}
          >
            {t("pages.plugins.capabilityVersion")}: {serviceIdentity.version}
          </Tag>
        ) : null}
      </div>
      <div className="plugin-service-scopes">
        {scopes.map((scope) => {
          const serviceTargets = targets(scope.service);
          return (
            <div className="plugin-service-scope" key={scope.key}>
              <div className="plugin-service-scope-heading">
                <Tag
                  color="green"
                  data-testid={`plugin-host-service-scope-label-${serviceIdentity.name}-${scope.key}`}
                >
                  {scope.label}
                </Tag>
                {normalize(scope.service.methods).map((method) => <Tag key={method}>{method}</Tag>)}
              </div>
              {serviceTargets.length ? (
                <div className="plugin-service-target-row">
                  <Tag
                    color={scope.summaryColor}
                    data-testid={`plugin-host-service-summary-label-${serviceIdentity.name}-${scope.key}`}
                  >
                    {summaryLabel(serviceIdentity.name, t)}
                  </Tag>
                  <div className="plugin-service-targets" data-testid={scope.containerTestId}>
                    {serviceTargets.map((target) => (
                      <Tag
                        data-testid={scope.itemPrefix ? `${scope.itemPrefix}-${target.testId}` : undefined}
                        key={target.testId}
                      >
                        {target.label}
                      </Tag>
                    ))}
                  </div>
                </div>
              ) : (
                <Typography.Text type="tertiary">{t("pages.plugins.noExtraScope")}</Typography.Text>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HostServiceReview({
  authorized,
  pluginId,
  requested,
  review = false,
}: {
  authorized?: HostServicePermission[];
  pluginId: string;
  requested?: HostServicePermission[];
  review?: boolean;
}) {
  const { t } = useTranslation();
  const cards = useMemo(() => {
    if (review) {
      return sortServices(requested).map((service) => {
        const serviceIdentity = identity(service);
        return [{
          containerTestId: `plugin-host-service-auth-list-${pluginId}-${serviceIdentity.name}`,
          itemPrefix: `plugin-host-service-auth-item-${pluginId}-${serviceIdentity.name}`,
          key: `${serviceIdentity.testId}-review`,
          label: t("pages.plugins.requestScope"),
          service,
          summaryColor: "cyan" as const,
        }];
      });
    }
    const requestedMap = new Map(sortServices(requested).map((service) => [identity(service).key, service]));
    const authorizedMap = new Map(sortServices(authorized).map((service) => [identity(service).key, service]));
    return [...new Set([...requestedMap.keys(), ...authorizedMap.keys()])]
      .map((key) => {
        const request = requestedMap.get(key);
        const authorization = authorizedMap.get(key);
        const service = authorization ?? request;
        if (!service) {
          return [];
        }
        const serviceIdentity = identity(service);
        if (request && authorization && comparable(request) === comparable(authorization)) {
          return [{
            key: `${serviceIdentity.testId}-effective`,
            label: t("pages.plugins.effectiveScope"),
            service: authorization,
            summaryColor: "amber" as const,
          }];
        }
        const scopes: ServiceScope[] = [];
        if (request) {
          scopes.push({
            key: `${serviceIdentity.testId}-requested`,
            label: t("pages.plugins.requestScope"),
            service: request,
            summaryColor: "cyan",
          });
        }
        if (authorization) {
          scopes.push({
            key: `${serviceIdentity.testId}-authorized`,
            label: t("pages.plugins.authorizedScope"),
            service: authorization,
            summaryColor: "amber",
          });
        }
        return scopes;
      })
      .filter((scopes) => scopes.length)
      .sort((left, right) => {
        const leftService = identity(left[0]!.service);
        const rightService = identity(right[0]!.service);
        return (serviceOrder[leftService.name] ?? 999) - (serviceOrder[rightService.name] ?? 999)
          || leftService.key.localeCompare(rightService.key);
      });
  }, [authorized, pluginId, requested, review, t]);

  if (!cards.length) {
    return (
      <Typography.Text data-testid="plugin-detail-empty-host-services" type="tertiary">
        {t("pages.plugins.noHostServices")}
      </Typography.Text>
    );
  }
  return <div className="plugin-service-list">{cards.map((scopes) => <HostServiceCard key={scopes[0]!.key} scopes={scopes} />)}</div>;
}

export function RouteReviewList({ routes = [] }: { routes?: PluginRouteReviewItem[] }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded || routes.length <= 2 ? routes : routes.slice(0, 2);
  if (!routes.length) {
    return <Typography.Text type="tertiary">{t("pages.plugins.noRoutes")}</Typography.Text>;
  }
  return (
    <div className="plugin-route-list" data-testid="plugin-route-review-list">
      {visible.map((route, index) => (
        <div className="plugin-route-card" data-testid={`plugin-route-review-item-${index}`} key={`${route.method}-${route.publicPath}-${index}`}>
          <div className="plugin-route-tags">
            <Tag color="blue">{route.method}</Tag>
            <Tag color={route.access === "public" ? "amber" : "green"}>
              {route.access === "public" ? t("pages.plugins.publicAccess") : t("pages.plugins.loginAccess")}
            </Tag>
            {route.permission ? <Tag>{route.permission}</Tag> : null}
          </div>
          <code className="plugin-route-path">{route.publicPath}</code>
          {route.summary ? <Typography.Text strong>{route.summary}</Typography.Text> : null}
          {route.description ? <Typography.Text type="tertiary">{route.description}</Typography.Text> : null}
        </div>
      ))}
      {routes.length > 2 ? (
        <Button data-testid="plugin-route-review-toggle" onClick={() => setExpanded((value) => !value)} theme="borderless">
          {t(expanded ? "pages.plugins.collapse" : "pages.plugins.expand")}
        </Button>
      ) : null}
    </div>
  );
}

function blockerLabel(blocker: DependencyBlocker, t: (key: string) => string) {
  const labels: Record<string, string> = {
    dependency_missing: t("pages.plugins.dependencyMissing"),
    dependency_version_unsatisfied: t("pages.plugins.dependencyVersionUnsatisfied"),
    reverse_dependency: t("pages.plugins.reverseDependency"),
  };
  return [
    labels[blocker.code] ?? blocker.code,
    blocker.dependencyId || blocker.pluginId,
    blocker.requiredVersion,
  ].filter(Boolean).join(" ");
}

export function DependencySummary({
  check,
  loading,
  mode,
}: {
  check?: DependencyCheck;
  loading: boolean;
  mode: "install" | "uninstall";
}) {
  const { t } = useTranslation();
  const frameworkBlocked = check?.framework?.status === "unsatisfied";
  const blockers = check?.blockers ?? [];
  const reverseDependents = check?.reverseDependents ?? [];
  const reverseBlockers = check?.reverseBlockers ?? [];
  const cycle = check?.cycle ?? [];
  const visible = loading || (mode === "install"
    ? frameworkBlocked || blockers.length > 0 || cycle.length > 0
    : reverseDependents.length > 0 || reverseBlockers.length > 0);
  if (!visible) {
    return null;
  }
  return (
    <div className="plugin-dependency-summary" data-testid="plugin-dependency-summary">
      {loading ? <Typography.Text>{t("pages.plugins.dependencyLoading")}</Typography.Text> : null}
      {mode === "install" && blockers.length ? (
        <div className="plugin-dependency-alert" data-testid="plugin-dependency-blockers" role="alert">
          <Typography.Text strong type="danger">{t("pages.plugins.installBlocked")}</Typography.Text>
          <div className="plugin-dependency-tags">
            {blockers.map((blocker, index) => <Tag color="red" key={`${blocker.code}-${index}`}>{blockerLabel(blocker, t)}</Tag>)}
          </div>
        </div>
      ) : null}
      {mode === "install" && frameworkBlocked && !blockers.length ? (
        <div className="plugin-dependency-alert" data-testid="plugin-dependency-framework-blocker" role="alert">
          <Typography.Text strong type="danger">{t("pages.plugins.frameworkUnsatisfied")}</Typography.Text>
          <Typography.Text type="danger">
            {t("pages.plugins.frameworkUnsatisfiedDescription", {
              current: check?.framework?.currentVersion || "-",
              required: check?.framework?.requiredVersion || "-",
            })}
          </Typography.Text>
        </div>
      ) : null}
      {mode === "install" && cycle.length ? (
        <div className="plugin-dependency-alert" role="alert">
          <Typography.Text type="danger">{t("pages.plugins.dependencyCycle")}: {cycle.join(" -> ")}</Typography.Text>
        </div>
      ) : null}
      {mode === "uninstall" && (reverseDependents.length || reverseBlockers.length) ? (
        <div className="plugin-dependency-alert" data-testid="plugin-dependency-reverse-blockers" role="alert">
          <Typography.Text strong type="danger">{t("pages.plugins.uninstallBlocked")}</Typography.Text>
          <div className="plugin-dependency-tags">
            {reverseDependents.map((item) => (
              <Tag color="red" key={item.pluginId}>
                {item.name || item.pluginId}{item.requiredVersion ? ` ${item.requiredVersion}` : ""}
              </Tag>
            ))}
            {reverseBlockers.map((blocker, index) => <Tag color="red" key={`${blocker.code}-${index}`}>{blockerLabel(blocker, t)}</Tag>)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
