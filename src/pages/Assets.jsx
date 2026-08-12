import React, { useState } from "react";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Wallet, CreditCard } from "lucide-react";
import { useData } from "../context/DataContext";
import { getCategory, getLiabilityCategory } from "../lib/constants";
import { formatManwon, formatCurrencyAmount, formatPct, formatDate, computeAssetReturns, computeAmortization } from "../lib/format";
import { AssetForm, LiabilityForm } from "../components/forms";
import { useFxRates } from "../lib/useFxRates";
import PageSkeleton from "../components/PageSkeleton";

export default function Assets() {
  const {
    assets, liabilities, loading, error,
    addAsset, updateAsset, deleteAsset,
    addLiability, updateLiability, deleteLiability,
  } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAddLiability, setShowAddLiability] = useState(false);
  const [editingLiabilityId, setEditingLiabilityId] = useState(null);

  const foreignCurrencies = assets.map((a) => a.currency).filter((c) => c && c !== "KRW");
  const { rates: fxRates, loading: fxLoading } = useFxRates(foreignCurrencies);

  const totalAssets = assets.reduce((s, a) => s + Number(a.value || 0), 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + Number(l.amount || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  if (loading) return <PageSkeleton cards={3} />;

  return (
    <div className="page">
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="card-head">
          <h2>순자산 요약</h2>
        </div>
        <div className="networth-summary">
          <div className="networth-item">
            <span className="networth-label">자산</span>
            <span className="networth-value pos">{formatManwon(totalAssets)}</span>
          </div>
          <span className="networth-op">−</span>
          <div className="networth-item">
            <span className="networth-label">부채</span>
            <span className="networth-value neg">{formatManwon(totalLiabilities)}</span>
          </div>
          <span className="networth-op">=</span>
          <div className="networth-item">
            <span className="networth-label">순자산</span>
            <span className="networth-value strong">{formatManwon(netWorth)}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>자산</h2>
          {!showAdd && (
            <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> 자산 추가</button>
          )}
        </div>

        {showAdd && (
          <AssetForm
            onSubmit={async (f) => { await addAsset(f); setShowAdd(false); }}
            onCancel={() => setShowAdd(false)}
          />
        )}

        {assets.length === 0 && !showAdd ? (
          <div className="empty-state">
            <div className="empty-ring"><Wallet size={20} /></div>
            <p>아직 등록된 자산이 없어요. 첫 자산을 기록해보세요.</p>
          </div>
        ) : (
          <div className="ledger-table">
            <div className="ledger-row ledger-head">
              <span>구분</span><span>자산명</span><span>메모</span><span className="num">평가금액</span><span></span>
            </div>
            {assets.map((a) => {
              if (editingId === a.id) {
                return (
                  <div className="ledger-row-edit" key={a.id}>
                    <AssetForm
                      initial={a}
                      onSubmit={async (f) => { await updateAsset(a.id, f); setEditingId(null); }}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                );
              }
              const r = computeAssetReturns(a, fxRates);
              return (
                <React.Fragment key={a.id}>
                  <div className="ledger-row">
                    <span data-label="구분">
                      <span className="tag" style={{ color: getCategory(a.category).color, borderColor: getCategory(a.category).color }}>
                        {getCategory(a.category).label}
                      </span>
                    </span>
                    <span data-label="자산명">{a.name}{a.quantity ? <span className="muted"> · {a.quantity}주</span> : null}</span>
                    <span data-label="메모" className="muted">{a.memo || "-"}</span>
                    <span data-label="평가금액" className="num">
                      {formatManwon(a.value)}
                      {r && (
                        <span className={`inline-return ${r.totalReturnPct >= 0 ? "pos" : "neg"}`}>
                          {formatPct(r.totalReturnPct)}
                        </span>
                      )}
                    </span>
                    <span className="row-actions">
                      <button className="icon-btn" onClick={() => setEditingId(a.id)} aria-label="수정"><Pencil size={13} /></button>
                      <button className="icon-btn" onClick={() => deleteAsset(a.id)} aria-label="삭제"><Trash2 size={13} /></button>
                    </span>
                  </div>
                  {r && <AssetReturnDetail asset={a} returns={r} fxLoading={fxLoading} />}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>부채</h2>
          {!showAddLiability && (
            <button className="btn-primary" onClick={() => setShowAddLiability(true)}><Plus size={14} /> 부채 추가</button>
          )}
        </div>

        {showAddLiability && (
          <LiabilityForm
            onSubmit={async (f) => { await addLiability(f); setShowAddLiability(false); }}
            onCancel={() => setShowAddLiability(false)}
          />
        )}

        {liabilities.length === 0 && !showAddLiability ? (
          <div className="empty-state">
            <div className="empty-ring"><CreditCard size={20} /></div>
            <p>등록된 부채가 없어요.</p>
          </div>
        ) : (
          <div className="ledger-table">
            <div className="ledger-row ledger-head">
              <span>구분</span><span>부채명</span><span>메모</span><span className="num">잔액</span><span></span>
            </div>
            {liabilities.map((l) =>
              editingLiabilityId === l.id ? (
                <div className="ledger-row-edit" key={l.id}>
                  <LiabilityForm
                    initial={l}
                    onSubmit={async (f) => { await updateLiability(l.id, f); setEditingLiabilityId(null); }}
                    onCancel={() => setEditingLiabilityId(null)}
                  />
                </div>
              ) : (
                <React.Fragment key={l.id}>
                  <div className="ledger-row">
                    <span data-label="구분">
                      <span className="tag" style={{ color: getLiabilityCategory(l.category).color, borderColor: getLiabilityCategory(l.category).color }}>
                        {getLiabilityCategory(l.category).label}
                      </span>
                    </span>
                    <span data-label="부채명">{l.name}{l.interest_rate ? <span className="muted"> · 연 {l.interest_rate}%</span> : null}</span>
                    <span data-label="메모" className="muted">{l.memo || "-"}</span>
                    <span data-label="잔액" className="num neg">{formatManwon(l.amount)}</span>
                    <span className="row-actions">
                      <button className="icon-btn" onClick={() => setEditingLiabilityId(l.id)} aria-label="수정"><Pencil size={13} /></button>
                      <button className="icon-btn" onClick={() => deleteLiability(l.id)} aria-label="삭제"><Trash2 size={13} /></button>
                    </span>
                  </div>
                  <LiabilityAmortizationDetail liability={l} />
                </React.Fragment>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LiabilityAmortizationDetail({ liability }) {
  const a = computeAmortization(liability.amount, liability.interest_rate, liability.term_months);
  if (!a) return null;

  return (
    <div className="return-detail">
      <span className="return-chip strong">
        월 상환액 {formatManwon(a.monthlyPayment)}
      </span>
      <span className="return-chip neg">
        총 이자 {formatManwon(a.totalInterest)}
      </span>
      <span className="return-chip">
        총 상환액 {formatManwon(a.totalPayment)}
      </span>
      <span className="return-chip muted">
        예상 완제 {a.payoffDate.getFullYear()}.{String(a.payoffDate.getMonth() + 1).padStart(2, "0")}
      </span>
    </div>
  );
}

function AssetReturnDetail({ asset, returns: r, fxLoading }) {
  return (
    <div className="return-detail">
      <span className="return-chip">
        {asset.buy_date && `${formatDate(asset.buy_date)} · `}
        {formatCurrencyAmount(r.buy, asset.currency)} → {formatCurrencyAmount(r.sell, asset.currency)}
      </span>
      <span className={`return-chip ${r.priceReturnPct >= 0 ? "pos" : "neg"}`}>
        {r.priceReturnPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} 가격 {formatPct(r.priceReturnPct)}
      </span>
      {r.isForeign && (
        r.fxReturnPct !== null ? (
          <span className={`return-chip ${r.fxReturnPct >= 0 ? "pos" : "neg"}`}>
            환율 {formatPct(r.fxReturnPct)} (현재 {r.currentFxRate.toFixed(1)}원)
          </span>
        ) : (
          <span className="return-chip muted">{fxLoading ? "환율 조회 중…" : "환율 정보 없음"}</span>
        )
      )}
      <span className={`return-chip strong ${r.totalReturnPct >= 0 ? "pos" : "neg"}`}>
        총수익률 {formatPct(r.totalReturnPct)}
      </span>
      {r.annualizedReturnPct !== null && (
        <span className={`return-chip strong ${r.annualizedReturnPct >= 0 ? "pos" : "neg"}`}>
          연평균 {formatPct(r.annualizedReturnPct)} ({Math.round(r.holdingDays)}일 보유)
        </span>
      )}
      {r.gainManwon !== null && (
        <span className={`return-chip strong ${r.gainManwon >= 0 ? "pos" : "neg"}`}>
          평가손익 {r.gainManwon >= 0 ? "+" : ""}{formatManwon(r.gainManwon)}
        </span>
      )}
    </div>
  );
}
