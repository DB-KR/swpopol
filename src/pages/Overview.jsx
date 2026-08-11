import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, Target, Check } from "lucide-react";
import { useData } from "../context/DataContext";
import { CATEGORIES, ASSET_MILESTONES, getYearColor } from "../lib/constants";
import { formatManwon, formatPct, currentMonth, aggregateCashflowByMonth, computeGaugeSegments } from "../lib/format";
import { useCountUp } from "../lib/useCountUp";
import { useFxRates } from "../lib/useFxRates";
import { AllocationDonut, HoldingsBar } from "../components/charts";

export default function Overview() {
  const { assets, snapshots, goal, cashflowItems, loading, error } = useData();
  const { rates: fxRates } = useFxRates(["USD"]);

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

  const combinedTarget = goal ? (goal.real_estate_target || 0) + (goal.financial_target || 0) : 0;
  const goalProgressPct = combinedTarget > 0 ? (totalAssets / combinedTarget) * 100 : null;
  const goalRemaining = combinedTarget > 0 ? Math.max(0, combinedTarget - totalAssets) : null;
  const gaugeSegments = goal ? computeGaugeSegments(snapshots, combinedTarget, totalAssets, getYearColor) : [];

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
            {savingsRate !== null && <span className="pill">이번달 저축률 {savingsRate.toFixed(0)}%</span>}
            {fxRates.USD && <span className="pill">원/달러 {fxRates.USD.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}원</span>}
          </div>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="card-head">
          <h2>목표 자산 도달률</h2>
          <span className="card-sub">{goal ? goal.label : ""}</span>
        </div>

        {!goal ? (
          <div className="empty-state">
            <div className="empty-ring"><Target size={20} /></div>
            <p>목표를 설정하면 도달률이 여기 표시돼요.</p>
            <Link to="/goal" className="btn-primary">목표 설정하러 가기</Link>
          </div>
        ) : (
          <div className="gauge">
            <div className="gauge-head">
              <span className="gauge-label">{formatManwon(totalAssets)} / {formatManwon(combinedTarget)}</span>
              <span className={`gauge-pct ${(goalProgressPct || 0) >= 100 ? "pos" : ""}`}>{(goalProgressPct || 0).toFixed(1)}%</span>
            </div>
            <div className="gauge-track">
              {gaugeSegments.map((seg) => (
                <div
                  key={seg.year}
                  className="gauge-segment"
                  style={{ left: `${seg.from}%`, width: `${seg.to - seg.from}%`, background: seg.color }}
                  title={`${seg.year}년`}
                />
              ))}
              {[25, 50, 75].map((t) => <div className="gauge-tick" style={{ left: `${t}%` }} key={t} />)}
            </div>
            <div className="gauge-legend">
              {gaugeSegments.map((seg) => (
                <span className="gauge-legend-item" key={seg.year}>
                  <span className="gauge-legend-dot" style={{ background: seg.color }} />
                  {seg.year}
                </span>
              ))}
            </div>
            <div className="gauge-foot">
              <span>0원</span>
              <span>{goalRemaining > 0 ? `목표까지 ${formatManwon(goalRemaining)} 남음` : "목표 달성!"}</span>
              <span>{formatManwon(combinedTarget)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>자산 마일스톤</h2>
          <span className="card-sub">구간별 달성 현황</span>
        </div>
        <div className="milestones">
          {ASSET_MILESTONES.map((m, i) => {
            const achieved = totalAssets >= m;
            return (
              <div className={`milestone ${achieved ? "done" : ""}`} key={m}>
                <div className="milestone-dot">{achieved ? <Check size={14} /> : i + 1}</div>
                <span className="milestone-amount">{formatManwon(m)}</span>
                {!achieved && <span className="milestone-remain">{formatManwon(m - totalAssets)} 남음</span>}
              </div>
            );
          })}
        </div>
      </div>

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
