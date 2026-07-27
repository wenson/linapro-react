import Button from "@douyinfe/semi-ui/lib/es/button";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import { useTranslation } from "react-i18next";

import type { SystemUserApi } from "#/api/system/user";
import { LocalizedPasswordField } from "#/plugin-ui/password-field";

export function UserResetPasswordDialog({ api, onClose, open, userId }: { api: SystemUserApi; onClose(): void; open: boolean; userId?: number }) {
  const { t } = useTranslation();
  async function submit(values: { password: string }) {
    if (!userId) return;
    await api.resetPassword(userId, values.password);
    Toast.success(t("pages.iam.user.messages.passwordReset"));
    onClose();
  }
  return <Modal footer={null} onCancel={onClose} title={t("pages.iam.user.resetPasswordTitle")} visible={open} width="min(520px, calc(100vw - 24px))"><div data-testid="user-reset-password-dialog">
    <Form<{ password: string }> onSubmit={submit} labelPosition="top">
      <LocalizedPasswordField field="password" hidePasswordLabel={t("pages.common.hidePassword")} label={t("pages.iam.user.fields.newPassword")} rules={[{ min: 5, required: true, message: t("pages.iam.user.validation.password") }]} showPasswordLabel={t("pages.common.showPassword")} />
      <div className="iam-form-actions"><Button onClick={onClose}>{t("pages.common.cancel")}</Button><Button htmlType="submit" theme="solid" type="primary">{t("pages.common.confirm")}</Button></div>
    </Form></div>
  </Modal>;
}
