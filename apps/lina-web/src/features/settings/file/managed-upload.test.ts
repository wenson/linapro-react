import { describe, expect, it, vi } from "vitest";

import type { ReturnTypeOfSystemFileApi } from "#/features/settings/file/types";
import { uploadThroughPlan } from "#/features/settings/file/managed-upload";

function apiForProxyMultipart(): ReturnTypeOfSystemFileApi {
  return {
    chunkedUploadAbort: vi.fn().mockResolvedValue(undefined),
    chunkedUploadComplete: vi.fn().mockResolvedValue({}),
    chunkedUploadInit: vi.fn().mockResolvedValue({
      multipart: { maxConcurrency: 1, minPartSize: 1, partSize: 2 },
      uploadSessionId: "proxy-session",
    }),
    chunkedUploadPart: vi.fn().mockResolvedValue("etag"),
    directUploadAbort: vi.fn(),
    directUploadComplete: vi.fn(),
    directUploadInit: vi.fn().mockResolvedValue({
      instantReuse: false,
      strategy: { channel: "proxy", encoding: "multipart" },
    }),
    directUploadPartUrl: vi.fn(),
    upload: vi.fn(),
  } as unknown as ReturnTypeOfSystemFileApi;
}

describe("uploadThroughPlan", () => {
  it("uses proxy multipart parts instead of buffering a large proxy upload", async () => {
    const api = apiForProxyMultipart();
    const progress = vi.fn();

    await uploadThroughPlan(api, new File(["abcdef"], "large.txt", { type: "text/plain" }), "other", progress);

    expect(api.upload).not.toHaveBeenCalled();
    expect(api.chunkedUploadInit).toHaveBeenCalledTimes(1);
    expect(api.chunkedUploadPart).toHaveBeenCalledTimes(3);
    expect(api.chunkedUploadComplete).toHaveBeenCalledWith("proxy-session", [
      { etag: "etag", partNumber: 1 },
      { etag: "etag", partNumber: 2 },
      { etag: "etag", partNumber: 3 },
    ]);
    expect(progress).toHaveBeenLastCalledWith(6);
  });

  it("aborts the proxy multipart session when any part fails", async () => {
    const api = apiForProxyMultipart();
    vi.mocked(api.chunkedUploadPart).mockRejectedValueOnce(new Error("network failed"));

    await expect(uploadThroughPlan(api, new File(["abcdef"], "large.txt"), "other", vi.fn())).rejects.toThrow("network failed");

    expect(api.chunkedUploadAbort).toHaveBeenCalledWith("proxy-session");
    expect(api.chunkedUploadComplete).not.toHaveBeenCalled();
  });
});
