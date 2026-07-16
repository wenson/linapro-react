import { expect, it, vi } from "vitest";
import { ApiClient } from "#/api/client";
import { createSystemPluginApi } from "#/api/system/plugin";

function ok(data: unknown) { return new Response(JSON.stringify({ code: 0, data }), { headers: { "content-type": "application/json" } }); }
it("filters builtin plugins defensively and preserves lifecycle paths", async () => { const fetch = vi.fn().mockImplementation(async (input: RequestInfo | URL) => String(input).includes("/plugins?") ? ok({ list: [{ distribution: "builtin", id: "builtin" }, { distribution: "managed", id: "acme" }], total: 2 }) : ok(undefined)); const api = createSystemPluginApi(new ApiClient({ fetch })); const list = await api.list({ includeBuiltin: false, pageNum: 1, pageSize: 10 }); expect(list.list.map((item) => item.id)).toEqual(["acme"]); await api.disable("acme"); await api.policy("acme", true); expect(fetch.mock.calls.map((call) => call[0])).toEqual(["/api/v1/plugins?includeBuiltin=false&pageNum=1&pageSize=10", "/api/v1/plugins/acme/disable", "/api/v1/plugins/acme/tenant-provisioning-policy"]); });
