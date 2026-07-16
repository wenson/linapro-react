import { render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const chart = vi.hoisted(() => ({
  dispose: vi.fn(), resize: vi.fn(), setOption: vi.fn(),
}));
const init = vi.hoisted(() => vi.fn(() => chart));
vi.mock("echarts/core", () => ({ init, use: vi.fn() }));
vi.mock("echarts/charts", () => ({ LineChart: {}, PieChart: {} }));
vi.mock("echarts/components", () => ({ GridComponent: {}, LegendComponent: {}, TooltipComponent: {} }));
vi.mock("echarts/renderers", () => ({ CanvasRenderer: {} }));

import { EChart } from "#/features/dashboard/echart";

class TestResizeObserver {
  static callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) { TestResizeObserver.callback = callback; }
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
}

afterEach(() => vi.clearAllMocks());

it("initializes, resizes, updates and disposes the ECharts instance", () => {
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  const { unmount } = render(<EChart ariaLabel="Chart" option={{ series: [] }} />);
  expect(init).toHaveBeenCalledOnce();
  expect(chart.setOption).toHaveBeenCalledOnce();
  TestResizeObserver.callback([], {} as ResizeObserver);
  expect(chart.resize).toHaveBeenCalledOnce();
  unmount();
  expect(chart.dispose).toHaveBeenCalledOnce();
  vi.unstubAllGlobals();
});
