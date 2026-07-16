import { expect, it, vi } from "vitest";

import { ApiClient } from "#/api/client";
import { createProfileApi } from "#/api/profile";

it("uploads an avatar as multipart before updating the profile URL", async () => {
  const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => new Response(JSON.stringify({
    code: 0,
    data: init?.method === "POST" ? { url: "/uploads/avatar.png" } : undefined,
  }), { headers: { "content-type": "application/json" } }));
  const api = createProfileApi(new ApiClient({ fetch }));
  await expect(api.updateAvatar(new Blob(["image"], { type: "image/png" }), "avatar.png")).resolves.toBe("/uploads/avatar.png");
  expect(fetch).toHaveBeenNthCalledWith(
    1,
    "/api/v1/file/upload",
    expect.objectContaining({ body: expect.any(FormData), method: "POST" }),
  );
  expect(fetch).toHaveBeenNthCalledWith(
    2,
    "/api/v1/user/profile/avatar",
    expect.objectContaining({ body: JSON.stringify({ avatar: "/uploads/avatar.png" }), method: "PUT" }),
  );
});
