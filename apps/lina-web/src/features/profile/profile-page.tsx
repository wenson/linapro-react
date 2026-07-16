import Card from "@douyinfe/semi-ui/lib/es/card";
import Descriptions from "@douyinfe/semi-ui/lib/es/descriptions";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Tabs from "@douyinfe/semi-ui/lib/es/tabs";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { createProfileApi } from "#/api/profile";
import { useWorkbenchRuntime } from "#/app/workbench-runtime-context";
import { useAuthContext } from "#/auth/auth-context";
import { AvatarCropper } from "#/features/profile/avatar-cropper";
import { BaseSettings } from "#/features/profile/base-settings";
import { NotificationSettings } from "#/features/profile/notification-settings";
import { PasswordSettings } from "#/features/profile/password-settings";
import { SecuritySettings } from "#/features/profile/security-settings";
import { resolveWorkspaceAssetUrl } from "#/runtime/public-config";
import { formatTimestamp } from "#/shared/format";

export default function ProfilePage() {
  const { apiClient, config } = useWorkbenchRuntime();
  const auth = useAuthContext();
  const { i18n, t } = useTranslation();
  const queryClient = useQueryClient();
  const api = createProfileApi(apiClient);
  const queryKey = ["profile", auth?.user.userId ?? 0] as const;
  const profileQuery = useQuery({ queryFn: () => api.getProfile(), queryKey });
  if (profileQuery.isPending) {
    return <Spin aria-label={t("pages.common.loading")} />;
  }
  if (profileQuery.isError || !profileQuery.data) {
    return <Typography.Text role="alert" type="danger">{profileQuery.error?.message || t("pages.common.loadFailed")}</Typography.Text>;
  }
  const profile = profileQuery.data;
  async function refreshProfile() {
    await queryClient.invalidateQueries({ queryKey });
  }
  return (
    <section className="feature-page profile-page" data-testid="profile-page">
      <Card className="profile-overview-card">
        <AvatarCropper
          avatar={profile.avatar || resolveWorkspaceAssetUrl(config.user.defaultAvatar, config.workspace.basePath)}
          onUpload={async (blob, filename) => {
            await api.updateAvatar(blob, filename);
            await refreshProfile();
          }}
        />
        <Typography.Title heading={4}>{profile.nickname || profile.username}</Typography.Title>
        <Descriptions
          column={1}
          data={[
            { key: t("pages.profile.fields.account"), value: profile.username },
            { key: t("pages.profile.fields.phone"), value: profile.phone || t("pages.common.unbound") },
            { key: t("pages.profile.fields.email"), value: profile.email || t("pages.common.unbound") },
            {
              key: t("pages.profile.fields.lastLogin"),
              value: formatTimestamp(profile.loginDate, i18n.resolvedLanguage || "en-US") || t("pages.common.none"),
            },
          ]}
        />
      </Card>
      <Card className="profile-settings-card">
        <Tabs defaultActiveKey="basic" keepDOM={false} lazyRender>
          <Tabs.TabPane itemKey="basic" tab={t("pages.profile.tabs.basic")}>
            <BaseSettings profile={profile} update={async (input) => { await api.updateProfile(input); await refreshProfile(); }} />
          </Tabs.TabPane>
          <Tabs.TabPane itemKey="password" tab={t("pages.profile.tabs.password")}>
            <PasswordSettings updatePassword={async (password) => { await api.updateProfile({ password }); }} />
          </Tabs.TabPane>
          <Tabs.TabPane itemKey="security" tab={t("pages.profile.tabs.security")}><SecuritySettings /></Tabs.TabPane>
          <Tabs.TabPane itemKey="notification" tab={t("pages.profile.tabs.notification")}><NotificationSettings /></Tabs.TabPane>
        </Tabs>
      </Card>
    </section>
  );
}
