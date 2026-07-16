import Button from "@douyinfe/semi-ui/lib/es/button";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface PasswordValues {
  confirmPassword: string;
  newPassword: string;
  oldPassword: string;
}

export function PasswordSettings({ updatePassword }: { updatePassword(password: string): Promise<void> }) {
  const { t } = useTranslation();
  const [mismatch, setMismatch] = useState(false);
  async function submit(values: PasswordValues) {
    if (values.newPassword !== values.confirmPassword) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    await updatePassword(values.newPassword);
    Toast.success(t("pages.profile.password.success"));
  }
  return (
    <Form<PasswordValues> className="profile-settings-form" data-testid="profile-password-form" labelPosition="top" onSubmit={submit}>
      <Form.Input field="oldPassword" label={t("pages.profile.password.old")} mode="password" placeholder={t("pages.profile.password.oldPlaceholder")} rules={[{ required: true, message: t("pages.profile.password.oldRequired") }]} />
      <Form.Input field="newPassword" label={t("pages.profile.password.new")} mode="password" placeholder={t("pages.profile.password.newPlaceholder")} rules={[{ min: 5, required: true, message: t("pages.profile.password.length") }]} />
      <Form.Input field="confirmPassword" label={t("pages.profile.password.confirm")} mode="password" placeholder={t("pages.profile.password.confirmPlaceholder")} rules={[{ required: true, message: t("pages.profile.password.confirmRequired") }]} />
      {mismatch ? <Typography.Text role="alert" type="danger">{t("pages.profile.password.mismatch")}</Typography.Text> : null}
      <Button htmlType="submit" theme="solid" type="primary">{t("pages.profile.password.submit")}</Button>
    </Form>
  );
}
