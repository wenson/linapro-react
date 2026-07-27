import { IconEyeClosed, IconEyeOpened } from "@douyinfe/semi-icons";
import Button from "@douyinfe/semi-ui/lib/es/button";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import type { ComponentProps } from "react";
import { useState } from "react";

type FormInputProps = ComponentProps<typeof Form.Input>;

export function LocalizedPasswordField({
  hidePasswordLabel,
  showPasswordLabel,
  ...props
}: Omit<FormInputProps, "mode" | "suffix" | "type"> & {
  hidePasswordLabel: string;
  showPasswordLabel: string;
}) {
  const [visible, setVisible] = useState(false);
  const label = visible ? hidePasswordLabel : showPasswordLabel;

  return (
    <Form.Input
      {...props}
      suffix={(
        <Button
          aria-label={label}
          icon={visible ? <IconEyeOpened /> : <IconEyeClosed />}
          onClick={() => setVisible((value) => !value)}
          onMouseDown={(event) => event.preventDefault()}
          size="small"
          theme="borderless"
          htmlType="button"
        />
      )}
      type={visible ? "text" : "password"}
    />
  );
}
