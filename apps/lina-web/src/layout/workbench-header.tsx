import { IconExit, IconMenu, IconSetting, IconUser } from "@douyinfe/semi-icons";
import Avatar from "@douyinfe/semi-ui/lib/es/avatar";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Dropdown from "@douyinfe/semi-ui/lib/es/dropdown";
import Select from "@douyinfe/semi-ui/lib/es/select";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useAuthContext } from "#/auth/auth-context";
import type { LoginTenant } from "#/api/auth";
import { LanguageToggle } from "#/runtime/language-toggle";
import { applyThemePreference } from "#/app/theme";

export function WorkbenchHeader({ currentTenantId, defaultAvatarUrl, onLogout, onOpenNavigation, onOpenPreferences, onOpenProfile, onTenantChange, pluginActionsAfter, pluginActionsBefore, tenantSwitchDisabled = false, tenants, userDropdownAfter }: {
  currentTenantId?: number;
  defaultAvatarUrl: string;
  onLogout(): void;
  onOpenNavigation(): void;
  onOpenPreferences(): void;
  onOpenProfile(): void;
  onTenantChange(tenantId: number): void;
  pluginActionsAfter?: ReactNode;
  pluginActionsBefore?: ReactNode;
  userDropdownAfter?: ReactNode;
  tenantSwitchDisabled?: boolean;
  tenants: readonly LoginTenant[];
}) {
  const { t } = useTranslation();
  const context = useAuthContext();
  return (
    <header className="workbench-header">
      <Button
        aria-label={t("workbench.navigation.open")}
        className="mobile-navigation-trigger"
        icon={<IconMenu />}
        onClick={onOpenNavigation}
        theme="borderless"
      />
      <div data-testid="layout-header-plugin-slots-before">{pluginActionsBefore}</div>
      {tenants.length > 1 ? (
        <div className="tenant-switcher" data-testid="tenant-switcher">
          <span className="visually-hidden" id="tenant-switcher-label">
            {t("workbench.tenant.switch")}
          </span>
          <Select
            aria-labelledby="tenant-switcher-label"
            data-testid="tenant-switcher-select"
            disabled={tenantSwitchDisabled}
            onChange={(value) => onTenantChange(Number(value))}
            optionList={tenants.map((tenant) => ({ label: tenant.name, value: tenant.id }))}
            style={{ width: 240 }}
            value={currentTenantId}
          />
        </div>
      ) : (
        <Typography.Text strong>{tenants[0]?.name || t("workbench.platform")}</Typography.Text>
      )}
      <div className="workbench-header-spacer" />
      <div data-testid="layout-header-plugin-slots">{pluginActionsAfter}</div>
      <LanguageToggle />
      <Button aria-label="light" onClick={() => applyThemePreference("light")} theme="borderless">☀</Button>
      <Button aria-label="dark" onClick={() => applyThemePreference("dark")} theme="borderless">☾</Button>
      <Button
        aria-label={t("workbench.preferences.open")}
        data-testid="preferences-trigger"
        icon={<IconSetting />}
        onClick={onOpenPreferences}
        theme="borderless"
      />
      <Dropdown
        render={(
          <div className="workbench-user-dropdown" data-testid="layout-user-dropdown-menu">
            <div className="workbench-user-profile" data-testid="layout-user-dropdown-profile">
              <Typography.Text
                className="workbench-user-profile-name"
                data-testid="layout-user-dropdown-name"
                strong
                title={context?.user.realName || context?.user.username}
              >
                {context?.user.realName || context?.user.username}
              </Typography.Text>
              {context?.user.username ? (
                <Typography.Text
                  className="workbench-user-profile-handle"
                  data-testid="layout-user-dropdown-tag"
                  title={context.user.username}
                  type="tertiary"
                >
                  @{context.user.username}
                </Typography.Text>
              ) : null}
              {context?.user.email ? (
                <Typography.Text
                  className="workbench-user-profile-email"
                  data-testid="layout-user-dropdown-description"
                  title={context.user.email}
                  type="tertiary"
                >
                  {context.user.email}
                </Typography.Text>
              ) : null}
            </div>
            <Dropdown.Menu>
              <Dropdown.Item data-testid="layout-user-dropdown-profile-entry" icon={<IconUser />} onClick={onOpenProfile}>
                {t("workbench.user.profile")}
              </Dropdown.Item>
              {userDropdownAfter}
              <Dropdown.Item data-testid="layout-user-dropdown-logout" icon={<IconExit />} onClick={onLogout}>
                {t("workbench.user.logout")}
              </Dropdown.Item>
            </Dropdown.Menu>
          </div>
        )}
        trigger="click"
      >
        <Button aria-label={t("workbench.user.menu")} data-testid="layout-user-dropdown-trigger" theme="borderless">
          <span data-testid="layout-user-dropdown-trigger-avatar">
            <Avatar
              alt={context?.user.realName}
              size="small"
              src={context?.user.avatar || defaultAvatarUrl}
            >
              {(context?.user.realName || context?.user.username || "").slice(-2).toUpperCase() || <IconUser />}
            </Avatar>
          </span>
          <span>{context?.user.realName || context?.user.username}</span>
        </Button>
      </Dropdown>
    </header>
  );
}
