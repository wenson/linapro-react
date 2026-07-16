import { describe, expect, it, vi } from "vitest";

import { ApiClient } from "#/api/client";
import { createSystemRoleApi } from "#/api/system/role";
import { createSystemUserApi } from "#/api/system/user";

function ok(data?: unknown) { return new Response(JSON.stringify({ code: 0, data }), { headers: { "content-type": "application/json" }, status: 200 }); }

describe("IAM API contracts", () => {
  it("sends one repeated-query request for user and role batch deletion", async () => {
    const fetch = vi.fn().mockImplementation(async () => ok()); const client = new ApiClient({ fetch });
    await createSystemUserApi(client).batchDelete([3, 4]);
    await createSystemRoleApi(client).batchDelete([5, 6]);
    expect(fetch.mock.calls[0]?.[0]).toBe("/api/v1/user?ids=3&ids=4");
    expect(fetch.mock.calls[1]?.[0]).toBe("/api/v1/role?ids=5&ids=6");
  });

  it("uses a DELETE request body for batch role unassignment", async () => {
    const fetch = vi.fn().mockResolvedValue(ok()); const client = new ApiClient({ fetch });
    await createSystemRoleApi(client).unassignUsers(8, [10, 11]);
    expect(fetch).toHaveBeenCalledWith("/api/v1/role/8/users", expect.objectContaining({ body: JSON.stringify({ userIds: [10, 11] }), method: "DELETE" }));
  });
});
