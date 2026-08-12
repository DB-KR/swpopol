import React, { useState } from "react";
import { Pencil, Scale } from "lucide-react";
import { useData } from "../context/DataContext";
import { CATEGORIES } from "../lib/constants";
import { formatManwon } from "../lib/format";
import PageSkeleton from "../components/PageSkeleton";

// 부동산은 조금씩 사고팔 수 있는 자산이 아니라서 리밸런싱 대상에서 제외합니다.
const REBALANCE_CATEGORIES = CATEGORIES.filter((c) => c.key !== "realestate");

function AllocationTargetForm({ initialTargets, onSubmit, onCancel }) {
  const [values, setValues] = useState(
    REBALANCE_CATEGORIES.reduce((acc, c) => {
      const found = initialTargets.find((t) => t.category === c.key);
      acc[c.key] = found ? found.target_pct : "";
      return acc;
    }, {})
  );
  const [saving, setSaving] = useState(false);

  const sum = REBALANCE_CATEGORIES.reduce((s, c) => s + (Number(values[c.key]) || 0), 0);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await onSubmit(REBALANCE_CATEGORIES.map((c) => ({ category: c.key, targetPct: values[c.key] })));
    setSaving(false);
  }

  return (
    <form className="ledger-form" onSubmit={submit}>
      <div className="form-row">
        {REBALANCE_CATEGORIES.map((c) => (
          <label key={c.key}>
            {c.label} (%)
            <input
              type="number"
              value={values[c.key]}
              onChange={(e) => setValues((v) => ({ ...v, [c.key]: e.target.value }))}
              min="0"
              max="100"
              step="1"
            />
          </label>
        ))}
      </div>
      <p className={`form-hint ${Math.round(sum) !== 100 ? "neg" : "pos"}`}>
        합계 {sum.toFixed(0)}% {Math.round(sum) !== 100 ? "(100%가 되도록 맞춰주세요)" : "✓"}
      </p>
      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>취소</button>
        <button type="submit" className="btn-primary" disabled={saving}>목표 비중 저장</button>
      </div>
    </form>
  );
}

export default function Rebalance() {
  const { assets, allocationTargets, loading, error, saveAllocationTargets } = useData();
  const [showForm, setShowForm] = useState(false);
  const [contribution, setContribution] = useState("");

  const sums = {};
  assets
    .filter((a) => a.category !== "realestate")
    .forEach((a) => { sums[a.category] = (sums[a.category] || 0) + Number(a.value || 0); });
  const totalAssets = Object.values(sums).reduce((s, v) => s + v, 0);

  const hasTargets = allocationTargets.some((t) => t.category !== "realestate" && Number(t.target_pct) > 0);

  const rows = REBALANCE_CATEGORIES.map((c) => {
    const current = sums[c.key] || 0;
    const currentPct = totalAssets > 0 ? (current / totalAssets) * 100 : 0;
    const target = allocationTargets.find((t) => t.category === c.key);
    const targetPct = target ? Number(target.target_pct) : 0;
    return { ...c, current, currentPct, targetPct, deviation: currentPct - targetPct };
  });

  const contributionNum = Number(contribution) || 0;
  const underweight = rows.map((r) => ({ ...r, weight: Math.max(0, r.targetPct - r.currentPct) }));
  const totalWeight = underweight.reduce((s, r) => s + r.weight, 0);
  const suggestions = underweight.map((r) => {
    const suggested = totalWeight > 0
      ? (contributionNum * r.weight) / totalWeight
      : contributionNum * (r.targetPct / 100);
    return { ...r, suggested };
  });

  if (loading) return <PageSkeleton cards={2} />;

  return (
    <div className="page">
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="card-head">
          <h2>목표 비중</h2>
          {!showForm && (
            <button className="link-btn" onClick={() => setShowForm(true)}><Pencil size={12} /> 수정</button>
          )}
        </div>
        <p className="form-hint" style={{ marginTop: -8, marginBottom: 10 }}>부동산은 매수·매도 단위가 커서 제외하고, 금융자산(주식·현금·연금) 안에서의 비중이에요</p>

        {showForm ? (
          <AllocationTargetForm
            initialTargets={allocationTargets}
            onSubmit={async (t) => { await saveAllocationTargets(t); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        ) : !hasTargets ? (
          <div className="empty-state">
            <div className="empty-ring"><Scale size={20} /></div>
            <p>자산군별 목표 비중을 설정하면 현재 비중과 비교해드려요.</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>목표 비중 설정하기</button>
          </div>
        ) : (
          <div className="rebalance-table">
            <div className="rebalance-row rebalance-head">
              <span>자산군</span><span className="num">현재 비중</span><span className="num">목표 비중</span><span className="num">괴리</span>
            </div>
            {rows.map((r) => (
              <div className="rebalance-row" key={r.key}>
                <span data-label="자산군">
                  <span className="tag" style={{ color: r.color, borderColor: r.color }}>{r.label}</span>
                </span>
                <span data-label="현재 비중" className="num">{r.currentPct.toFixed(1)}%</span>
                <span data-label="목표 비중" className="num">{r.targetPct.toFixed(1)}%</span>
                <span data-label="괴리" className={`num ${r.deviation > 0.5 ? "neg" : r.deviation < -0.5 ? "pos" : "muted"}`}>
                  {r.deviation > 0 ? "+" : ""}{r.deviation.toFixed(1)}%p
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasTargets && !showForm && (
        <div className="card">
          <div className="card-head">
            <h2>리밸런싱 계산기</h2>
            <span className="card-sub">신규 투입금을 목표 비중에 맞춰 배분해드려요</span>
          </div>
          <div className="form-row">
            <label style={{ maxWidth: 240 }}>
              이번에 투입할 금액 (만원)
              <input type="number" value={contribution} onChange={(e) => setContribution(e.target.value)} placeholder="예: 100" min="0" />
            </label>
          </div>

          {contributionNum > 0 && (
            <div className="rebalance-table" style={{ marginTop: 14 }}>
              <div className="rebalance-row rebalance-head cols-3">
                <span>자산군</span><span className="num">괴리</span><span className="num">제안 투입액</span>
              </div>
              {suggestions.map((r) => (
                <div className="rebalance-row cols-3" key={r.key}>
                  <span data-label="자산군">
                    <span className="tag" style={{ color: r.color, borderColor: r.color }}>{r.label}</span>
                  </span>
                  <span data-label="괴리" className={`num ${r.deviation < -0.5 ? "pos" : r.deviation > 0.5 ? "neg" : "muted"}`}>
                    {r.deviation > 0 ? "+" : ""}{r.deviation.toFixed(1)}%p
                  </span>
                  <span data-label="제안 투입액" className="num strong">{r.suggested > 0 ? formatManwon(r.suggested) : "-"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
