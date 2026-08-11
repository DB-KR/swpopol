import React from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { formatManwon, formatMonthLabel } from "../lib/format";
import { getCategory } from "../lib/constants";

function PieTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tt">
      <div className="chart-tt-label">{d.label}</div>
      <div className="chart-tt-row">
        <span>{formatManwon(d.value)}</span>
        <span>{d.pct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function HoldingsTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tt">
      <div className="chart-tt-label">{d.name}</div>
      <div className="chart-tt-row"><span>{formatManwon(d.value)}</span></div>
    </div>
  );
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tt">
      <div className="chart-tt-label">{formatMonthLabel(label)}</div>
      <div className="chart-tt-row">
        <span>총자산</span>
        <span>{formatManwon(payload[0].value)}</span>
      </div>
    </div>
  );
}

function CashflowTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tt">
      <div className="chart-tt-label">{formatMonthLabel(label)}</div>
      {payload.map((p) => (
        <div className="chart-tt-row" key={p.dataKey}>
          <span>{p.dataKey === "income" ? "수입" : "지출"}</span>
          <span>{formatManwon(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function AllocationDonut({ allocation, totalAssets }) {
  if (allocation.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-ring" />
        <p>등록된 자산이 없어요.</p>
      </div>
    );
  }
  return (
    <div className="donut-wrap">
      <div className="donut-chart">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={allocation}
              dataKey="value"
              nameKey="label"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={3}
              stroke="none"
              animationDuration={700}
              animationEasing="ease-out"
            >
              {allocation.map((c) => <Cell key={c.key} fill={c.color} />)}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <span className="donut-center-label">총자산</span>
          <span className="donut-center-value">{formatManwon(totalAssets)}</span>
        </div>
      </div>
      <div className="legend">
        {allocation.map((c) => (
          <div className="legend-row" key={c.key}>
            <span className="legend-dot" style={{ background: c.color }} />
            <span className="legend-label">{c.label}</span>
            <span className="legend-fill" />
            <span className="legend-value">{c.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HoldingsBar({ assets }) {
  const data = [...assets]
    .map((a) => ({ name: a.name, value: Number(a.value) || 0, color: getCategory(a.category).color }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-ring" />
        <p>등록된 자산이 없어요.</p>
      </div>
    );
  }

  const height = Math.max(180, data.length * 38);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 4 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--line)" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => formatManwon(v)} tick={{ fontFamily: "IBM Plex Mono", fontSize: 10, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={96} tick={{ fontFamily: "Noto Sans KR", fontSize: 12, fill: "var(--ink)" }} axisLine={false} tickLine={false} />
        <Tooltip content={<HoldingsTooltip />} cursor={{ fill: "var(--paper)" }} />
        <Bar dataKey="value" radius={[0, 3, 3, 0]} animationDuration={700} animationEasing="ease-out">
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendArea({ data }) {
  if (data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-ring" />
        <p>기록된 스냅샷이 없어요.</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2F6F4E" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2F6F4E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="month" tickFormatter={formatMonthLabel} tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "var(--ink-soft)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
        <YAxis tickFormatter={(v) => formatManwon(v)} width={80} tick={{ fontFamily: "IBM Plex Mono", fontSize: 10, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
        <Tooltip content={<TrendTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--growth-green)"
          strokeWidth={2.5}
          fill="url(#trendFill)"
          animationDuration={900}
          animationEasing="ease-out"
          dot={{ r: 3, fill: "var(--growth-green)" }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CashflowChart({ data }) {
  if (data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-ring" />
        <p>월별 수입·지출 기록이 없어요.</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="month" tickFormatter={formatMonthLabel} tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "var(--ink-soft)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
        <YAxis tickFormatter={(v) => formatManwon(v)} width={80} tick={{ fontFamily: "IBM Plex Mono", fontSize: 10, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
        <Tooltip content={<CashflowTooltip />} />
        <Bar dataKey="income" fill="var(--growth-green)" radius={[2, 2, 0, 0]} animationDuration={700} animationEasing="ease-out" />
        <Bar dataKey="expense" fill="var(--stamp-red)" radius={[2, 2, 0, 0]} animationDuration={700} animationEasing="ease-out" />
      </BarChart>
    </ResponsiveContainer>
  );
}
