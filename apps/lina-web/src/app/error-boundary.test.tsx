import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { ErrorBoundary } from "#/app/error-boundary";

function BrokenChild(): never {
  throw new Error("expected render failure");
}

describe("ErrorBoundary", () => {
  it("shows a recoverable error surface when rendering fails", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <ErrorBoundary>
        <BrokenChild />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload workbench" })).toBeEnabled();
    consoleError.mockRestore();
  });
});
