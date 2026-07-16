import { IconTickCircle } from "@douyinfe/semi-icons";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useTranslation } from "react-i18next";

interface StartupPageProps {
  appName?: string;
  logoUrl?: string;
}

export function StartupPage({ appName = "LinaPro", logoUrl }: StartupPageProps) {
  const { t } = useTranslation();
  const resolvedLogoUrl = logoUrl || `${import.meta.env.BASE_URL}logo.webp`;

  return (
    <main className="startup-page" aria-labelledby="startup-title">
      <section className="startup-card">
        <img className="startup-logo" src={resolvedLogoUrl} alt={appName} width="72" height="72" />
        <div className="startup-copy">
          <Typography.Title id="startup-title" heading={2}>
            {t("app.startup.title", { appName })}
          </Typography.Title>
          <Typography.Paragraph type="tertiary">
            {t("app.startup.description")}
          </Typography.Paragraph>
        </div>
        <div className="startup-status" role="status">
          <IconTickCircle aria-hidden="true" />
          <span>{t("app.startup.status")}</span>
        </div>
      </section>
    </main>
  );
}
