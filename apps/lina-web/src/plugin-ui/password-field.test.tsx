import { fireEvent, render, screen } from "@testing-library/react";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import { expect, it } from "vitest";

import { LocalizedPasswordField } from "#/plugin-ui/password-field";

it("uses localized password visibility names and toggles the native input type", () => {
  render(
    <Form>
      <LocalizedPasswordField
        field="password"
        hidePasswordLabel="隐藏密码"
        id="localized-password"
        label="密码"
        showPasswordLabel="显示密码"
      />
    </Form>,
  );

  const input = screen.getByLabelText("密码");
  expect(input).toHaveAttribute("type", "password");
  fireEvent.click(screen.getByRole("button", { name: "显示密码" }));
  expect(input).toHaveAttribute("type", "text");
  expect(screen.getByRole("button", { name: "隐藏密码" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Show password" })).not.toBeInTheDocument();
});
