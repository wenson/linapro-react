import { render, screen } from "@testing-library/react";

import { Providers } from "#/app/providers";
import { StartupPage } from "#/app/startup-page";

describe("StartupPage", () => {
  it("renders an accessible minimal workbench status", () => {
    render(
      <Providers>
        <StartupPage />
      </Providers>,
    );

    expect(screen.getByRole("heading", { name: "LinaPro React Workbench" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "LinaPro" })).toHaveAttribute("width", "72");
    expect(screen.getByRole("status")).toHaveTextContent("Foundation verified");
  });
});
