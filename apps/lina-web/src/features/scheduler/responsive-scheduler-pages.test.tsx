import { QueryClient } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { ApiClient } from "#/api/client";
import { Providers } from "#/app/providers";
import { WorkbenchRuntimeProvider } from "#/app/workbench-runtime-provider";
import { AuthContextProvider } from "#/auth/auth-context-provider";
import JobGroupPage from "#/features/scheduler/job-group-page";
import JobLogPage from "#/features/scheduler/job-log-page";
import JobPage from "#/features/scheduler/job-page";
import { defaultPublicFrontendConfig } from "#/runtime/public-config";

const group = { code: "uir-group", createdAt: 1, id: 10, isDefault: 0, jobCount: 1, name: "UIR Job Group", remark: "", sortOrder: 1, updatedAt: 1 };
const job = { concurrency: "singleton", createdAt: 1, cronExpr: "0 0 * * *", description: "", env: "{}", executedCount: 1, groupCode: group.code, groupId: group.id, groupName: group.name, handlerRef: "host:uir", id: 20, isBuiltin: 0, logRetentionOverride: "", maxConcurrency: 1, maxExecutions: 0, name: "UIR Job", params: "{}", scope: "master_only", seedVersion: 0, shellCmd: "", status: "enabled", stopReason: "", taskType: "handler", timeoutSeconds: 60, timezone: "Asia/Shanghai", updatedAt: 1, workDir: "" };
const log = { createdAt: 1, durationMs: 25, endAt: 2, errMsg: "", id: 30, jobId: job.id, jobName: "UIR Job Log", jobSnapshot: "{}", nodeId: "node-1", paramsSnapshot: "{}", resultJson: "{}", startAt: 1, status: "success", trigger: "manual" };
const context = { capabilities: { organizationEnabled: true, tenantEnabled: true }, menus: [], plugins: [], user: { avatar: "", email: "", homePath: "/", menus: [], permissions: ["*"], realName: "Admin", roles: [], userId: 1, username: "admin" } };

function ok(data: unknown) { return new Response(JSON.stringify({ code: 0, data }), { headers: { "content-type": "application/json" } }); }
function view(page: React.ReactNode, fetch: typeof globalThis.fetch) { return render(<Providers queryClient={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><WorkbenchRuntimeProvider value={{ apiClient: new ApiClient({ fetch }), config: defaultPublicFrontendConfig }}><AuthContextProvider value={context}>{page}</AuthContextProvider></WorkbenchRuntimeProvider></Providers>); }

it("shares scheduled-job data, permissions and edit actions", async () => {
  const fetch = vi.fn().mockImplementation(async (input: RequestInfo | URL) => String(input).includes("/job-group") ? ok({ list: [group], total: 1 }) : ok({ list: [job], total: 1 }));
  view(<JobPage />, fetch);
  const desktop = await screen.findByTestId("job-table");
  const mobile = await screen.findByTestId("job-mobile-list");
  expect(await within(desktop).findByText(job.name)).toBeVisible();
  expect(within(mobile).getByText(job.name)).toBeVisible();
  expect(within(desktop).getByTestId(`job-edit-${job.id}`)).toBeEnabled();
  expect(within(mobile).getByTestId(`job-edit-${job.id}`)).toBeEnabled();
});

it("shares job-group data, permissions and edit actions", async () => {
  const fetch = vi.fn().mockImplementation(async () => ok({ list: [group], total: 1 }));
  view(<JobGroupPage />, fetch);
  const desktop = await screen.findByTestId("job-group-table");
  const mobile = await screen.findByTestId("job-group-mobile-list");
  expect(await within(desktop).findByText(group.name)).toBeVisible();
  expect(within(mobile).getByText(group.name)).toBeVisible();
  expect(within(desktop).getByTestId(`job-group-edit-${group.id}`)).toBeEnabled();
  expect(within(mobile).getByTestId(`job-group-edit-${group.id}`)).toBeEnabled();
});

it("shares job-log data, permissions and detail actions", async () => {
  const fetch = vi.fn().mockImplementation(async (input: RequestInfo | URL) => String(input).includes("/job/log") ? ok({ list: [log], total: 1 }) : ok({ list: [job], total: 1 }));
  view(<JobLogPage />, fetch);
  const desktop = await screen.findByTestId("job-log-table");
  const mobile = await screen.findByTestId("job-log-mobile-list");
  expect(await within(desktop).findByText(log.jobName)).toBeVisible();
  expect(within(mobile).getByText(log.jobName)).toBeVisible();
  expect(within(desktop).getByTestId(`job-log-detail-${log.id}`)).toBeEnabled();
  expect(within(mobile).getByTestId(`job-log-detail-${log.id}`)).toBeEnabled();
});
