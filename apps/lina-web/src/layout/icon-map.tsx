import {
  IconGridStroked,
  IconHome,
  IconMenu,
  IconSetting,
  IconUser,
} from "@douyinfe/semi-icons";
import type { ReactNode } from "react";

const iconMap: Readonly<Record<string, ReactNode>> = {
  home: <IconHome />,
  menu: <IconMenu />,
  setting: <IconSetting />,
  user: <IconUser />,
  "ant-design:home-outlined": <IconHome />,
  "ant-design:setting-outlined": <IconSetting />,
  "ant-design:user-outlined": <IconUser />,
};

export function workbenchIcon(name?: string): ReactNode {
  return (name && iconMap[name]) || <IconGridStroked />;
}
