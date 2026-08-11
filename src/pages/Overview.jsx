import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useData } from "../context/DataContext";
import { CATEGORIES } from "../lib/constants";
import { formatManwon, formatPct, currentMonth, aggregateCashflowByMonth } from "../lib/format";
import { useCountUp } from "../lib/useCountUp";
import { AllocationDonut, HoldingsBar } from "../components/charts";

export default function Overview() {
  const { assets, snapshots, goal, cashflowItems, loading, error } = useData();

  const totalAssets = assets.reduce((s, a) => s + Number(a.value || 0), 0);
  const animatedTotal = useCountUp(totalAssets);

  const trendData = [...snapshots].sort((a, b) => a.month.localeCompare(b.month));
  const momChangePct = (() => {
    if (trendData.length === 0) return null;
    const cm = currentMonth();
    const prior = trendData.filter((t) => t.month !== cm);
    const base = prior.length ? prior[prior.length - 1].total : trendData[0].total;
    if (!base) return null;
    return ((totalAssets - base) / base) * 100;
  })();

  const goalProgressPct = goal && goal.target_amount > 0 ? (totalAssets / goal.target_amount) * 100 : null;

  const monthlyCashflow = aggregateCashflowByMonth(cashflowItems);
  const savingsRate = (() => {
    if (monthlyCashflow.length === 0) return null;
    const latest = monthlyCashflow[monthlyCashflow.length - 1];
    if (!latest.income) return null;
    return ((latest.income - latest.expense) / latest.income) * 100;
  })();

  const sums = {};
  assets.forEach((a) => { sums[a.category] = (sums[a.category] || 0) + Number(a.value || 0); });
  const allocTotal = Object.values(sums).reduce((s, v) => s + v, 0);
  const allocation = CATEGORIES
    .map((c) => ({ ...c, value: sums[c.key] || 0, pct: allocTotal > 0 ? ((sums[c.key] || 0) / allocTotal) * 100 : 0 }))
    .filter((c) => c.value > 0);

  if (loading) return <div className="loading-screen">불러오는 중…</div>;

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-top">
          <div>
            <span className="eyebrow">PERSONAL ASSET PASSBOOK</span>
            <h1>개요</h1>
          </div>
        </div>
        <div className="hero-main">
          <div className="hero-total">
            <span className="hero-total-label">총자산</span>
            <span className="hero-total-value">{formatManwon(animatedTotal)}</span>
            {momChangePct !== null && (
              <span className={`hero-change ${momChangePct >= 0 ? "pos" : "neg"}`}>
                {momChangePct >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />} 전월대비 {formatPct(momChangePct)}
              </span>
            )}
          </div>
          <div className="hero-pills">
            {goal && <span className="pill">목표 진행률 {Math.min(100, goalProgressPct || 0).toFixed(0)}%</span>}
            {savingsRate !== null && <span className="pill">이번달 저축률 {savingsRate.toFixed(0)}%</span>}
          </div>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h2>자산 배분</h2>
            <span className="card-sub">카테고리별 구성 비율</span>
          </div>
          <AllocationDonut allocation={allocation} totalAssets={totalAssets} />
        </div>
        <div className="card">
          <div className="card-head">
            <h2>구성종목</h2>
            <span className="card-sub">평가금액 상위 종목</span>
          </div>
          <HoldingsBar assets={assets} />
        </div>
      </div>
    </div>
  );
}
