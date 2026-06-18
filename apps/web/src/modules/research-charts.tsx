import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import React from "react";
import type { ReactElement } from "react";
import type { ChartPanel, ResearchChartSuite } from "./research-chart-models";

export function renderResearchCharts(suite: ResearchChartSuite): ReactElement {
  return (
    <section aria-label="Research visualizations">
      <ChartSection title="Price and Volume" panel={suite.priceVolume}>
        {(data) => (
          <>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={data.points}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="price" />
                <YAxis yAxisId="volume" orientation="right" />
                <Tooltip />
                <Bar yAxisId="volume" dataKey="volume" name="Volume" fill="#334155" />
                <Line yAxisId="price" type="monotone" dataKey="close" name="Close" stroke="#2563eb" />
                <ReferenceLine yAxisId="price" y={data.entryZone.low} label="Entry Zone low" stroke="#16a34a" />
                <ReferenceLine yAxisId="price" y={data.entryZone.high} label="Entry Zone high" stroke="#16a34a" />
                <ReferenceLine yAxisId="price" y={data.stopLevel} label="Stop Level" stroke="#dc2626" />
                <ReferenceLine yAxisId="price" y={data.targetZone.low} label="Target Zone low" stroke="#f59e0b" />
                <ReferenceLine yAxisId="price" y={data.targetZone.high} label="Target Zone high" stroke="#f59e0b" />
                <Scatter yAxisId="price" name="Signal marker" data={data.signalMarkers} dataKey="price" fill="#a78bfa" />
              </ComposedChart>
            </ResponsiveContainer>
            <ul aria-label="Trade timing overlays">
              <li>Volume</li>
              <li>Entry Zone: {data.entryZone.low} - {data.entryZone.high}</li>
              <li>Stop Level: {data.stopLevel}</li>
              <li>Target Zone: {data.targetZone.low} - {data.targetZone.high}</li>
              {data.signalMarkers.map((marker) => (
                <li key={`${marker.date}-${marker.label}`}>Signal marker: {marker.label}</li>
              ))}
            </ul>
          </>
        )}
      </ChartSection>
      <ChartSection title="Technical Indicators" panel={suite.indicators}>
        {(data) => (
          <BarChart width={480} height={220} data={[data]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="rsi" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="rsi" fill="#0f766e" />
            <Bar dataKey="volumeSurge" fill="#7c3aed" />
          </BarChart>
        )}
      </ChartSection>
      <ChartSection title="Signal Contribution" panel={suite.contribution}>
        {(data) => (
          <BarChart width={520} height={220} data={data.segments}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#1d4ed8" />
          </BarChart>
        )}
      </ChartSection>
      <ChartSection title="Risk Profile" panel={suite.risk}>
        {(data) => (
          <RadarChart width={420} height={280} data={data.metrics}>
            <PolarGrid />
            <PolarAngleAxis dataKey="label" />
            <PolarRadiusAxis />
            <Radar dataKey="value" fill="#dc2626" fillOpacity={0.4} stroke="#dc2626" />
          </RadarChart>
        )}
      </ChartSection>
      <ChartSection title="Strategy Backtest" panel={suite.backtest}>
        {(data) => (
          <LineChart width={520} height={220} data={data.equityCurve}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#16a34a" />
          </LineChart>
        )}
      </ChartSection>
      <ChartSection title="Portfolio Exposure" panel={suite.portfolioExposure}>
        {(data) => (
          <BarChart width={420} height={220} data={data.weights}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#f59e0b" />
          </BarChart>
        )}
      </ChartSection>
    </section>
  );
}

function ChartSection<T>({
  title,
  panel,
  children,
}: {
  title: string;
  panel: ChartPanel<T>;
  children: (data: T) => ReactElement;
}): ReactElement {
  return (
    <section aria-label={title}>
      <h3>{title}</h3>
      {panel.state === "available" ? (
        <div className="chart-scroll">{children(panel.data)}</div>
      ) : (
        <p>{panel.reason}</p>
      )}
    </section>
  );
}
