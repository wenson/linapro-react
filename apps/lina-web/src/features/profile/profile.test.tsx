import { QueryClient } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createInstance } from "i18next";
import { beforeAll, expect, it, vi } from "vitest";

import { ApiClient } from "#/api/client";
import type { AuthenticatedContext } from "#/auth/auth-context";
import { AuthContextProvider } from "#/auth/auth-context-provider";
import { Providers } from "#/app/providers";
import { WorkbenchRuntimeProvider } from "#/app/workbench-runtime-provider";
import type { UserProfile } from "#/api/profile";
import { BaseSettings } from "#/features/profile/base-settings";
import ProfilePage from "#/features/profile/profile-page";
import enMessages from "#/locales/en-US/app.json";
import { defaultPublicFrontendConfig } from "#/runtime/public-config";

vi.mock("#/features/profile/avatar-cropper", () => ({
  AvatarCropper: ({ avatar }: { avatar: string }) => <img alt="Current avatar" src={avatar} />,
}));

const i18n = createInstance();
beforeAll(async () => {
  await i18n.init({ lng: "en-US", resources: { "en-US": { translation: enMessages } } });
});

const auth: AuthenticatedContext = {
  capabilities: { organizationEnabled: true, tenantEnabled: true }, menus: [], plugins: [],
  user: { avatar: "", email: "admin@example.com", homePath: "/profile", menus: [], permissions: [], realName: "Admin", roles: [], userId: 1, username: "admin" },
};

const profileData = {
  avatar: "", createdAt: 1, deptId: 0, deptName: "", email: "admin@example.com", id: 1,
  loginDate: 1, nickname: "Admin", phone: "13800000000", postIds: [], remark: "", roleIds: [], roleNames: [],
  sex: 0, status: 1, updatedAt: 1, username: "admin",
} satisfies UserProfile;

function profileView(fetch: typeof globalThis.fetch) {
  return render(
    <Providers i18n={i18n} queryClient={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AuthContextProvider value={auth}>
        <WorkbenchRuntimeProvider value={{ apiClient: new ApiClient({ fetch }), config: defaultPublicFrontendConfig }}>
          <ProfilePage />
        </WorkbenchRuntimeProvider>
      </AuthContextProvider>
    </Providers>,
  );
}

it("shows a structured skeleton and delayed explanation while making one profile request", async () => {
  let resolveRequest: ((response: Response) => void) | undefined;
  const fetch = vi.fn(() => new Promise<Response>((resolve) => { resolveRequest = resolve; }));
  vi.useFakeTimers();
  profileView(fetch);

  expect(screen.getByTestId("profile-loading-skeleton")).toBeVisible();
  expect(fetch).toHaveBeenCalledTimes(1);
  act(() => vi.advanceTimersByTime(600));
  expect(screen.getByRole("status")).toHaveTextContent("Loading your profile");

  resolveRequest?.(new Response(JSON.stringify({ code: 0, data: profileData }), { headers: { "content-type": "application/json" } }));
  vi.useRealTimers();
  expect(await screen.findByText("Admin")).toBeVisible();
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("offers a retry after profile loading fails", async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ code: 500, message: "Profile unavailable" }), { headers: { "content-type": "application/json" } }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ code: 0, data: profileData }), { headers: { "content-type": "application/json" } }));
  profileView(fetch);

  expect(await screen.findByRole("alert")).toHaveTextContent("Profile unavailable");
  await userEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByText("Admin")).toBeVisible();
  expect(fetch).toHaveBeenCalledTimes(2);
});

it("blocks a mismatched profile password confirmation without calling the update API", async () => {
  const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => new Response(JSON.stringify({
    code: 0,
    data: init?.method === "PUT" ? undefined : {
      avatar: "", createdAt: 1, deptId: 0, deptName: "", email: "admin@example.com", id: 1,
      loginDate: 1, nickname: "Admin", phone: "13800000000", postIds: [], remark: "", roleIds: [], roleNames: [],
      sex: 0, status: 1, updatedAt: 1, username: "admin",
    },
  }), { headers: { "content-type": "application/json" } }));
  const client = new ApiClient({ fetch });
  render(
    <Providers i18n={i18n} queryClient={new QueryClient()}>
      <AuthContextProvider value={auth}>
        <WorkbenchRuntimeProvider value={{ apiClient: client, config: defaultPublicFrontendConfig }}>
          <ProfilePage />
        </WorkbenchRuntimeProvider>
      </AuthContextProvider>
    </Providers>,
  );
  expect(await screen.findByText("Admin")).toBeVisible();
  await userEvent.click(screen.getByText("Password"));
  fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "old-password" } });
  fireEvent.change(screen.getByLabelText("New password"), { target: { value: "new-password" } });
  fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "different-password" } });
  await userEvent.click(screen.getByRole("button", { name: "Update password" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("The two new passwords do not match");
  expect(fetch.mock.calls.filter(([, init]) => init?.method === "PUT")).toHaveLength(0);
  await userEvent.click(screen.getByText("Security"));
  expect(await screen.findByRole("switch", { name: "Account password" })).toBeChecked();
  await userEvent.click(screen.getByText("Notifications"));
  expect(await screen.findByRole("switch", { name: "System messages" })).toBeChecked();
});

it("submits profile base settings through the owning local form", async () => {
  const profile = profileData;
  const update = vi.fn(async () => undefined);
  render(<Providers i18n={i18n}><BaseSettings profile={profile} update={update} /></Providers>);
  fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Lina" } });
  await userEvent.click(screen.getByRole("button", { name: "Update profile" }));
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ nickname: "Lina" }));
});
