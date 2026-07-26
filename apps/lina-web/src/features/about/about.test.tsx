import { QueryClient } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { createInstance } from "i18next";
import { beforeAll, expect, it, vi } from "vitest";

import { ApiClient } from "#/api/client";
import { Providers } from "#/app/providers";
import { WorkbenchRuntimeProvider } from "#/app/workbench-runtime-provider";
import ApiDocsPage from "#/features/about/api-docs-page";
import SystemInfoPage from "#/features/about/system-info-page";
import enMessages from "#/locales/en-US/app.json";
import zhMessages from "#/locales/zh-CN/app.json";
import { defaultPublicFrontendConfig } from "#/runtime/public-config";

const i18n = createInstance();
beforeAll(async () => {
  await i18n.init({ lng: "en-US", resources: {
    "en-US": { translation: enMessages },
    "zh-CN": { translation: zhMessages },
  } });
});

function wrapper(client: ApiClient, config = defaultPublicFrontendConfig) {
  return ({ children }: { children: React.ReactNode }) => (
    <Providers i18n={i18n} queryClient={new QueryClient()}>
      <WorkbenchRuntimeProvider value={{ apiClient: client, config }}>{children}</WorkbenchRuntimeProvider>
    </Providers>
  );
}

it.each([
  ["/", "/stoplight/apidocs.html?api=%2Fapi.json&lang=en-US"],
  ["/console", "/console/stoplight/apidocs.html?api=%2Fapi.json&lang=en-US"],
])("keeps API Docs under basePath %s with /api.json and the active iframe language", async (basePath, expectedSource) => {
  const config = { ...defaultPublicFrontendConfig, workspace: { basePath } };
  const fetch = vi.fn(async () => new Response("{}", { status: 200 }));
  const { rerender } = render(<ApiDocsPage />, { wrapper: wrapper(new ApiClient({ fetch }), config) });
  expect(screen.getByTestId("api-docs-loading")).toBeVisible();
  expect(await screen.findByTitle("API documentation")).toHaveAttribute(
    "src",
    expectedSource,
  );
  await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api.json?lang=en-US", expect.anything()));
  await act(async () => i18n.changeLanguage("zh-CN"));
  rerender(<ApiDocsPage />);
  expect(screen.getByTestId("api-docs-frame").getAttribute("src")).toContain("lang=zh-CN");
  await act(async () => i18n.changeLanguage("en-US"));
});

it("shows a localized retryable failure when the API description preflight fails", async () => {
  const fetch = vi.fn(async () => new Response("unavailable", { status: 503 }));
  render(<ApiDocsPage />, { wrapper: wrapper(new ApiClient({ fetch })) });

  expect(await screen.findByTestId("api-docs-failed")).toHaveTextContent("API documentation is unavailable");
  expect(screen.getByRole("button", { name: "Retry" })).toBeVisible();

  fetch.mockResolvedValueOnce(new Response("{}", { status: 200 }));
  await act(async () => screen.getByRole("button", { name: "Retry" }).click());
  expect(await screen.findByTestId("api-docs-frame")).toBeVisible();
});

it("loads and renders framework, backend and frontend system information", async () => {
  const fetch = vi.fn(async () => new Response(JSON.stringify({
    code: 0,
    data: {
      arch: "arm64", backendComponents: [{ description: "Go web framework", name: "GoFrame", url: "https://goframe.org", version: "2.10" }],
      dbVersion: "PostgreSQL 17", framework: { description: "Framework", homepage: "https://example.com", license: "Apache-2.0", name: "LinaPro", repositoryUrl: "https://example.com/repo", version: "1.0.0" },
      frontendComponents: [{ description: "React UI", name: "Semi Design", url: "https://semi.design", version: "2.101" }],
      gfVersion: "2.10", goVersion: "go1.24", os: "darwin", runDuration: "2h", runDurationSeconds: 7200, startTime: 1,
    },
  }), { headers: { "content-type": "application/json" } }));
  render(<SystemInfoPage />, { wrapper: wrapper(new ApiClient({ fetch })) });
  expect(await screen.findByText("LinaPro")).toBeVisible();
  expect(screen.getByText("PostgreSQL 17")).toBeVisible();
  expect(screen.getByTestId("system-info-component-goframe")).toBeVisible();
  await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/v1/system/info", expect.anything()));
});
