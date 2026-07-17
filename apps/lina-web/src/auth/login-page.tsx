import Button from "@douyinfe/semi-ui/lib/es/button";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";

import type { LoginParams } from "#/api/auth";
import { AuthRuntime } from "#/auth/auth-runtime";
import type { AuthPanelLayout } from "#/runtime/public-config";
import { LanguageToggle } from "#/runtime/language-toggle";

interface LoginPageProps {
  appName: string;
  externalLoginAfter?: ReactNode;
  externalLoginSocial?: ReactNode;
  externalLoginError?: string;
  forgetPasswordEnabled?: boolean;
  logoUrl: string;
  loginSubtitle?: string;
  pageDescription?: string;
  pageTitle?: string;
  panelLayout?: AuthPanelLayout;
  registerEnabled?: boolean;
  runtime: AuthRuntime;
}

interface TenantFormValues {
  tenantId: number;
}

export function LoginPage({
  appName,
  externalLoginAfter,
  externalLoginError,
  externalLoginSocial,
  forgetPasswordEnabled = true,
  logoUrl,
  loginSubtitle,
  pageDescription,
  pageTitle,
  panelLayout = "panel-right",
  registerEnabled = true,
  runtime,
}: LoginPageProps) {
  const { i18n, t } = useTranslation();
  const sessionStore = runtime.getSessionStore();
  const tenantStore = runtime.getTenantStore();
  const status = useStore(sessionStore, (state) => state.status);
  const authNotice = useStore(sessionStore, (state) => state.authNotice);
  const tenants = useStore(tenantStore, (state) => state.tenants);
  const switching = useStore(tenantStore, (state) => state.switching);
  const [error, setError] = useState("");
  const [usesBuiltInLoginSubtitle] = useState(
    !loginSubtitle
      || loginSubtitle === i18n.t("publicFrontend.auth.loginSubtitle", { defaultValue: loginSubtitle }),
  );
  const [usesBuiltInPageDescription] = useState(
    !pageDescription
      || pageDescription === i18n.t("publicFrontend.auth.pageDesc", { defaultValue: pageDescription }),
  );
  const [usesBuiltInPageTitle] = useState(
    !pageTitle
      || pageTitle === i18n.t("publicFrontend.auth.pageTitle", { defaultValue: pageTitle }),
  );
  const displayedLoginSubtitle = usesBuiltInLoginSubtitle
    ? t("publicFrontend.auth.loginSubtitle", { defaultValue: loginSubtitle || t("auth.description") })
    : loginSubtitle;
  const displayedPageDescription = usesBuiltInPageDescription
    ? t("publicFrontend.auth.pageDesc", { defaultValue: pageDescription || t("auth.subtitle") })
    : pageDescription;
  const displayedPageTitle = usesBuiltInPageTitle
    ? t("publicFrontend.auth.pageTitle", { defaultValue: pageTitle || appName })
    : pageTitle;

  async function handleLogin(values: LoginParams) {
    setError("");
    try {
      await runtime.login(values);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("auth.errors.loginFailed"));
    }
  }

  async function handleTenantSelection(values: TenantFormValues) {
    setError("");
    try {
      await runtime.selectTenant(Number(values.tenantId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("auth.errors.tenantSelectionFailed"));
    }
  }

  const tenantTransitioning = switching && status === "authenticating";
  const selectingTenant = status === "selecting-tenant";

  return (
    <main className="login-page" data-panel-layout={panelLayout}>
      <section className="login-brand" aria-label={appName}>
        <img className="login-logo" src={logoUrl} alt={appName} width="48" height="48" />
        <Typography.Text strong>{appName}</Typography.Text>
        <Typography.Title heading={1}>{displayedPageTitle}</Typography.Title>
        <Typography.Paragraph>{displayedPageDescription}</Typography.Paragraph>
      </section>
      <section
        className="login-panel side-content"
        data-side={panelLayout === "panel-center" ? "bottom" : panelLayout.replace("panel-", "")}
        aria-live="polite"
      >
        <div className="login-language-toggle">
          <LanguageToggle />
        </div>
        {tenantTransitioning ? (
          <div
            className="login-transition"
            data-testid="login-tenant-transition"
            role="status"
          >
            <Spin size="large" />
            <Typography.Title heading={3}>{t("auth.tenant.enteringTitle")}</Typography.Title>
            <Typography.Paragraph type="tertiary">
              {t("auth.tenant.enteringDescription")}
            </Typography.Paragraph>
          </div>
        ) : selectingTenant ? (
          <div data-testid="login-tenant-selector">
            <Typography.Title heading={2}>{t("auth.tenant.selectTitle")}</Typography.Title>
            <Typography.Paragraph type="tertiary">
              {t("auth.tenant.selectDescription")}
            </Typography.Paragraph>
            <div data-testid="login-tenant-form">
              <Form<TenantFormValues>
                initValues={{ tenantId: tenants[0]?.id ?? 0 }}
                labelPosition="top"
                onSubmit={handleTenantSelection}
              >
                <Form.Select
                  field="tenantId"
                  label={t("auth.tenant.field")}
                  optionList={tenants.map((tenant) => ({
                    label: `${tenant.name} (${tenant.code})`,
                    value: tenant.id,
                  }))}
                  placeholder={t("auth.tenant.placeholder")}
                  rules={[{ message: t("auth.tenant.required"), required: true }]}
                />
                <Button
                  aria-label="select tenant"
                  block
                  className="login-primary-action"
                  data-testid="login-tenant-confirm"
                  htmlType="submit"
                  loading={switching}
                  theme="solid"
                  type="primary"
                >
                  {t("auth.tenant.confirm")}
                </Button>
              </Form>
            </div>
          </div>
        ) : (
          <div data-testid="login-form">
            <Typography.Title heading={2}>{t("auth.title")}</Typography.Title>
            <Typography.Paragraph data-testid="login-subtitle" type="tertiary">
              {displayedLoginSubtitle}
            </Typography.Paragraph>
            <Form<LoginParams> labelPosition="top" onSubmit={handleLogin}>
              <Form.Input
                field="username"
                id="username"
                label={t("auth.username")}
                placeholder={t("auth.usernamePlaceholder")}
                rules={[{ message: t("auth.usernameRequired"), required: true }]}
              />
              <Form.Input
                field="password"
                id="password"
                label={t("auth.password")}
                mode="password"
                placeholder={t("auth.passwordPlaceholder")}
                rules={[{ message: t("auth.passwordRequired"), required: true }]}
              />
              <Button
                aria-label="login"
                block
                className="login-primary-action"
                data-testid="login-submit"
                htmlType="submit"
                loading={status === "authenticating"}
                theme="solid"
                type="primary"
              >
                {t("auth.submit")}
              </Button>
            </Form>
            {externalLoginAfter ? <div data-testid="login-external-auth-region">{externalLoginAfter}</div> : null}
            {externalLoginSocial ? (
              <div data-testid="login-social-auth-region">
                <Typography.Text type="tertiary">{t("auth.social.divider")}</Typography.Text>
                {externalLoginSocial}
              </div>
            ) : null}
            {(forgetPasswordEnabled || registerEnabled) ? (
              <div className="login-public-actions">
                {forgetPasswordEnabled ? (
                  <a data-testid="login-forgot-password" href="/auth/forget-password">
                    {t("auth.forgotPassword")}
                  </a>
                ) : null}
                {registerEnabled ? (
                  <a data-testid="login-create-account" href="/auth/register">
                    {t("auth.createAccount")}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
        {error || externalLoginError || authNotice ? (
          <Typography.Text className="login-error" role="alert" type="danger">
            {error || externalLoginError || t("auth.errors.sessionExpired")}
          </Typography.Text>
        ) : null}
      </section>
    </main>
  );
}
