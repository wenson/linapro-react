import { render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const chart = vi.hoisted(() => ({
  dispose: vi.fn(), resize: vi.fn(), setOption: vi.fn(),
}));
const init = vi.hoisted(() => vi.fn(() => chart));
const use = vi.hoisted(() => vi.fn());
const chartModules = vi.hoisted(() => ({ BarChart: {}, LineChart: {}, PieChart: {} }));
vi.mock("echarts/core", () => ({ init, use }));
vi.mock("echarts/charts", () => chartModules);
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
  expect(use).toHaveBeenCalledWith(expect.arrayContaining([chartModules.BarChart]));
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  const { unmount } = render(<EChart ariaLabel="Chart" option={{ series: [] }} />);
  expect(init).not.toHaveBeenCalled();
  TestResizeObserver.callback([
    { contentRect: { height: 180, width: 320 } } as ResizeObserverEntry,
  ], {} as ResizeObserver);
  expect(init).toHaveBeenCalledOnce();
  expect(chart.setOption).toHaveBeenCalledOnce();
  TestResizeObserver.callback([
    { contentRect: { height: 180, width: 320 } } as ResizeObserverEntry,
  ], {} as ResizeObserver);
  expect(chart.resize).toHaveBeenCalledOnce();
  unmount();
  expect(chart.dispose).toHaveBeenCalledOnce();
  vi.unstubAllGlobals();
});
