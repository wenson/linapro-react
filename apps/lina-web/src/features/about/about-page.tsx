import Card from "@douyinfe/semi-ui/lib/es/card";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useTranslation } from "react-i18next";

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <section className="feature-page" data-testid="about-page">
      <Card>
        <Typography.Title heading={2}>LinaPro</Typography.Title>
        <Typography.Paragraph>{t("pages.about.productDescription")}</Typography.Paragraph>
        <Typography.Text link={{ href: "https://github.com/continew-org/continew-admin", target: "_blank" }}>
          {t("pages.about.repository")}
        </Typography.Text>
      </Card>
    </section>
  );
}
