import Button from "@douyinfe/semi-ui/lib/es/button";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import { useTranslation } from "react-i18next";

import type { UpdateProfileInput, UserProfile } from "#/api/profile";

export function BaseSettings({ profile, update }: {
  profile: UserProfile;
  update(input: UpdateProfileInput): Promise<void>;
}) {
  const { t } = useTranslation();
  async function submit(values: UpdateProfileInput) {
    await update(values);
    Toast.success(t("pages.common.updateSuccess"));
  }
  return (
    <Form<UpdateProfileInput>
      className="profile-settings-form"
      data-testid="profile-base-form"
      initValues={{ email: profile.email, nickname: profile.nickname, phone: profile.phone, sex: profile.sex }}
      labelPosition="top"
      onSubmit={submit}
    >
      <Form.Input field="nickname" label={t("pages.profile.fields.nickname")} placeholder={t("pages.profile.placeholders.nickname")} rules={[{ required: true, message: t("pages.profile.validation.nickname") }]} />
      <Form.Input field="email" label={t("pages.profile.fields.email")} placeholder={t("pages.profile.placeholders.email")} rules={[{ type: "email", message: t("pages.profile.validation.email") }]} />
      <Form.Input field="phone" label={t("pages.profile.fields.phone")} placeholder={t("pages.profile.placeholders.phone")} rules={[{ pattern: /^1[3-9]\d{9}$/, message: t("pages.profile.validation.phone") }]} />
      <Form.RadioGroup
        field="sex"
        label={t("pages.profile.fields.sex")}
        options={[
          { label: t("pages.profile.sex.unknown"), value: 0 },
          { label: t("pages.profile.sex.male"), value: 1 },
          { label: t("pages.profile.sex.female"), value: 2 },
        ]}
      />
      <Button htmlType="submit" theme="solid" type="primary">{t("pages.profile.update")}</Button>
    </Form>
  );
}
