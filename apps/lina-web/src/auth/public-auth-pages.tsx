import Button from "@douyinfe/semi-ui/lib/es/button";
import Checkbox from "@douyinfe/semi-ui/lib/es/checkbox";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import type { AuthApi } from "#/api/auth";
import { LocalizedPasswordField } from "#/plugin-ui/password-field";
import { LanguageToggle } from "#/runtime/language-toggle";

type PublicAuthApi = Required<Pick<AuthApi, "forgetPassword" | "register" | "resetPassword">>;

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function publicError(reason: unknown, fallback: string): string {
  return reason instanceof Error && reason.message ? reason.message : fallback;
}

interface PublicAuthBrandProps {
  appName?: string;
  logoUrl?: string;
}

function PublicAuthShell({ appName = "LinaPro", children, logoUrl = "/logo.webp", title }: PublicAuthBrandProps & { children: React.ReactNode; title: string }) {
  const { t } = useTranslation();
  return <main className="login-page public-auth-page"><section className="login-brand" aria-label={appName}><img alt={appName} className="login-logo" height="48" src={logoUrl} width="48" /><Typography.Text strong>{appName}</Typography.Text><Typography.Title heading={1}>{t("auth.subtitle")}</Typography.Title></section><section className="login-panel"><div className="login-language-toggle"><LanguageToggle /></div><Typography.Title heading={2}>{title}</Typography.Title>{children}<Link data-testid="public-auth-back-to-login" to="/auth/login">{t("auth.backToLogin")}</Link></section></main>;
}

export function RegisterPage({ api, appName, enabled, logoUrl, privacyPolicy = "", termsOfService = "" }: PublicAuthBrandProps & { api: PublicAuthApi; enabled: boolean; privacyPolicy?: string; termsOfService?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const requiresConsent = Boolean(privacyPolicy || termsOfService);
  const [consented, setConsented] = useState(false);
  const [policy, setPolicy] = useState<"privacy" | "terms">();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  if (!enabled) return <Navigate replace to="/auth/login" />;
  return <PublicAuthShell appName={appName} logoUrl={logoUrl} title={t("auth.register.title")}><Form<{ email: string; password: string; passwordConfirm: string; username: string }> labelPosition="top" onSubmit={async (values) => {
    if (values.password !== values.passwordConfirm) { setError(t("auth.register.passwordMismatch")); return; }
    if (!isEmail(values.email)) { setError(t("auth.emailInvalid")); return; }
    if (requiresConsent && !consented) { setError(t("auth.register.consentRequired")); return; }
    setSubmitting(true); setError("");
    try { await api.register({ email: values.email, password: values.password, username: values.username }); await navigate("/auth/login", { replace: true }); }
    catch (reason) { setError(publicError(reason, t("auth.register.failed"))); } finally { setSubmitting(false); }
  }}>
    <Form.Input field="username" label={t("auth.username")} rules={[{ required: true, message: t("auth.usernameRequired") }]} />
    <Form.Input field="email" label={t("auth.email")} rules={[{ required: true, message: t("auth.emailRequired") }]} />
    <LocalizedPasswordField field="password" hidePasswordLabel={t("pages.common.hidePassword")} label={t("auth.password")} rules={[{ required: true, message: t("auth.passwordRequired") }, { min: 6, message: t("auth.passwordTooShort") }]} showPasswordLabel={t("pages.common.showPassword")} />
    <LocalizedPasswordField field="passwordConfirm" hidePasswordLabel={t("pages.common.hidePassword")} label={t("auth.register.confirmPassword")} rules={[{ required: true, message: t("auth.register.confirmRequired") }]} showPasswordLabel={t("pages.common.showPassword")} />
    {requiresConsent ? <Checkbox checked={consented} data-testid="register-consent" onChange={(event) => setConsented(Boolean(event.target.checked))}>{t("auth.register.consent")} {privacyPolicy ? <Button data-testid="register-privacy-policy" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setPolicy("privacy"); }} theme="borderless">{t("auth.register.privacyPolicy")}</Button> : null} {termsOfService ? <Button data-testid="register-terms-of-service" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setPolicy("terms"); }} theme="borderless">{t("auth.register.termsOfService")}</Button> : null}</Checkbox> : null}
    <Button block data-testid="register-submit" htmlType="submit" loading={submitting} theme="solid" type="primary">{t("auth.register.submit")}</Button>
  </Form>{error ? <Typography.Text role="alert" type="danger">{error}</Typography.Text> : null}<Modal footer={null} onCancel={() => setPolicy(undefined)} title={policy === "privacy" ? t("auth.register.privacyPolicy") : t("auth.register.termsOfService")} visible={Boolean(policy)} width="min(520px, calc(100vw - 24px))"><Typography.Paragraph style={{ whiteSpace: "pre-wrap" }}>{policy === "privacy" ? privacyPolicy : termsOfService}</Typography.Paragraph></Modal></PublicAuthShell>;
}

export function ForgetPasswordPage({ api, appName, enabled, logoUrl }: PublicAuthBrandProps & { api: PublicAuthApi; enabled: boolean }) {
  const { t } = useTranslation(); const [error, setError] = useState(""); const [submitted, setSubmitted] = useState(false);
  if (!enabled) return <Navigate replace to="/auth/login" />;
  return <PublicAuthShell appName={appName} logoUrl={logoUrl} title={t("auth.forgotPassword")}><Form<{ email: string }> labelPosition="top" onSubmit={async ({ email }) => {
    if (!isEmail(email)) { setError(t("auth.emailInvalid")); return; }
    setError(""); try { await api.forgetPassword({ email }); setSubmitted(true); } catch (reason) { setError(publicError(reason, t("auth.forgot.failed"))); }
  }}><Form.Input field="email" label={t("auth.email")} rules={[{ required: true, message: t("auth.emailRequired") }]} /><Button block data-testid="forget-password-submit" htmlType="submit" theme="solid" type="primary">{t("auth.forgot.submit")}</Button></Form>{submitted ? <Typography.Text data-testid="forget-password-success">{t("auth.forgot.accepted")}</Typography.Text> : null}{error ? <Typography.Text role="alert" type="danger">{error}</Typography.Text> : null}</PublicAuthShell>;
}

export function ResetPasswordPage({ api, appName, enabled, logoUrl }: PublicAuthBrandProps & { api: PublicAuthApi; enabled: boolean }) {
  const { t } = useTranslation(); const navigate = useNavigate(); const [params] = useSearchParams(); const token = params.get("token")?.trim() || ""; const [error, setError] = useState(""); const [submitting, setSubmitting] = useState(false);
  if (!enabled) return <Navigate replace to="/auth/login" />;
  if (!token) return <Navigate replace to="/auth/forget-password" />;
  return <PublicAuthShell appName={appName} logoUrl={logoUrl} title={t("auth.reset.title")}><Form<{ password: string; passwordConfirm: string }> labelPosition="top" onSubmit={async (values) => {
    if (values.password !== values.passwordConfirm) { setError(t("auth.register.passwordMismatch")); return; }
    setSubmitting(true); setError(""); try { await api.resetPassword({ password: values.password, token }); await navigate("/auth/login", { replace: true }); } catch (reason) { setError(publicError(reason, t("auth.reset.failed"))); } finally { setSubmitting(false); }
  }}><LocalizedPasswordField field="password" hidePasswordLabel={t("pages.common.hidePassword")} label={t("auth.password")} rules={[{ required: true, message: t("auth.passwordRequired") }, { min: 6, message: t("auth.passwordTooShort") }]} showPasswordLabel={t("pages.common.showPassword")} /><LocalizedPasswordField field="passwordConfirm" hidePasswordLabel={t("pages.common.hidePassword")} label={t("auth.register.confirmPassword")} rules={[{ required: true, message: t("auth.register.confirmRequired") }]} showPasswordLabel={t("pages.common.showPassword")} /><Button block data-testid="reset-password-submit" htmlType="submit" loading={submitting} theme="solid" type="primary">{t("auth.reset.submit")}</Button></Form>{error ? <Typography.Text role="alert" type="danger">{error}</Typography.Text> : null}</PublicAuthShell>;
}
