import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useWorkbenchRuntime } from "#/app/workbench-runtime-context";
import { useAuthContext } from "#/auth/auth-context";
import { usePluginUIRegistry } from "#/plugin-ui/registry-context";
import { PluginSlotOutlet } from "#/plugin-ui/slot-outlet";
import { resolveWorkspaceAssetUrl } from "#/runtime/public-config";

const projectKeys = ["linapro", "goframe", "react", "semi", "typescript", "tapcanvas"] as const;
const projectNames = {
  goframe: "GoFrame",
  linapro: "LinaPro",
  react: "React",
  semi: "Semi Design",
  tapcanvas: "TapCanvas",
  typescript: "TypeScript",
} as const;
const quickNav = [
  ["user", "/system/user"],
  ["menu", "/system/menu"],
  ["config", "/system/config"],
  ["plugin", "/system/plugin"],
  ["apiDocs", "/about/api-docs"],
  ["jobs", "/system/job"],
] as const;

export default function WorkspacePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { config } = useWorkbenchRuntime();
  const context = useAuthContext();
  const registry = usePluginUIRegistry();
  const logo = resolveWorkspaceAssetUrl(config.app.logo, config.workspace.basePath);
  const goframeLogo = resolveWorkspaceAssetUrl("/goframe-logo.webp", config.workspace.basePath);

  return (
    <section className="feature-page" data-testid="dashboard-workspace-page">
      <PluginSlotOutlet items={registry.slots["dashboard.workspace.before"]} />
      <Card className="workspace-welcome-card">
        <Typography.Title heading={3}>
          {t("pages.dashboard.welcome", {
            name: context?.user.realName || context?.user.username || t("pages.common.user"),
          })}
        </Typography.Title>
        <Typography.Paragraph data-testid="dashboard-workspace-description" type="tertiary">
          {t("pages.dashboard.workspace.sunny")}
        </Typography.Paragraph>
      </Card>
      <Card title={<Typography.Title heading={4}>{t("pages.dashboard.workspace.projectsTitle")}</Typography.Title>}>
        <div className="workspace-project-grid" data-testid="dashboard-workspace-projects">
          {projectKeys.map((key) => (
            <article className="workspace-project-card" key={key}>
              {key === "linapro" || key === "goframe" ? (
                <img
                  alt={projectNames[key]}
                  height="36"
                  src={key === "linapro" ? logo : goframeLogo}
                  width="36"
                />
              ) : null}
              <Typography.Text strong>{projectNames[key]}</Typography.Text>
              <Typography.Text className="workspace-project-description" title={t(`pages.dashboard.workspace.projects.${key}`)} type="tertiary">
                {t(`pages.dashboard.workspace.projects.${key}`)}
              </Typography.Text>
              <Typography.Text type="tertiary">2026-05-01</Typography.Text>
            </article>
          ))}
        </div>
      </Card>
      <div className="workspace-secondary-grid">
        <Card title={<Typography.Title heading={4}>{t("pages.dashboard.workspace.quickNavTitle")}</Typography.Title>}>
          <div className="workspace-quick-nav" data-testid="dashboard-workspace-quick-nav">
            {quickNav.map(([key, path]) => (
              <Button key={key} onClick={() => void navigate(path)} theme="light">
                {t(`pages.dashboard.workspace.quickNav.${key}`)}
              </Button>
            ))}
          </div>
        </Card>
        <Card title={<Typography.Title heading={4}>{t("pages.dashboard.workspace.todosTitle")}</Typography.Title>}>
          <div className="workspace-list" data-testid="dashboard-workspace-todos">
            <Typography.Text strong>{t("pages.dashboard.workspace.todos.review")}</Typography.Text>
            <Typography.Text>{t("pages.dashboard.workspace.todos.verify")}</Typography.Text>
            <Typography.Text>{t("pages.dashboard.workspace.todos.plugins")}</Typography.Text>
          </div>
        </Card>
        <Card title={<Typography.Title heading={4}>{t("pages.dashboard.workspace.trendsTitle")}</Typography.Title>}>
          <div className="workspace-list" data-testid="dashboard-workspace-trends">
            <Typography.Text>{t("pages.dashboard.workspace.trends.navigation")}</Typography.Text>
            <Typography.Text>{t("pages.dashboard.workspace.trends.permissions")}</Typography.Text>
            <Typography.Text>{t("pages.dashboard.workspace.trends.plugins")}</Typography.Text>
          </div>
        </Card>
      </div>
      <PluginSlotOutlet items={registry.slots["dashboard.workspace.after"]} />
    </section>
  );
}
