import enUS from "../manifest/i18n/en-US/plugin.json";
import zhCN from "../manifest/i18n/zh-CN/plugin.json";
import definition from "./plugin-ui";

describe("linapro-tapcanvas-studio React plugin UI", () => {
  it("registers explicit lazy project and workspace pages", async () => {
    expect(definition.pages["/tapcanvas/projects"]).toMatchObject({ capabilities: [], surface: "page" });
    expect(definition.pages["/tapcanvas/studio"]).toMatchObject({ capabilities: [], surface: "workspace" });
    await expect(definition.pages["/tapcanvas/projects"]!.load()).resolves.toMatchObject({ default: expect.any(Function) });
    await expect(definition.pages["/tapcanvas/studio"]!.load()).resolves.toMatchObject({ default: expect.any(Function) });
  });

  it("ships matching English and Chinese bootstrap resources", () => {
    const english = enUS.plugin["linapro-tapcanvas-studio"];
    const chinese = zhCN.plugin["linapro-tapcanvas-studio"];
    expect(english.projects.title).toBe("Projects");
    expect(chinese.projects.title).toBe("项目");
    expect(english.studio.title).toBeTruthy();
    expect(chinese.studio.title).toBeTruthy();
  });

  it("ships a complete bilingual catalog for migrated canvas copy", () => {
    const english = enUS.plugin["linapro-tapcanvas-studio"].canvas.copy;
    const chinese = zhCN.plugin["linapro-tapcanvas-studio"].canvas.copy;
    const englishKeys = Object.keys(english).sort();
    const chineseKeys = Object.keys(chinese).sort();

    expect(englishKeys).toHaveLength(341);
    expect(chineseKeys).toEqual(englishKeys);
    expect(Object.values(english).every((message) => !/[\u3400-\u9fff]/u.test(message))).toBe(true);
    expect(Object.values(chinese).every((message) => /[\u3400-\u9fff]/u.test(message))).toBe(true);
  });
});
