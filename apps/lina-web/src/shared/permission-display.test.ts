import { createInstance } from "i18next";
import { beforeAll, describe, expect, it } from "vitest";

import enMessages from "#/locales/en-US/app.json";
import zhMessages from "#/locales/zh-CN/app.json";
import {
  formatMenuPermissionLabel,
  formatMenuPermissionShortLabel,
} from "#/shared/permission-display";

const i18n = createInstance();

beforeAll(async () => {
  await i18n.init({
    fallbackLng: "en-US",
    resources: {
      "en-US": { translation: enMessages },
      "zh-CN": { translation: zhMessages },
    },
  });
});

describe("dynamic route permission display", () => {
  it("formats prefixed permissions for the Chinese role tree", () => {
    expect(formatMenuPermissionLabel(
      "Dynamic Route Permission:plugin-dynamic-host-auth-ui:review:query",
      i18n.getFixedT("zh-CN"),
      "zh-CN",
    )).toBe("动态路由权限（资源：审核，动作：查询）");
  });

  it("formats raw permissions for the English role tree", () => {
    expect(formatMenuPermissionLabel(
      "plugin-dynamic-host-auth-ui:audit:query",
      i18n.getFixedT("en-US"),
      "en-US",
    )).toBe("Dynamic Route Permission (resource: Audit, action: Query)");
  });

  it("falls back to readable English labels for unknown segments", () => {
    expect(formatMenuPermissionLabel(
      "plugin-dynamic-host-auth-ui:report-center:read",
      i18n.getFixedT("en-US"),
      "en-US",
    )).toBe("Dynamic Route Permission (resource: Report Center, action: Read)");
  });

  it("uses short localized names in menu management", () => {
    expect(formatMenuPermissionShortLabel(
      "Dynamic Route Permission:linapro-demo-dynamic:record:create",
      i18n.getFixedT("en-US"),
      "en-US",
    )).toBe("Record Create");
    expect(formatMenuPermissionShortLabel(
      "Dynamic Route Permission:linapro-demo-dynamic:backend:view",
      i18n.getFixedT("zh-CN"),
      "zh-CN",
    )).toBe("后端查看");
  });

  it("preserves ordinary menu names", () => {
    expect(formatMenuPermissionLabel(
      "Plugin management",
      i18n.getFixedT("en-US"),
      "en-US",
    )).toBe("Plugin management");
  });
});
