import { expect, it, vi } from "vitest";

import { canvasToBlob } from "#/features/profile/avatar-utils";

it("converts a cropped canvas to a Blob and rejects an empty encoding", async () => {
  const blob = new Blob(["avatar"], { type: "image/png" });
  const success = { toBlob: vi.fn((callback: BlobCallback) => callback(blob)) } as unknown as HTMLCanvasElement;
  await expect(canvasToBlob(success)).resolves.toBe(blob);
  const failure = { toBlob: vi.fn((callback: BlobCallback) => callback(null)) } as unknown as HTMLCanvasElement;
  await expect(canvasToBlob(failure)).rejects.toThrow(/could not be encoded/i);
});
