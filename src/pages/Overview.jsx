import React, { useState } from "react";
import { TrendingUp, TrendingDown, Target, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useData } from "../context/DataContext";
import { CATEGORIES, ASSET_MILESTONES, getYearColor } from "../lib/constants";
import { formatManwon, formatMonthLabel, formatPct, currentMonth, aggregateCashflowByMonth, computeGaugeSegments } from "../lib/format";
import { useCountUp } from "../lib/useCountUp";
import { useFxRates } from "../lib/useFxRates";
import { AllocationDonut, HoldingsBar, TrendArea } from "../components/charts";
import { GoalForm, SnapshotForm } from "../components/forms";
import Stamp from "../components/Stamp";

function GaugeBlock({ label, total, target, segments }) {
  const pct = target > 0 ? (total / target) * 100 : null;
  const remaining = target > 0 ? Math.max(0, target - total) : null;

  return (
    <div className="gauge-block">
      <div className="gauge-head">
        <span className="gauge-label">{label} · {formatManwon(total)} / {formatManwon(target)}</span>
        <span className={`gauge-pct ${(pct || 0) >= 100 ? "pos" : ""}`}>{(pct || 0).toFixed(1)}%</span>
      </div>
      <div className="gauge-track">
        {segments.map((seg) => (
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
        {segments.map((seg) => (
          <span className="gauge-legend-item" key={seg.year}>
            <span className="gauge-legend-dot" style={{ background: seg.color }} />
            {seg.year}
          </span>
        ))}
      </div>
      <div className="gauge-foot">
        <span>0원</span>
        <span>{remaining > 0 ? `목표까지 ${formatManwon(remaining)} 남음` : target > 0 ? "목표 달성!" : ""}</span>
        <span>{formatManwon(target)}</span>
      </div>
    </div>
  );
}

export default function Overview() {
  const { assets, snapshots, goal, cashflowItems, loading, error, saveGoal, saveSnapshot, deleteSnapshot } = useData();
  const { rates: fxRates } = useFxRates(["USD"]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showSnapshotForm, setShowSnapshotForm] = useState(false);
  const [justSnapshotted, setJustSnapshotted] = useState(false);

  const realEstateTotal = assets.filter((a) => a.category === "realestate").reduce((s, a) => s + Number(a.value || 0), 0);
  const totalAssets = assets.reduce((s, a) => s + Number(a.value || 0), 0);
  const financialTotal = totalAssets - realEstateTotal;
  const animatedTotal = useCountUp(totalAssets);

  const trendData = [...snapshots].sort((a, b) => a.month.localeCompare(b.month));
  const hasSnapshotThisMonth = trendData.some((s) => s.month === currentMonth());
  const momChangePct = (() => {
    if (trendData.length === 0) return null;
    const cm = currentMonth();
    const prior = trendData.filter((t) => t.month !== cm);
    const base = prior.length ? prior[prior.length - 1].total : trendData[0].total;
    if (!base) return null;
    return ((totalAssets - base) / base) * 100;
  })();

  const daysLeft = goal && goal.target_date ? Math.ceil((new Date(goal.target_date) - new Date()) / 86400000) : null;
  const realEstateTarget = goal?.real_estate_target || 0;
  const financialTarget = goal?.financial_target || 0;
  const realEstateSegments = computeGaugeSegments(snapshots, realEstateTarget, realEstateTotal, getYearColor, "real_estate_total");
  const financialSegments = computeGaugeSegments(snapshots, financialTarget, financialTotal, getYearColor, "financial_total");

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

  async function handleQuickSnapshot() {
    await saveSnapshot(currentMonth(), totalAssets, realEstateTotal, financialTotal);
    setJustSnapshotted(true);
    setTimeout(() => setJustSnapshotted(false), 1800);
  }

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
          {goal && (
            <span className="card-sub">
              {goal.label}
              {daysLeft !== null && ` · ${daysLeft >= 0 ? `D-${daysLeft}` : `${Math.abs(daysLeft)}일 지남`}`}
            </span>
          )}
          {goal && !showGoalForm && (
            <button className="link-btn" onClick={() => setShowGoalForm(true)}><Pencil size={12} /> 수정</button>
          )}
        </div>

        {!goal ? (
          showGoalForm ? (
            <GoalForm onSubmit={async (f) => { await saveGoal(f); setShowGoalForm(false); }} onCancel={() => setShowGoalForm(false)} />
          ) : (
            <div className="empty-state">
              <div className="empty-ring"><Target size={20} /></div>
              <p>목표를 설정하면 도달률이 여기 표시돼요.</p>
              <button className="btn-primary" onClick={() => setShowGoalForm(true)}><Plus size={14} /> 목표 설정하기</button>
            </div>
          )
        ) : showGoalForm ? (
          <GoalForm initial={goal} onSubmit={async (f) => { await saveGoal(f); setShowGoalForm(false); }} onCancel={() => setShowGoalForm(false)} />
        ) : (
          <div className="gauge-group">
            <GaugeBlock label="부동산" total={realEstateTotal} target={realEstateTarget} segments={realEstateSegments} />
            <GaugeBlock label="금융자산" total={financialTotal} target={financialTarget} segments={financialSegments} />
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>자산 증감 추이</h2>
          <span className="card-sub">스냅샷을 기록하면 위 게이지의 연도별 색상에도 반영돼요</span>
        </div>

        <TrendArea data={trendData} />

        <div className="snapshot-actions">
          <button className="btn-primary" onClick={handleQuickSnapshot}>
            <Plus size={14} /> {hasSnapshotThisMonth ? "이번 달 스냅샷 업데이트" : "이번 달 스냅샷 기록"}
          </button>
          <button className="btn-ghost" onClick={() => setShowSnapshotForm((v) => !v)}>다른 달 기록</button>
          {justSnapshotted && <Stamp text="기록완료" />}
        </div>

        {showSnapshotForm && (
          <SnapshotForm
            defaultRealEstate={realEstateTotal}
            defaultFinancial={financialTotal}
            onSubmit={async (m, t, re, fi) => { await saveSnapshot(m, t, re, fi); setShowSnapshotForm(false); }}
            onCancel={() => setShowSnapshotForm(false)}
          />
        )}

        {trendData.length > 0 && (
          <div className="mini-list">
            {[...trendData].reverse().map((s) => (
              <div className="mini-list-row" key={s.month}>
                <span>{formatMonthLabel(s.month)}</span>
                <span>{formatManwon(s.total)}</span>
                <button className="icon-btn" onClick={() => deleteSnapshot(s.month)} aria-label="스냅샷 삭제">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
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
