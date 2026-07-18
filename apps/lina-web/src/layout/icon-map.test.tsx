import { IconGridStroked } from "@douyinfe/semi-icons";
import { isValidElement } from "react";
import { expect, it } from "vitest";

import { workbenchIcon } from "#/layout/icon-map";

const configuredMenuIcons = [
  "ant-design:appstore-outlined",
  "ant-design:deployment-unit-outlined",
  "ant-design:user-outlined",
  "ant-design:user-switch-outlined",
  "carbon:workspace",
  "lucide:activity",
  "lucide:area-chart",
  "lucide:blocks",
  "lucide:book-open",
  "lucide:box",
  "lucide:brain-circuit",
  "lucide:briefcase",
  "lucide:building",
  "lucide:building-2",
  "lucide:calendar-range",
  "lucide:clock-3",
  "lucide:cpu",
  "lucide:file-code",
  "lucide:file-text",
  "lucide:flask-conical",
  "lucide:folder-open",
  "lucide:landmark",
  "lucide:layout-dashboard",
  "lucide:log-in",
  "lucide:megaphone",
  "lucide:menu",
  "lucide:network",
  "lucide:newspaper",
  "lucide:plug",
  "lucide:puzzle",
  "lucide:scroll-text",
  "lucide:server",
  "lucide:server-cog",
  "lucide:settings-2",
  "lucide:shield",
  "lucide:shield-check",
  "lucide:sliders-horizontal",
];

it("renders every configured menu icon without the generic grid fallback", () => {
  for (const icon of configuredMenuIcons) {
    const renderedIcon = workbenchIcon(icon);
    expect(isValidElement(renderedIcon)).toBe(true);
    if (isValidElement(renderedIcon)) {
      expect(renderedIcon.type).not.toBe(IconGridStroked);
    }
  }
});

it("uses the generic grid fallback only for unknown icon names", () => {
  const fallback = workbenchIcon("legacy:unknown");
  expect(isValidElement(fallback)).toBe(true);
  if (isValidElement(fallback)) {
    expect(fallback.type).toBe(IconGridStroked);
  }
});
