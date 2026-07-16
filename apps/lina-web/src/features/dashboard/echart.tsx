import { LineChart, PieChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useRef } from "react";

echarts.use([
  CanvasRenderer,
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
    const chart = echarts.init(
      element,
      document.body.getAttribute("theme-mode") === "dark" ? "dark" : undefined,
      { renderer: "canvas" },
    );
    chart.setOption(option, { notMerge: true });
    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(element);
    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [option]);

  return <div aria-label={ariaLabel} className="dashboard-chart" ref={elementRef} role="img" />;
}
