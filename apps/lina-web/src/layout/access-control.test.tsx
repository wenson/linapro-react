import { render, screen } from "@testing-library/react";

import { Can } from "#/layout/can";
import { Capability } from "#/layout/capability";
import { managementCapabilityKeys } from "#/plugins/capabilities";

describe("access control visibility", () => {
  it("fully hides operations without the required permission", () => {
    const { rerender } = render(
      <Can permission="system:user:add" permissions={["system:user:list"]}>
        <button>Add user</button>
      </Can>,
    );
    expect(screen.queryByRole("button", { name: "Add user" })).not.toBeInTheDocument();

    rerender(
      <Can permission="system:user:add" permissions={["system:user:add"]}>
        <button>Add user</button>
      </Can>,
    );
    expect(screen.getByRole("button", { name: "Add user" })).toBeVisible();
  });

  it("fully hides module UI when its capability is disabled", () => {
    const { rerender } = render(
      <Capability
        capabilities={{ organizationEnabled: false, tenantEnabled: true }}
        capability={managementCapabilityKeys.organization}
      >
        <label>Department</label>
      </Capability>,
    );
    expect(screen.queryByText("Department")).not.toBeInTheDocument();

    rerender(
      <Capability
        capabilities={{ organizationEnabled: true, tenantEnabled: true }}
        capability={managementCapabilityKeys.organization}
      >
        <label>Department</label>
      </Capability>,
    );
    expect(screen.getByText("Department")).toBeVisible();
  });
});
