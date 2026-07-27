import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ResponsiveListFeedback } from "#/plugin-ui/mobile-record";

const labels = {
  emptyLabel: "No records",
  errorLabel: "Unable to load data",
  loadingLabel: "Loading",
  retryLabel: "Retry",
};

describe("ResponsiveListFeedback", () => {
  it("renders a retryable error independently from desktop and mobile data views", async () => {
    const onRetry = vi.fn();
    render(<ResponsiveListFeedback {...labels} empty error loading={false} onRetry={onRetry} testId="list-feedback" />);

    const feedback = screen.getByTestId("list-feedback");
    expect(feedback).toHaveAttribute("data-state", "error");
    expect(feedback).toHaveAttribute("role", "alert");
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("gives loading precedence and exposes an accessible status", () => {
    render(<ResponsiveListFeedback {...labels} empty error loading onRetry={vi.fn()} testId="list-feedback" />);

    expect(screen.getByRole("status", { name: "Loading" })).toHaveAttribute("data-state", "loading");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not render when list data is ready", () => {
    render(<ResponsiveListFeedback {...labels} empty={false} error={false} loading={false} onRetry={vi.fn()} testId="list-feedback" />);

    expect(screen.queryByTestId("list-feedback")).not.toBeInTheDocument();
  });
});
