import React, { useState } from "react";
import { TrendingUp, TrendingDown, Target, Check, Circle, Pencil, Plus, Trash2, ArrowUpRight, ArrowDownRight, Layers, CreditCard, Activity } from "lucide-react";
import { useData } from "../context/DataContext";
import { CATEGORIES, ASSET_MILESTONES, getYearColor } from "../lib/constants";
import { formatManwon, formatMonthLabel, formatPct, formatDate, currentMonth, aggregateCashflowByMonth, computeGaugeSegments, computeAnnualReport, getLiabilityRecurringExpenses, computeGoalTimeGauge } from "../lib/format";
import { useCountUp } from "../lib/useCountUp";
import { useFxRates } from "../lib/useFxRates";
import { useKstClock } from "../lib/useKstClock";
import { AllocationDonut, HoldingsBar, TrendArea } from "../components/charts";
import { GoalForm, SnapshotForm } from "../components/forms";
import MiniCalendar from "../components/MiniCalendar";
import MacroCalendarWidget, { getMacroEventDaysForMonth } from "../components/MacroCalendarWidget";
import NewsLinksWidget from "../components/NewsLinksWidget";
import Stamp from "../components/Stamp";
import PageSkeleton from "../components/PageSkeleton";

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
  const { assets, liabilities, snapshots, goal, cashflowItems, loading, error, saveGoal, saveSnapshot, deleteSnapshot } = useData();
  const { rates: fxRates } = useFxRates(["USD"]);
  const clock = useKstClock();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showSnapshotForm, setShowSnapshotForm] = useState(false);
  const [justSnapshotted, setJustSnapshotted] = useState(false);

  const realEstateTotal = assets.filter((a) => a.category === "realestate").reduce((s, a) => s + Number(a.value || 0), 0);
  const totalAssets = assets.reduce((s, a) => s + Number(a.value || 0), 0);
  const financialTotal = totalAssets - realEstateTotal;
  const totalLiabilities = liabilities.reduce((s, l) => s + Number(l.amount || 0), 0);
  const netWorth = totalAssets - totalLiabilities;
  const animatedTotal = useCountUp(netWorth);

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
  const timeGauge = goal ? computeGoalTimeGauge(goal.created_at, goal.target_date) : null;
  const realEstateTarget = goal?.real_estate_target || 0;
  const financialTarget = goal?.financial_target || 0;
  const realEstateSegments = computeGaugeSegments(snapshots, realEstateTarget, realEstateTotal, getYearColor, "real_estate_total");
  const financialSegments = computeGaugeSegments(snapshots, financialTarget, financialTotal, getYearColor, "financial_total");

  const monthlyCashflow = aggregateCashflowByMonth([...cashflowItems, ...getLiabilityRecurringExpenses(liabilities)]);

  const sums = {};
  assets.forEach((a) => { sums[a.category] = (sums[a.category] || 0) + Number(a.value || 0); });
  const allocTotal = Object.values(sums).reduce((s, v) => s + v, 0);
  const allocation = CATEGORIES
    .map((c) => ({ ...c, value: sums[c.key] || 0, pct: allocTotal > 0 ? ((sums[c.key] || 0) / allocTotal) * 100 : 0 }))
    .filter((c) => c.value > 0);

  // 핵심 지표 미니카드용
  const thisYearYoyPct = (() => {
    const report = computeAnnualReport(snapshots);
    const cur = report.find((r) => r.year === String(new Date().getFullYear()));
    return cur ? cur.yoyPct : null;
  })();
  const latestMonthCashflow = monthlyCashflow.length > 0 ? monthlyCashflow[monthlyCashflow.length - 1] : null;
  const monthlySavingsAmt = latestMonthCashflow ? latestMonthCashflow.income - latestMonthCashflow.expense : null;

  // 이달의 할 일
  const hasCashflowThisMonth = cashflowItems.some((c) => c.month === currentMonth());
  const todos = [
    { key: "snapshot", label: "이번 달 스냅샷 기록", done: hasSnapshotThisMonth, action: handleQuickSnapshot, actionLabel: "지금 기록" },
    { key: "cashflow", label: "이번 달 현금흐름 기록", done: hasCashflowThisMonth, href: "#/cashflow", actionLabel: "기록하러 가기" },
    { key: "goal", label: "목표 설정", done: !!goal, action: () => setShowGoalForm(true), actionLabel: "설정하기" },
  ];

  // 최근 활동 피드
  const recentActivity = [
    ...assets.map((a) => ({ id: `a-${a.id}`, type: "asset", text: `자산 추가 · ${a.name}`, amount: a.value, date: a.created_at })),
    ...liabilities.map((l) => ({ id: `l-${l.id}`, type: "liability", text: `부채 추가 · ${l.name}`, amount: -l.amount, date: l.created_at })),
    ...cashflowItems.map((c) => ({
      id: `c-${c.id}`,
      type: c.type,
      text: `${c.type === "income" ? "수입" : "지출"} 기록 · ${c.memo || formatMonthLabel(c.month)}`,
      amount: c.type === "income" ? c.amount : -c.amount,
      date: c.created_at,
    })),
  ]
    .filter((it) => it.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  async function handleQuickSnapshot() {
    await saveSnapshot(currentMonth(), totalAssets, realEstateTotal, financialTotal);
    setJustSnapshotted(true);
    setTimeout(() => setJustSnapshotted(false), 1800);
  }

  if (loading) return <PageSkeleton cards={4} hero />;

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-grid">
          <div className="hero-left">
            <div>
              <span className="eyebrow">PERSONAL ASSET PASSBOOK</span>
              <h1>개요</h1>
            </div>
            <div className="hero-main">
              <div className="hero-total">
                <span className="hero-total-label">순자산</span>
                <span className="hero-total-value">{formatManwon(animatedTotal)}</span>
                <span className="hero-breakdown">자산 {formatManwon(totalAssets)} · 부채 {formatManwon(totalLiabilities)}</span>
                {momChangePct !== null && (
                  <span className={`hero-change ${momChangePct >= 0 ? "pos" : "neg"}`}>
                    {momChangePct >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />} 자산 전월대비 {formatPct(momChangePct)}
                  </span>
                )}
              </div>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-label">목표까지</span>
                <span className="hero-stat-value">{daysLeft === null ? "-" : daysLeft >= 0 ? `D-${daysLeft}` : `${Math.abs(daysLeft)}일 지남`}</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-label">올해 순자산 증가율</span>
                <span className={`hero-stat-value ${thisYearYoyPct === null ? "" : thisYearYoyPct >= 0 ? "pos" : "neg"}`}>
                  {thisYearYoyPct === null ? "-" : formatPct(thisYearYoyPct)}
                </span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-label">이번 달 순저축액</span>
                <span className={`hero-stat-value ${monthlySavingsAmt === null ? "" : monthlySavingsAmt >= 0 ? "pos" : "neg"}`}>
                  {monthlySavingsAmt === null ? "-" : `${monthlySavingsAmt >= 0 ? "+" : ""}${formatManwon(monthlySavingsAmt)}`}
                </span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-label">원/달러 환율</span>
                <span className="hero-stat-value">{fxRates.USD ? `${fxRates.USD.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}원` : "-"}</span>
              </div>
            </div>
          </div>
          <div className="hero-top-right">
            <span className="hero-clock">{clock.timeStr}</span>
            <div className="hero-right-grid">
              <div className="hero-right-col">
                <MacroCalendarWidget />
                <NewsLinksWidget />
              </div>
              <MiniCalendar year={clock.year} month={clock.month} day={clock.day} eventDays={getMacroEventDaysForMonth(clock.year, clock.month)} />
            </div>
          </div>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="card-head">
          <h2>이달의 할 일</h2>
        </div>
        <div className="todo-list">
          {todos.map((t) => (
            <div className={`todo-item ${t.done ? "done" : ""}`} key={t.key}>
              <span className="todo-check">{t.done ? <Check size={13} /> : <Circle size={13} />}</span>
              <span className="todo-label">{t.label}</span>
              {!t.done && (
                t.href ? (
                  <a className="link-btn" href={t.href}>{t.actionLabel}</a>
                ) : (
                  <button className="link-btn" onClick={t.action}>{t.actionLabel}</button>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>목표 자산 도달률</h2>
          {goal && <span className="card-sub">{goal.label}</span>}
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
          <>
            {timeGauge && (
              <div className="time-gauge">
                <div className="time-gauge-head">
                  <span className="time-gauge-label">목표 기간</span>
                  <span className="time-gauge-days">{timeGauge.daysLeft >= 0 ? `D-${timeGauge.daysLeft}` : `${Math.abs(timeGauge.daysLeft)}일 지남`}</span>
                </div>
                <div className="time-gauge-track">
                  <div className="time-gauge-fill" style={{ width: `${timeGauge.remainingPct}%` }} />
                  {timeGauge.yearTicks.map((pos, i) => (
                    <div className="time-gauge-tick" style={{ left: `${pos}%` }} key={i} />
                  ))}
                </div>
                <div className="time-gauge-foot">
                  <span>설정일</span>
                  <span>{formatDate(goal.target_date)} 목표</span>
                </div>
              </div>
            )}
            <div className="gauge-group">
              <GaugeBlock label="부동산" total={realEstateTotal} target={realEstateTarget} segments={realEstateSegments} />
              <GaugeBlock label="금융자산" total={financialTotal} target={financialTarget} segments={financialSegments} />
            </div>
          </>
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
          <span className="card-sub">순자산 기준 구간별 달성 현황</span>
        </div>
        <div className="milestones">
          {ASSET_MILESTONES.map((m, i) => {
            const achieved = netWorth >= m;
            return (
              <div className={`milestone ${achieved ? "done" : ""}`} key={m}>
                <div className="milestone-dot">{achieved ? <Check size={14} /> : i + 1}</div>
                <span className="milestone-amount">{formatManwon(m)}</span>
                {!achieved && <span className="milestone-remain">{formatManwon(m - netWorth)} 남음</span>}
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

      <div className="card">
        <div className="card-head">
          <h2>최근 활동</h2>
          <span className="card-sub">최근 추가된 항목</span>
        </div>
        {recentActivity.length === 0 ? (
          <div className="empty-state">
              <div className="empty-ring"><Activity size={20} /></div>
            <p>아직 활동 내역이 없어요.</p>
          </div>
        ) : (
          <div className="activity-list">
            {recentActivity.map((it) => {
              const Icon = it.type === "asset" ? Layers : it.type === "liability" ? CreditCard : it.amount >= 0 ? ArrowUpRight : ArrowDownRight;
              return (
                <div className="activity-row" key={it.id}>
                  <span className={`activity-icon ${it.amount >= 0 ? "pos" : "neg"}`}><Icon size={14} /></span>
                  <span className="activity-text">{it.text}</span>
                  <span className={`activity-amount ${it.amount >= 0 ? "pos" : "neg"}`}>
                    {it.amount >= 0 ? "+" : ""}{formatManwon(it.amount)}
                  </span>
                  <span className="activity-date muted">{formatDate(it.date.slice(0, 10))}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
