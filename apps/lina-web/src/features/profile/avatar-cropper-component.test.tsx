import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createInstance } from "i18next";
import { beforeAll, expect, it, vi } from "vitest";

const cropper = vi.hoisted(() => ({
  destroy: vi.fn(),
  getCroppedCanvas: vi.fn(() => ({
    toBlob: (callback: BlobCallback) => callback(new Blob(["avatar"], { type: "image/png" })),
  })),
}));
vi.mock("cropperjs", () => ({
  default: class MockCropper {
    destroy = cropper.destroy;
    getCroppedCanvas = cropper.getCroppedCanvas;
  },
}));

import { Providers } from "#/app/providers";
import { AvatarCropper } from "#/features/profile/avatar-cropper";
import enMessages from "#/locales/en-US/app.json";

const i18n = createInstance();
beforeAll(async () => {
  await i18n.init({ lng: "en-US", resources: { "en-US": { translation: enMessages } } });
});

it("keeps the crop dialog open and reports an upload failure for retry", async () => {
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:avatar");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  const upload = vi.fn(async () => { throw new Error("Upload unavailable"); });
  render(<Providers i18n={i18n}><AvatarCropper avatar="/avatar.png" onUpload={upload} /></Providers>);
  await userEvent.upload(
    screen.getByLabelText("Select avatar image"),
    new File(["avatar"], "avatar.png", { type: "image/png" }),
  );
  expect(await screen.findByRole("dialog", { name: "Crop avatar" })).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Upload avatar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Upload unavailable");
  expect(screen.getByRole("dialog", { name: "Crop avatar" })).toBeVisible();
  expect(upload).toHaveBeenCalledOnce();
  vi.restoreAllMocks();
});
