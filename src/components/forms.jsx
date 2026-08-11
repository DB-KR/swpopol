import React, { useState } from "react";
import { CATEGORIES } from "../lib/constants";
import { currentMonth } from "../lib/format";

export function AssetForm({ initial, onSubmit, onCancel }) {
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0].key);
  const [name, setName] = useState(initial?.name || "");
  const [value, setValue] = useState(initial?.value ?? "");
  const [memo, setMemo] = useState(initial?.memo || "");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || value === "") return;
    setSaving(true);
    await onSubmit({ category, name, value, memo });
    setSaving(false);
  }

  return (
    <form className="ledger-form" onSubmit={submit}>
      <div className="form-row">
        <label>
          구분
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </label>
        <label>
          자산명
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 삼성전자, 청약저축" required />
        </label>
      </div>
      <div className="form-row">
        <label>
          평가금액 (만원)
          <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="예: 1500" min="0" step="1" required />
        </label>
        <label>
          메모 (선택)
          <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: 증권사, 계좌 등" />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>취소</button>
        <button type="submit" className="btn-primary" disabled={saving}>{initial ? "수정 완료" : "자산 추가"}</button>
      </div>
    </form>
  );
}

export function GoalForm({ initial, onSubmit, onCancel }) {
  const [label, setLabel] = useState(initial?.label || "");
  const [targetAmount, setTargetAmount] = useState(initial?.target_amount ?? "");
  const [targetDate, setTargetDate] = useState(initial?.target_date || "");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (targetAmount === "" || !targetDate) return;
    setSaving(true);
    await onSubmit({ label, targetAmount, targetDate });
    setSaving(false);
  }

  return (
    <form className="ledger-form" onSubmit={submit}>
      <div className="form-row">
        <label>
          목표 이름 (선택)
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="예: 내 집 마련" />
        </label>
        <label>
          목표 금액 (만원)
          <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="예: 50000" min="0" required />
        </label>
      </div>
      <div className="form-row">
        <label>
          목표 날짜
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>취소</button>
        <button type="submit" className="btn-primary" disabled={saving}>목표 저장</button>
      </div>
    </form>
  );
}

export function CashflowForm({ initial, onSubmit, onCancel }) {
  const [month, setMonth] = useState(initial?.month || currentMonth());
  const [income, setIncome] = useState(initial?.income ?? "");
  const [expense, setExpense] = useState(initial?.expense ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!month || income === "" || expense === "") return;
    setSaving(true);
    await onSubmit({ month, income, expense });
    setSaving(false);
  }

  return (
    <form className="ledger-form" onSubmit={submit}>
      <div className="form-row">
        <label>
          월
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} required />
        </label>
        <label>
          수입 (만원)
          <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="예: 400" min="0" required />
        </label>
        <label>
          지출 (만원)
          <input type="number" value={expense} onChange={(e) => setExpense(e.target.value)} placeholder="예: 280" min="0" required />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>취소</button>
        <button type="submit" className="btn-primary" disabled={saving}>기록 저장</button>
      </div>
    </form>
  );
}

export function SnapshotForm({ onSubmit, onCancel, defaultTotal }) {
  const [month, setMonth] = useState(currentMonth());
  const [total, setTotal] = useState(defaultTotal ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!month || total === "") return;
    setSaving(true);
    await onSubmit(month, Number(total) || 0);
    setSaving(false);
  }

  return (
    <form className="ledger-form" onSubmit={submit}>
      <div className="form-row">
        <label>
          월
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} required />
        </label>
        <label>
          총자산 (만원)
          <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} min="0" required />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>취소</button>
        <button type="submit" className="btn-primary" disabled={saving}>기록 저장</button>
      </div>
    </form>
  );
}
