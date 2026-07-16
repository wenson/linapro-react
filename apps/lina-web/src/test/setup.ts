import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, vi } from "vitest";

import enUSMessages from "#/locales/en-US/app.json";
import { runtimeI18n } from "#/runtime/i18n";

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
    writable: true,
  });
}

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  value: vi.fn(() => ({
    fillRect: vi.fn(),
    fillStyle: "",
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([0, 0, 0, 0]) })),
  })),
});

class TestResizeObserver implements ResizeObserver {
  disconnect(): void {}
  observe(): void {}
  unobserve(): void {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  configurable: true,
  value: TestResizeObserver,
  writable: true,
});

Object.defineProperty(Range.prototype, "getBoundingClientRect", {
  configurable: true,
  value: vi.fn(() => ({
    bottom: 0, height: 0, left: 0, right: 0, toJSON: () => ({}), top: 0, width: 0, x: 0, y: 0,
  })),
});

beforeAll(async () => {
  if (!runtimeI18n.isInitialized) {
    await runtimeI18n.init({
      fallbackLng: "en-US",
      lng: "en-US",
      resources: {
        "en-US": { translation: enUSMessages },
      },
    });
  }
});

beforeEach(async () => {
  await runtimeI18n.changeLanguage("en-US");
  document.documentElement.lang = "en-US";
});

afterEach(() => {
  cleanup();
});
