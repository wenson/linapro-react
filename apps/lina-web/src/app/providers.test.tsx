import { render, screen } from "@testing-library/react";

import { Providers } from "#/app/providers";

describe("Providers", () => {
  it("renders descendants inside the query and Semi locale providers", () => {
    render(
      <Providers>
        <div>Provider smoke passed</div>
      </Providers>,
    );

    expect(screen.getByText("Provider smoke passed")).toBeInTheDocument();
  });
});
