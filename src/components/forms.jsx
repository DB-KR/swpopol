import React, { useState } from "react";
import { CATEGORIES, INCOME_CATEGORIES, EXPENSE_CATEGORIES, CURRENCIES } from "../lib/constants";
import { currentMonth } from "../lib/format";

export function AssetForm({ initial, onSubmit, onCancel }) {
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0].key);
  const [name, setName] = useState(initial?.name || "");
  const [value, setValue] = useState(initial?.value ?? "");
  const [memo, setMemo] = useState(initial?.memo || "");
  const [currency, setCurrency] = useState(initial?.currency || "KRW");
  const [buyPrice, setBuyPrice] = useState(initial?.buy_price ?? "");
  const [sellPrice, setSellPrice] = useState(initial?.sell_price ?? "");
  const [buyFxRate, setBuyFxRate] = useState(initial?.buy_fx_rate ?? "");
  const [showReturns, setShowReturns] = useState(!!(initial?.buy_price || initial?.sell_price));
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || value === "") return;
    setSaving(true);
    await onSubmit({
      category,
      name,
      value,
      memo,
      currency,
      buyPrice: showReturns ? buyPrice : "",
      sellPrice: showReturns ? sellPrice : "",
      buyFxRate: showReturns && currency !== "KRW" ? buyFxRate : "",
    });
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

      {!showReturns ? (
        <button type="button" className="link-btn" onClick={() => setShowReturns(true)}>
          + 매수가·매도가·수익률 기록하기 (선택)
        </button>
      ) : (
        <>
          <div className="form-row">
            <label>
              통화
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </label>
            <label>
              매수가 (1주/1좌 기준, {currency})
              <input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} placeholder="예: 150.25" min="0" step="0.01" />
            </label>
            <label>
              매도가(현재가, {currency})
              <input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="예: 182.40" min="0" step="0.01" />
            </label>
          </div>
          {currency !== "KRW" && (
            <div className="form-row">
              <label>
                평균환율 (매수 시점, 1{currency}당 원화)
                <input type="number" value={buyFxRate} onChange={(e) => setBuyFxRate(e.target.value)} placeholder="예: 1320.50" min="0" step="0.01" />
              </label>
            </div>
          )}
          <button type="button" className="link-btn" onClick={() => setShowReturns(false)}>
            매수가·매도가 기록 안 함
          </button>
        </>
      )}

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

export function CashflowItemForm({ initial, onSubmit, onCancel }) {
  const [type, setType] = useState(initial?.type || "expense");
  const [category, setCategory] = useState(
    initial?.category || (initial?.type === "income" ? INCOME_CATEGORIES[0].key : EXPENSE_CATEGORIES[0].key)
  );
  const [month, setMonth] = useState(initial?.month || currentMonth());
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [memo, setMemo] = useState(initial?.memo || "");
  const [saving, setSaving] = useState(false);

  const categoryOptions = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function handleTypeChange(next) {
    setType(next);
    const opts = next === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    setCategory(opts[0].key);
  }

  async function submit(e) {
    e.preventDefault();
    if (!month || amount === "") return;
    setSaving(true);
    await onSubmit({ type, category, month, amount, memo });
    setSaving(false);
  }

  return (
    <form className="ledger-form" onSubmit={submit}>
      <div className="form-row">
        <label>
          구분
          <select value={type} onChange={(e) => handleTypeChange(e.target.value)}>
            <option value="income">수입</option>
            <option value="expense">지출</option>
          </select>
        </label>
        <label>
          카테고리
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categoryOptions.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </label>
        <label>
          월
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} required />
        </label>
      </div>
      <div className="form-row">
        <label>
          금액 (만원)
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="예: 80" min="0" required />
        </label>
        <label>
          메모 (선택)
          <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: OO통신, OO보험" />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>취소</button>
        <button type="submit" className="btn-primary" disabled={saving}>{initial ? "수정 완료" : "항목 추가"}</button>
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
