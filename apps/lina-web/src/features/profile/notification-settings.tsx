import List from "@douyinfe/semi-ui/lib/es/list";
import Switch from "@douyinfe/semi-ui/lib/es/switch";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function NotificationSettings() {
  const { t } = useTranslation();
  const items = ["account", "system", "todo"];
  const [values, setValues] = useState<Record<string, boolean>>({ account: true, system: true, todo: true });
  return (
    <List
      dataSource={items}
      renderItem={(item) => (
        <List.Item main={(
          <div><Typography.Text strong>{t(`pages.profile.notification.${item}.title`)}</Typography.Text><br /><Typography.Text type="tertiary">{t(`pages.profile.notification.${item}.description`)}</Typography.Text></div>
        )} extra={<Switch aria-label={t(`pages.profile.notification.${item}.title`)} checked={values[item] === true} onChange={(checked) => setValues((current) => ({ ...current, [item]: checked }))} />} />
      )}
    />
  );
}
