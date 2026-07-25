import { mkdirSync } from "node:fs";
import path from "node:path";

import { test, expect } from "../../fixtures/auth";
import { MainLayout } from "../../pages/MainLayout";
import { waitForRouteReady } from "../../support/ui";

const navigationIcons = [
  ["工作台", "apps"],
  ["权限管理", "shield"],
  ["平台管理", "briefcase"],
  ["组织管理", "connection_point_2"],
  ["系统设置", "setting"],
  ["系统监控", "activity"],
  ["任务调度", "calendar_stroked"],
  ["扩展中心", "puzzle"],
  ["开发中心", "beaker"],
] as const;

test.describe("TC-7 工作台导航图标", () => {
  test("TC-7a: 每个宿主目录呈现与功能匹配的图标而非通用四宫格", async ({
    adminPage,
  }) => {
    await adminPage.goto("/about/system-info");
    await waitForRouteReady(adminPage);

    const mainLayout = new MainLayout(adminPage);
    for (const [label, iconLabel] of navigationIcons) {
      await expect(mainLayout.sidebarMenuIcon(label)).toHaveAttribute(
        "aria-label",
        iconLabel,
      );
    }

    const timestamp = new Date();
    const date = timestamp.toISOString().slice(0, 10).replaceAll("-", "");
    const time = timestamp.toTimeString().slice(0, 8).replaceAll(":", "");
    const screenshotDirectory = path.resolve("../../temp", date);
    mkdirSync(screenshotDirectory, { recursive: true });
    await adminPage.screenshot({
      path: path.join(screenshotDirectory, `${time}-workbench-navigation-icons.png`),
      fullPage: false,
    });
  });
});
