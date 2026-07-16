import List from "@douyinfe/semi-ui/lib/es/list";
import Switch from "@douyinfe/semi-ui/lib/es/switch";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function SecuritySettings() {
  const { t } = useTranslation();
  const items = ["password", "phone", "question", "email", "mfa"];
  const [values, setValues] = useState<Record<string, boolean>>({ email: true, password: true, phone: true, question: true });
  return (
    <List
      dataSource={items}
      renderItem={(item) => (
        <List.Item main={(
          <div><Typography.Text strong>{t(`pages.profile.security.${item}.title`)}</Typography.Text><br /><Typography.Text type="tertiary">{t(`pages.profile.security.${item}.description`)}</Typography.Text></div>
        )} extra={<Switch aria-label={t(`pages.profile.security.${item}.title`)} checked={values[item] === true} onChange={(checked) => setValues((current) => ({ ...current, [item]: checked }))} />} />
      )}
    />
  );
}
