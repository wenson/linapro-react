import Button from "@douyinfe/semi-ui/lib/es/button";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useTranslation } from "react-i18next";

function StatusPage({ code, detailKey, onRetry }: { code: string; detailKey: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <section className="status-page" role={code === "403" ? "alert" : "status"}>
      <Typography.Title heading={1}>{code}</Typography.Title>
      <Typography.Title heading={3}>{t(`fallback.${code}.title`)}</Typography.Title>
      <Typography.Paragraph type="tertiary">{t(detailKey)}</Typography.Paragraph>
      {onRetry ? <Button onClick={onRetry}>{t("fallback.retry")}</Button> : null}
    </section>
  );
}

export function ForbiddenPage() {
  return <StatusPage code="403" detailKey="fallback.403.description" />;
}

export function NotFoundPage() {
  return <StatusPage code="404" detailKey="fallback.404.description" />;
}

export function ServerErrorPage() {
  return <StatusPage code="500" detailKey="fallback.500.description" onRetry={() => window.location.reload()} />;
}

export function OfflinePage() {
  return <StatusPage code="offline" detailKey="fallback.offline.description" onRetry={() => window.location.reload()} />;
}

export function ComingSoonPage() {
  return <StatusPage code="comingSoon" detailKey="fallback.comingSoon.description" />;
}

export function UnregisteredPage({ componentKey }: { componentKey: string }) {
  const { t } = useTranslation();
  return (
    <section className="status-page" role="alert">
      <Typography.Title heading={3}>{t("fallback.unregistered.title")}</Typography.Title>
      <Typography.Paragraph>{t("fallback.unregistered.description")}</Typography.Paragraph>
      <code>{componentKey || t("fallback.unregistered.emptyKey")}</code>
    </section>
  );
}
