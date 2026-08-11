import React, { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useData } from "../context/DataContext";
import { formatManwon, formatMonthLabel, currentMonth, aggregateCashflowByMonth } from "../lib/format";
import { getIncomeCategory, getExpenseCategory } from "../lib/constants";
import { CashflowChart, ExpenseBreakdown } from "../components/charts";
import { CashflowItemForm } from "../components/forms";

export default function Cashflow() {
  const { cashflowItems, loading, addCashflowItem, updateCashflowItem, deleteCashflowItem } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const monthly = aggregateCashflowByMonth(cashflowItems);
  const latestMonth = monthly.length > 0 ? monthly[monthly.length - 1].month : currentMonth();

  const latest = monthly.find((m) => m.month === latestMonth);
  const savingsRate = latest && latest.income > 0 ? ((latest.income - latest.expense) / latest.income) * 100 : null;

  const expenseAllocation = (() => {
    const sums = {};
    cashflowItems
      .filter((it) => it.type === "expense" && it.month === latestMonth)
      .forEach((it) => { sums[it.category] = (sums[it.category] || 0) + Number(it.amount || 0); });
    return Object.entries(sums)
      .map(([key, value]) => ({ key, value, label: getExpenseCategory(key).label, color: getExpenseCategory(key).color }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  })();

  const itemsSorted = [...cashflowItems].sort((a, b) => b.month.localeCompare(a.month) || b.created_at.localeCompare(a.created_at));

  if (loading) return <div className="loading-screen">불러오는 중…</div>;

  return (
    <div className="page">
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
      </div>

      <div className="card">
        <div className="card-head">
          <h2>고정지출 구성</h2>
          <span className="card-sub">{formatMonthLabel(latestMonth)} 기준</span>
        </div>
        <ExpenseBreakdown allocation={expenseAllocation} />
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
                          {it.type === "income" ? "수입" : "지출"} · {cat.label}
                        </span>
                      );
                    })()}
                  </span>
                  <span className="muted">{it.memo || "-"}</span>
                  <span className={`num ${it.type === "income" ? "pos" : "neg"}`}>
                    {it.type === "income" ? "+" : "-"}{formatManwon(it.amount)}
                  </span>
                  <span className="row-actions">
                    <button className="icon-btn" onClick={() => { setEditingId(it.id); setShowForm(false); }} aria-label="수정"><Pencil size={13} /></button>
                    <button className="icon-btn" onClick={() => deleteCashflowItem(it.id)} aria-label="삭제"><Trash2 size={13} /></button>
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
