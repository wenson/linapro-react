import { BarChart, LineChart, PieChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useRef } from "react";

echarts.use([
  CanvasRenderer,
  BarChart,
  GridComponent,
  LegendComponent,
  LineChart,
  PieChart,
  TooltipComponent,
]);

export function EChart({ ariaLabel, option }: { ariaLabel: string; option: EChartsCoreOption }) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }
    let chart: ReturnType<typeof echarts.init> | undefined;
    function renderWhenVisible(entries?: ResizeObserverEntry[]) {
      const rect = entries?.find((entry) => entry.target === element)?.contentRect
        ?? entries?.[0]?.contentRect
        ?? element!.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }
      if (!chart) {
        const dark = document.documentElement.classList.contains("dark")
          || document.body.getAttribute("theme-mode") === "dark";
        chart = echarts.init(element, dark ? "dark" : undefined, { renderer: "canvas" });
        chart.setOption(option, { notMerge: true });
        return;
      }
      chart.resize();
    }
    const resizeObserver = new ResizeObserver(renderWhenVisible);
    resizeObserver.observe(element);
    const themeObserver = new MutationObserver(() => {
      chart?.dispose();
      chart = undefined;
      renderWhenVisible();
    });
    themeObserver.observe(document.documentElement, { attributeFilter: ["class"], attributes: true });
    themeObserver.observe(document.body, { attributeFilter: ["theme-mode"], attributes: true });
    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
      chart?.dispose();
    };
  }, [option]);

  return <div aria-label={ariaLabel} className="dashboard-chart" ref={elementRef} role="img" />;
}
