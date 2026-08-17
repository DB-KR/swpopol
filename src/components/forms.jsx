import React, { useState } from "react";
import { CATEGORIES, INCOME_CATEGORIES, EXPENSE_CATEGORIES, CURRENCIES, LIABILITY_CATEGORIES } from "../lib/constants";
import { currentMonth } from "../lib/format";

export function AssetForm({ initial, onSubmit, onCancel }) {
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0].key);
  const [name, setName] = useState(initial?.name || "");
  // 화면 입력은 원 단위, DB 저장은 그대로 만원 단위 — 수정 모드로 열 때만 ×10000 해서 보여줍니다.
  const [value, setValue] = useState(initial?.value != null ? initial.value * 10000 : "");
  const [memo, setMemo] = useState(initial?.memo || "");
  const [currency, setCurrency] = useState(initial?.currency || "KRW");
  const [buyPrice, setBuyPrice] = useState(initial?.buy_price ?? "");
  const [sellPrice, setSellPrice] = useState(initial?.sell_price ?? "");
  const [buyFxRate, setBuyFxRate] = useState(initial?.buy_fx_rate ?? "");
  const [buyDate, setBuyDate] = useState(initial?.buy_date || "");
  const [quantity, setQuantity] = useState(initial?.quantity ?? "");
  const [showReturns, setShowReturns] = useState(!!(initial?.buy_price || initial?.sell_price));
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || value === "") return;
    setSaving(true);
    await onSubmit({
      category,
      name,
      value: Number(value) / 10000,
      memo,
      currency,
      buyPrice: showReturns ? buyPrice : "",
      sellPrice: showReturns ? sellPrice : "",
      buyFxRate: showReturns && currency !== "KRW" ? buyFxRate : "",
      buyDate: showReturns ? buyDate : "",
      quantity: showReturns ? quantity : "",
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
          평가금액 (원)
          <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="예: 15000000" min="0" step="1" required />
        </label>
        <label>
          메모 (선택)
          <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: 증권사, 계좌 등" />
        </label>
      </div>

      {!showReturns ? (
        <button type="button" className="toggle-chip" onClick={() => setShowReturns(true)}>
          <span className="toggle-chip-plus">+</span> 매수 정보 추가로 입력하기(수량/매수가/매도가 기록하기)
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
              매수일
              <input type="date" value={buyDate} onChange={(e) => setBuyDate(e.target.value)} min="1950-01-01" max={new Date().toISOString().slice(0, 10)} />
            </label>
          </div>
          <div className="form-row">
            <label>
              수량 (주/좌, 선택)
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="예: 10" min="0" step="0.0001" />
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

export function LiabilityForm({ initial, onSubmit, onCancel }) {
  const [category, setCategory] = useState(initial?.category || LIABILITY_CATEGORIES[0].key);
  const [name, setName] = useState(initial?.name || "");
  // 화면 입력은 원 단위, DB 저장은 그대로 만원 단위 — 수정 모드로 열 때만 ×10000 해서 보여줍니다.
  const [amount, setAmount] = useState(initial?.amount != null ? initial.amount * 10000 : "");
  const [interestRate, setInterestRate] = useState(initial?.interest_rate ?? "");
  const [termMonths, setTermMonths] = useState(initial?.term_months ?? "");
  const [memo, setMemo] = useState(initial?.memo || "");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || amount === "") return;
    setSaving(true);
    await onSubmit({ category, name, amount: Number(amount) / 10000, interestRate, termMonths, memo });
    setSaving(false);
  }

  return (
    <form className="ledger-form" onSubmit={submit}>
      <div className="form-row">
        <label>
          구분
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {LIABILITY_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </label>
        <label>
          부채명
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: OO은행 주택담보대출" required />
        </label>
      </div>
      <div className="form-row">
        <label>
          잔액 (원)
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="예: 150000000" min="0" required />
        </label>
        <label>
          이자율 (%, 선택)
          <input type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="예: 3.5" min="0" step="0.01" />
        </label>
        <label>
          남은 상환기간 (개월, 선택)
          <input type="number" value={termMonths} onChange={(e) => setTermMonths(e.target.value)} placeholder="예: 240" min="0" />
        </label>
      </div>
      <div className="form-row">
        <label>
          메모 (선택)
          <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: 만기일 등" />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>취소</button>
        <button type="submit" className="btn-primary" disabled={saving}>{initial ? "수정 완료" : "부채 추가"}</button>
      </div>
    </form>
  );
}

export function GoalForm({ initial, onSubmit, onCancel }) {
  const [label, setLabel] = useState(initial?.label || "");
  // 화면 입력은 원 단위, DB 저장은 그대로 만원 단위 — 수정 모드로 열 때만 ×10000 해서 보여줍니다.
  const [realEstateTarget, setRealEstateTarget] = useState(initial?.real_estate_target != null ? initial.real_estate_target * 10000 : "");
  const [financialTarget, setFinancialTarget] = useState(initial?.financial_target != null ? initial.financial_target * 10000 : "");
  const [targetDate, setTargetDate] = useState(initial?.target_date || "");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if ((realEstateTarget === "" && financialTarget === "") || !targetDate) return;
    setSaving(true);
    await onSubmit({
      label,
      realEstateTarget: realEstateTarget === "" ? "" : Number(realEstateTarget) / 10000,
      financialTarget: financialTarget === "" ? "" : Number(financialTarget) / 10000,
      targetDate,
    });
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
          목표 날짜
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} min="1950-01-01" max="2100-12-31" required />
        </label>
      </div>
      <div className="form-row">
        <label>
          부동산 목표 금액 (원)
          <input type="number" value={realEstateTarget} onChange={(e) => setRealEstateTarget(e.target.value)} placeholder="예: 1000000000" min="0" />
        </label>
        <label>
          금융자산 목표 금액 (원)
          <input type="number" value={financialTarget} onChange={(e) => setFinancialTarget(e.target.value)} placeholder="예: 1000000000" min="0" />
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
  // 화면 입력은 원 단위, DB 저장은 그대로 만원 단위 — 수정 모드로 열 때만 ×10000 해서 보여줍니다.
  const [amount, setAmount] = useState(initial?.amount != null ? initial.amount * 10000 : "");
  const [memo, setMemo] = useState(initial?.memo || "");
  const [isRecurring, setIsRecurring] = useState(initial?.is_recurring || false);
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
    await onSubmit({ type, category, month, amount: Number(amount) / 10000, memo, isRecurring });
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
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} min="1950-01" max="2100-12" required />
        </label>
      </div>
      <div className="form-row">
        <label>
          금액 (원)
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="예: 800000" min="0" required />
        </label>
        <label>
          메모 (선택)
          <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: OO통신, OO보험" />
        </label>
      </div>
      {type === "expense" && (
        <label className="checkbox-row">
          <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
          고정지출로 표시 (매달 반복되는 지출)
        </label>
      )}
      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>취소</button>
        <button type="submit" className="btn-primary" disabled={saving}>{initial ? "수정 완료" : "항목 추가"}</button>
      </div>
    </form>
  );
}

export function SnapshotForm({ onSubmit, onCancel, defaultRealEstate, defaultFinancial }) {
  const [month, setMonth] = useState(currentMonth());
  // 화면 입력은 원 단위, DB 저장은 그대로 만원 단위 — 기본값(현재 자산 합계, 만원)을 ×10000 해서 보여줍니다.
  const [realEstate, setRealEstate] = useState(defaultRealEstate != null ? defaultRealEstate * 10000 : "");
  const [financial, setFinancial] = useState(defaultFinancial != null ? defaultFinancial * 10000 : "");
  const [saving, setSaving] = useState(false);

  const realEstateManwon = realEstate === "" ? 0 : Number(realEstate) / 10000;
  const financialManwon = financial === "" ? 0 : Number(financial) / 10000;
  const total = realEstateManwon + financialManwon;

  async function submit(e) {
    e.preventDefault();
    if (!month || (realEstate === "" && financial === "")) return;
    setSaving(true);
    await onSubmit(month, total, realEstateManwon, financialManwon);
    setSaving(false);
  }

  return (
    <form className="ledger-form" onSubmit={submit}>
      <div className="form-row">
        <label>
          월
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} min="1950-01" max="2100-12" required />
        </label>
        <label>
          부동산 (원)
          <input type="number" value={realEstate} onChange={(e) => setRealEstate(e.target.value)} min="0" />
        </label>
        <label>
          금융자산 (원)
          <input type="number" value={financial} onChange={(e) => setFinancial(e.target.value)} min="0" />
        </label>
      </div>
      <p className="form-hint">합계 {Math.round(total).toLocaleString("ko-KR")}만원</p>
      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>취소</button>
        <button type="submit" className="btn-primary" disabled={saving}>기록 저장</button>
      </div>
    </form>
  );
}
