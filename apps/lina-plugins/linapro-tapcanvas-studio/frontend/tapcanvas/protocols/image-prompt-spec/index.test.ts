import imagePromptSpecModule, {
  compileImagePromptSpecV2,
  parseImagePromptSpecV2,
} from "./index.js";

describe("image prompt spec module", () => {
  it("exposes matching ESM default and named exports", () => {
    expect(imagePromptSpecModule.compileImagePromptSpecV2).toBe(
      compileImagePromptSpecV2,
    );
    expect(imagePromptSpecModule.parseImagePromptSpecV2).toBe(
      parseImagePromptSpecV2,
    );
  });

  it("parses and compiles a v2 prompt", () => {
    const parsed = parseImagePromptSpecV2({
      version: "v2",
      shotIntent: "Hero enters the frame",
      spatialLayout: ["Hero in foreground"],
      cameraPlan: ["Medium shot"],
      lightingPlan: ["Soft key light"],
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok || !parsed.value) {
      throw new Error("Expected a parsed image prompt spec");
    }

    expect(compileImagePromptSpecV2(parsed.value)).toContain(
      "画面目标：Hero enters the frame",
    );
  });
});
