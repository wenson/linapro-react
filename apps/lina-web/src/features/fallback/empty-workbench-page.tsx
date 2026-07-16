import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useTranslation } from "react-i18next";

export default function EmptyWorkbenchPage() {
  const { t } = useTranslation();
  return (
    <section className="empty-workbench-page" data-testid="empty-workbench-page">
      <Typography.Title heading={3}>{t("workbench.empty.title")}</Typography.Title>
      <Typography.Paragraph type="tertiary">{t("workbench.empty.description")}</Typography.Paragraph>
    </section>
  );
}
