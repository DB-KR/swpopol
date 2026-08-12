import React, { useState } from "react";
import { Plus, Trash2, Pencil, TrendingUp, TrendingDown } from "lucide-react";
import { useData } from "../context/DataContext";
import { formatManwon, formatMonthLabel, formatPct, currentMonth, aggregateCashflowByMonth, getLiabilityRecurringExpenses } from "../lib/format";
import { getIncomeCategory, getExpenseCategory } from "../lib/constants";
import { CashflowChart, ExpenseBreakdown, SavingsRateChart } from "../components/charts";
import { CashflowItemForm } from "../components/forms";

function matchesFilter(it, mode) {
  if (mode === "all") return true;
  if (mode === "recurring") return !!it.is_recurring;
  return !it.is_recurring;
}

export default function Cashflow() {
  const { liabilities, cashflowItems, loading, error, addCashflowItem, updateCashflowItem, deleteCashflowItem } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterMode, setFilterMode] = useState("all"); // all | recurring | single
  const [selectedMonth, setSelectedMonth] = useState(null); // null이면 "최근 달" 자동 선택

  const liabilityExpenses = getLiabilityRecurringExpenses(liabilities);
  const effectiveItems = [...cashflowItems, ...liabilityExpenses];

  const monthly = aggregateCashflowByMonth(effectiveItems);
  const latestMonth = monthly.length > 0 ? monthly[monthly.length - 1].month : currentMonth();
  const displayMonth = selectedMonth || latestMonth;
  const isThisMonth = displayMonth === currentMonth();

  const availableMonths = (() => {
    const set = new Set(monthly.map((m) => m.month));
    set.add(currentMonth());
    return [...set].sort().reverse();
  })();

  const latest = monthly.find((m) => m.month === latestMonth);
  const savingsRate = latest && latest.income > 0 ? ((latest.income - latest.expense) / latest.income) * 100 : null;

  const displayData = monthly.find((m) => m.month === displayMonth);
  const priorMonths = monthly.filter((m) => m.month < displayMonth);
  const prevMonthData = priorMonths.length > 0 ? priorMonths[priorMonths.length - 1] : null;
  const expenseDiff = displayData && prevMonthData ? displayData.expense - prevMonthData.expense : null;
  const expenseDiffPct = displayData && prevMonthData && prevMonthData.expense > 0
    ? ((displayData.expense - prevMonthData.expense) / prevMonthData.expense) * 100
    : null;

  const savingsRateSeries = monthly
    .filter((m) => m.income > 0)
    .map((m) => ({ month: m.month, rate: ((m.income - m.expense) / m.income) * 100 }));

  const expenseAllocation = (() => {
    const sums = {};
    effectiveItems
      .filter((it) => it.type === "expense" && it.month === displayMonth && matchesFilter(it, filterMode))
      .forEach((it) => { sums[it.category] = (sums[it.category] || 0) + Number(it.amount || 0); });
    return Object.entries(sums)
      .map(([key, value]) => ({ key, value, label: getExpenseCategory(key).label, color: getExpenseCategory(key).color }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  })();

  const itemsSorted = effectiveItems
    .filter((it) => matchesFilter(it, filterMode))
    .sort((a, b) => b.month.localeCompare(a.month) || String(b.created_at).localeCompare(String(a.created_at)));

  if (loading) return <div className="loading-screen">불러오는 중…</div>;

  return (
    <div className="page">
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="card-head">
          <h2>월별 현금흐름 · 저축률</h2>
          <span className="card-sub">{savingsRate === null ? "" : `${formatMonthLabel(latestMonth)} 저축률 ${savingsRate.toFixed(1)}%`}</span>
        </div>

        <CashflowChart data={monthly} />

        <div className="snapshot-actions">
          <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null); }}>
            <Plus size={14} /> 항목 추가
          </button>
        </div>

        {showForm && (
          <CashflowItemForm
            onSubmit={async (f) => { await addCashflowItem(f); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {liabilityExpenses.length > 0 && (
          <p className="form-hint" style={{ marginTop: 12 }}>
            부채의 월 상환액 {liabilityExpenses.length}건이 이번 달 지출에 "대출상환" 고정지출로 자동 반영되고 있어요.
          </p>
        )}
      </div>

      <div className="tab-row">
        <button className={`tab-btn ${filterMode === "all" ? "active" : ""}`} onClick={() => setFilterMode("all")}>전체</button>
        <button className={`tab-btn ${filterMode === "recurring" ? "active" : ""}`} onClick={() => setFilterMode("recurring")}>고정지출</button>
        <button className={`tab-btn ${filterMode === "single" ? "active" : ""}`} onClick={() => setFilterMode("single")}>단일지출</button>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>{isThisMonth ? "이번 달 지출" : `${formatMonthLabel(displayMonth)} 지출`}</h2>
          <select className="month-select" value={displayMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {availableMonths.map((m) => (
              <option key={m} value={m}>{formatMonthLabel(m)}{m === currentMonth() ? " (이번 달)" : ""}</option>
            ))}
          </select>
        </div>
        {filterMode === "all" && expenseDiff !== null && (
          <p className={`form-hint ${expenseDiff > 0 ? "neg" : expenseDiff < 0 ? "pos" : ""}`} style={{ marginBottom: 10 }}>
            {expenseDiff === 0 ? (
              "전월과 지출이 같아요"
            ) : (
              <>
                {expenseDiff > 0 ? <TrendingUp size={12} style={{ verticalAlign: -1 }} /> : <TrendingDown size={12} style={{ verticalAlign: -1 }} />}{" "}
                전월대비 {formatManwon(Math.abs(expenseDiff))} {expenseDiff > 0 ? "더 썼어요" : "덜 썼어요"}
                {expenseDiffPct !== null && ` (${formatPct(expenseDiffPct)})`}
              </>
            )}
          </p>
        )}
        <ExpenseBreakdown allocation={expenseAllocation} />
      </div>

      <div className="card">
        <div className="card-head">
          <h2>저축률 추이</h2>
          <span className="card-sub">월별 (수입-지출)/수입</span>
        </div>
        <SavingsRateChart data={savingsRateSeries} />
      </div>

      <div className="card">
        <div className="card-head">
          <h2>현금흐름 내역</h2>
        </div>

        {itemsSorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-ring" />
            <p>아직 기록된 항목이 없어요. 월급이나 생활비부터 추가해보세요.</p>
          </div>
        ) : (
          <div className="ledger-table">
            <div className="ledger-row ledger-head">
              <span>월</span><span>구분</span><span>메모</span><span className="num">금액</span><span></span>
            </div>
            {itemsSorted.map((it) =>
              editingId === it.id ? (
                <div className="ledger-row-edit" key={it.id}>
                  <CashflowItemForm
                    initial={it}
                    onSubmit={async (f) => { await updateCashflowItem(it.id, f); setEditingId(null); }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div className="ledger-row" key={it.id}>
                  <span className="muted">{formatMonthLabel(it.month)}</span>
                  <span>
                    {(() => {
                      const cat = it.type === "income" ? getIncomeCategory(it.category) : getExpenseCategory(it.category);
                      return (
                        <span className="tag" style={{ color: cat.color, borderColor: cat.color }}>
                          {it.type === "income" ? "수입" : "지출"} · {cat.label}{it.is_recurring ? " · 고정" : ""}
                        </span>
                      );
                    })()}
                  </span>
                  <span className="muted">{it.memo || "-"}{it.virtual ? " (자동)" : ""}</span>
                  <span className={`num ${it.type === "income" ? "pos" : "neg"}`}>
                    {it.type === "income" ? "+" : "-"}{formatManwon(it.amount)}
                  </span>
                  <span className="row-actions">
                    {!it.virtual && (
                      <>
                        <button className="icon-btn" onClick={() => { setEditingId(it.id); setShowForm(false); }} aria-label="수정"><Pencil size={13} /></button>
                        <button className="icon-btn" onClick={() => deleteCashflowItem(it.id)} aria-label="삭제"><Trash2 size={13} /></button>
                      </>
                    )}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
