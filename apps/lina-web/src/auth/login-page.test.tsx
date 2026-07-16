import { QueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { vi } from "vitest";

import type { AuthRuntimeApis } from "#/auth/auth-runtime";
import { AuthRuntime } from "#/auth/auth-runtime";
import { LoginPage } from "#/auth/login-page";
import { createSessionStore } from "#/auth/session-store";
import { Providers } from "#/app/providers";
import zhCNMessages from "#/locales/zh-CN/app.json";
import { runtimeI18n } from "#/runtime/i18n";
import { createTenantStore } from "#/tenant/tenant-store";

function createRuntime() {
  const apis: AuthRuntimeApis = {
    auth: {
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    },
    menu: { getAllMenus: vi.fn() },
    plugins: { getRuntimeStates: vi.fn() },
    tenant: {
      endImpersonation: vi.fn(),
      impersonate: vi.fn(),
      listLoginTenants: vi.fn(),
      selectTenant: vi.fn(),
      switchTenant: vi.fn(),
    },
    user: { getCurrentUser: vi.fn() },
  };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const sessionStore = createSessionStore({ storage: null });
  const tenantStore = createTenantStore({ storage: null });
  const runtime = new AuthRuntime({ apis, queryClient, sessionStore, tenantStore });
  return { runtime, sessionStore, tenantStore };
}

function renderLogin(runtime: AuthRuntime) {
  return render(
    <Providers queryClient={new QueryClient()}>
      <LoginPage
        appName="LinaPro"
        logoUrl="/logo.webp"
        loginSubtitle="LinaPro platform"
        runtime={runtime}
      />
    </Providers>,
  );
}

describe("LoginPage", () => {
  it("offers only the LinaPro username and password login path", () => {
    const { runtime } = createRuntime();
    renderLogin(runtime);

    expect(screen.getByLabelText("login")).toBeVisible();
    expect(document.querySelector("#username")).toBeVisible();
    expect(document.querySelector("#password")).toBeVisible();
    expect(screen.queryByText(/OAuth|GitHub|SMS|guest|访客|手机号|邮箱登录/i)).not.toBeInTheDocument();
  });

  it("preserves the tenant selection and transition test IDs", async () => {
    const { runtime, sessionStore, tenantStore } = createRuntime();
    renderLogin(runtime);

    act(() => {
      tenantStore.getState().setContext({
        enabled: true,
        tenants: [
          { code: "alpha", id: 1, name: "Alpha" },
          { code: "beta", id: 2, name: "Beta" },
        ],
      });
      sessionStore.getState().requireTenantSelection("pre-token");
    });
    expect(screen.getByTestId("login-tenant-selector")).toBeVisible();
    expect(screen.getByTestId("login-tenant-form")).toBeVisible();
    expect(screen.getByTestId("login-tenant-confirm")).toBeVisible();
    expect(screen.queryByLabelText("login")).not.toBeInTheDocument();

    act(() => {
      tenantStore.getState().startSwitch();
      sessionStore.getState().beginAuthentication();
    });
    expect(await screen.findByTestId("login-tenant-transition")).toBeVisible();
    expect(screen.queryByTestId("login-tenant-selector")).not.toBeInTheDocument();
  });

  it("relocalizes built-in public login copy while preserving custom values", async () => {
    const { runtime } = createRuntime();
    runtimeI18n.addResourceBundle("zh-CN", "translation", zhCNMessages, true, true);
    await act(async () => runtimeI18n.changeLanguage("zh-CN"));
    const view = render(
      <Providers i18n={runtimeI18n} queryClient={new QueryClient()}>
        <LoginPage
          appName="LinaPro"
          logoUrl="/logo.webp"
          loginSubtitle="请输入您的帐户信息以开始管理您的项目"
          pageDescription="帮助团队快速交付生产级应用，同时保持架构、测试与治理的可持续演进"
          pageTitle="面向可持续交付的 AI 原生全栈框架"
          runtime={runtime}
        />
      </Providers>,
    );

    await act(async () => runtimeI18n.changeLanguage("en-US"));
    expect(screen.getByTestId("login-subtitle")).toHaveTextContent(
      "Enter your account credentials to start managing your projects",
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "An AI-native full-stack framework engineered for sustainable delivery",
    );

    view.unmount();
    const custom = render(
      <Providers i18n={runtimeI18n} queryClient={new QueryClient()}>
        <LoginPage
          appName="LinaPro"
          logoUrl="/logo.webp"
          loginSubtitle="Custom tenant sign-in copy"
          runtime={runtime}
        />
      </Providers>,
    );
    await act(async () => runtimeI18n.changeLanguage("zh-CN"));
    expect(screen.getByTestId("login-subtitle")).toHaveTextContent(
      "Custom tenant sign-in copy",
    );
    custom.unmount();
    await act(async () => runtimeI18n.changeLanguage("en-US"));
  });
});
