"use client";

import type { ReactElement } from "react";
import { renderResearchCharts } from "../../../src/modules/research-charts";
import type { ResearchChartSuite } from "../../../src/modules/research-chart-models";

export function ResearchChartsClient({ charts }: { charts: ResearchChartSuite }): ReactElement {
  return renderResearchCharts(charts);
}
