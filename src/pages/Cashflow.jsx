import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useData } from "../context/DataContext";
import { formatManwon, formatMonthLabel } from "../lib/format";
import { CashflowChart } from "../components/charts";
import { CashflowForm } from "../components/forms";

export default function Cashflow() {
  const { cashflow, loading, addCashflow, deleteCashflow } = useData();
  const [showForm, setShowForm] = useState(false);

  const cashflowSorted = [...cashflow].sort((a, b) => a.month.localeCompare(b.month));
  const savingsRate = (() => {
    if (cashflowSorted.length === 0) return null;
    const latest = cashflowSorted[cashflowSorted.length - 1];
    if (!latest.income) return null;
    return ((latest.income - latest.expense) / latest.income) * 100;
  })();

  if (loading) return <div className="loading-screen">불러오는 중…</div>;

  return (
    <div className="page">
      <div className="card">
        <div className="card-head">
          <h2>월별 현금흐름 · 저축률</h2>
          <span className="card-sub">{savingsRate === null ? "" : `최근 저축률 ${savingsRate.toFixed(1)}%`}</span>
        </div>

        <CashflowChart data={cashflowSorted} />

        <div className="snapshot-actions">
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            <Plus size={14} /> 월별 기록 추가
          </button>
        </div>

        {showForm && (
          <CashflowForm
            onSubmit={async (f) => { await addCashflow(f); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {cashflowSorted.length > 0 && (
          <div className="mini-list">
            {[...cashflowSorted].reverse().map((c) => (
              <div className="mini-list-row" key={c.id}>
                <span>{formatMonthLabel(c.month)}</span>
                <span>수입 {formatManwon(c.income)} · 지출 {formatManwon(c.expense)}</span>
                <button className="icon-btn" onClick={() => deleteCashflow(c.id)} aria-label="기록 삭제">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
