import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";

import type { AuthApi } from "#/api/auth";
import { Providers } from "#/app/providers";
import { RegisterPage } from "#/auth/public-auth-pages";

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
        <RegisterPage api={api} enabled privacyPolicy="Private data stays protected." termsOfService="Use this workspace responsibly." />
      </MemoryRouter>
    </Providers>,
  );

  expect(screen.getByTestId("register-consent")).toBeVisible();
  expect(screen.getByTestId("public-auth-back-to-login")).toHaveAttribute("href", "/auth/login");
  await user.click(screen.getByTestId("register-privacy-policy"));
  expect(await screen.findByText("Private data stays protected.")).toBeVisible();
});
