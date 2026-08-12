import React from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { formatManwon, formatMonthLabel, formatPct } from "../lib/format";
import { getCategory, getYearColor } from "../lib/constants";

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
  const grouped = {};
  assets.forEach((a) => {
    const key = a.name.trim();
    if (!key) return;
    if (!grouped[key]) {
      grouped[key] = { name: key, value: 0, color: getCategory(a.category).color };
    }
    grouped[key].value += Number(a.value) || 0;
  });
  const data = Object.values(grouped)
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

function YearlyTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tt">
      <div className="chart-tt-label">{label}년</div>
      <div className="chart-tt-row"><span>달성률</span><span>{d.pct.toFixed(1)}%</span></div>
      <div className="chart-tt-row"><span>연말 자산</span><span>{formatManwon(d.total)}</span></div>
    </div>
  );
}

export function YearlyGoalChart({ data }) {
  if (data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-ring" />
        <p>스냅샷 기록이 쌓이면 연도별 달성률이 표시돼요.</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="year" tick={{ fontFamily: "IBM Plex Mono", fontSize: 12, fill: "var(--ink-soft)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
        <YAxis tickFormatter={(v) => `${v}%`} width={48} tick={{ fontFamily: "IBM Plex Mono", fontSize: 10, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
        <Tooltip content={<YearlyTooltip />} cursor={{ fill: "var(--paper)" }} />
        <Bar dataKey="pct" radius={[4, 4, 0, 0]} animationDuration={700} animationEasing="ease-out">
          {data.map((d, i) => <Cell key={d.year} fill={getYearColor(i)} />)}
        </Bar>
      </BarChart>
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

export function ExpenseBreakdown({ allocation }) {
  if (allocation.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-ring" />
        <p>이번 달 지출 항목이 없어요.</p>
      </div>
    );
  }
  const total = allocation.reduce((s, c) => s + c.value, 0);
  return (
    <div className="donut-wrap">
      <div className="donut-chart">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={allocation}
              dataKey="value"
              nameKey="label"
              innerRadius={56}
              outerRadius={82}
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
          <span className="donut-center-label">이번 달 지출</span>
          <span className="donut-center-value">{formatManwon(total)}</span>
        </div>
      </div>
      <div className="legend">
        {allocation.map((c) => (
          <div className="legend-row" key={c.key}>
            <span className="legend-dot" style={{ background: c.color }} />
            <span className="legend-label">{c.label}</span>
            <span className="legend-fill" />
            <span className="legend-value">{formatManwon(c.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CumulativeReturnTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tt">
      <div className="chart-tt-label">{formatMonthLabel(label)}</div>
      <div className="chart-tt-row">
        <span>누적 수익률</span>
        <span>{formatPct(payload[0].value)}</span>
      </div>
    </div>
  );
}

export function CumulativeReturnChart({ data }) {
  if (data.length < 2) {
    return (
      <div className="empty-state">
        <div className="empty-ring" />
        <p>스냅샷 2개 이상부터 누적 수익률을 볼 수 있어요.</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="returnFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2F6F4E" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2F6F4E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="month" tickFormatter={formatMonthLabel} tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "var(--ink-soft)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
        <YAxis tickFormatter={(v) => `${v}%`} width={48} tick={{ fontFamily: "IBM Plex Mono", fontSize: 10, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
        <Tooltip content={<CumulativeReturnTooltip />} />
        <Area
          type="monotone"
          dataKey="cumPct"
          stroke="var(--growth-green)"
          strokeWidth={2.5}
          fill="url(#returnFill)"
          animationDuration={900}
          animationEasing="ease-out"
          dot={{ r: 3, fill: "var(--growth-green)" }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MarketIndexTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tt">
      <div className="chart-tt-label">{label}</div>
      {payload.map((p) => (
        <div className="chart-tt-row" key={p.dataKey}>
          <span>{p.dataKey}</span>
          <span>{Number(p.value).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}</span>
        </div>
      ))}
    </div>
  );
}

export function MarketIndexChart({ data }) {
  if (data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-ring" />
        <p>아직 수집된 지수 데이터가 없어요. 자동 수집이 시작되면 여기 표시돼요.</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontFamily: "IBM Plex Mono", fontSize: 10, fill: "var(--ink-soft)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
        <YAxis yAxisId="sp500" tick={{ fontFamily: "IBM Plex Mono", fontSize: 10, fill: "var(--stamp-red)" }} axisLine={false} tickLine={false} width={56} />
        <YAxis yAxisId="kospi" orientation="right" tick={{ fontFamily: "IBM Plex Mono", fontSize: 10, fill: "var(--ink)" }} axisLine={false} tickLine={false} width={56} />
        <Tooltip content={<MarketIndexTooltip />} />
        <Line yAxisId="sp500" type="monotone" dataKey="SP500" stroke="var(--stamp-red)" strokeWidth={2} dot={false} animationDuration={700} />
        <Line yAxisId="kospi" type="monotone" dataKey="KOSPI" stroke="var(--ink)" strokeWidth={2} dot={false} animationDuration={700} />
      </LineChart>
    </ResponsiveContainer>
  );
}
