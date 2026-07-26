import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";

import type { AuthApi } from "#/api/auth";
import { Providers } from "#/app/providers";
import { ForgetPasswordPage, RegisterPage, ResetPasswordPage } from "#/auth/public-auth-pages";

const api = {
  forgetPassword: vi.fn(),
  register: vi.fn(),
  resetPassword: vi.fn(),
} as Required<Pick<AuthApi, "forgetPassword" | "register" | "resetPassword">>;

it("shows public registration policy consent and a localized return path", async () => {
  const user = userEvent.setup();
  render(
    <Providers>
      <MemoryRouter>
        <RegisterPage api={api} appName="LinaPro.AI" enabled logoUrl="/brand.webp" privacyPolicy="Private data stays protected." termsOfService="Use this workspace responsibly." />
      </MemoryRouter>
    </Providers>,
  );

  expect(screen.getByTestId("register-consent")).toBeVisible();
  expect(screen.getByAltText("LinaPro.AI")).toHaveAttribute("src", "/brand.webp");
  expect(screen.getByTestId("language-toggle-trigger")).toBeVisible();
  expect(screen.getByTestId("public-auth-back-to-login")).toHaveAttribute("href", "/auth/login");
  await user.click(screen.getByTestId("register-privacy-policy"));
  expect(await screen.findByText("Private data stays protected.")).toBeVisible();
});

it("keeps public auth links inside a non-root base path", () => {
  render(
    <Providers>
      <MemoryRouter basename="/console" initialEntries={["/console/auth/forget-password"]}>
        <ForgetPasswordPage api={api} appName="LinaPro" enabled logoUrl="/console/logo.webp" />
      </MemoryRouter>
    </Providers>,
  );
  expect(screen.getByTestId("public-auth-back-to-login")).toHaveAttribute("href", "/console/auth/login");
});

it("uses the same branded shell for reset password", () => {
  render(
    <Providers>
      <MemoryRouter initialEntries={["/auth/reset-password?token=valid"]}>
        <ResetPasswordPage api={api} appName="LinaPro.AI" enabled logoUrl="/brand.webp" />
      </MemoryRouter>
    </Providers>,
  );
  expect(screen.getByAltText("LinaPro.AI")).toBeVisible();
  expect(screen.getByRole("heading", { name: "Reset password" })).toBeVisible();
});
