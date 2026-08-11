import React, { useState } from "react";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useData } from "../context/DataContext";
import { getCategory } from "../lib/constants";
import { formatManwon, formatCurrencyAmount, formatPct, computeAssetReturns } from "../lib/format";
import { AssetForm } from "../components/forms";
import { useFxRates } from "../lib/useFxRates";

export default function Assets() {
  const { assets, loading, addAsset, updateAsset, deleteAsset } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const foreignCurrencies = assets.map((a) => a.currency).filter((c) => c && c !== "KRW");
  const { rates: fxRates, loading: fxLoading } = useFxRates(foreignCurrencies);

  if (loading) return <div className="loading-screen">불러오는 중…</div>;

  return (
    <div className="page">
      <div className="card">
        <div className="card-head">
          <h2>자산 내역</h2>
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
            <div className="empty-ring" />
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
                    <span>
                      <span className="tag" style={{ color: getCategory(a.category).color, borderColor: getCategory(a.category).color }}>
                        {getCategory(a.category).label}
                      </span>
                    </span>
                    <span>{a.name}</span>
                    <span className="muted">{a.memo || "-"}</span>
                    <span className="num">
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
    </div>
  );
}

function AssetReturnDetail({ asset, returns: r, fxLoading }) {
  return (
    <div className="return-detail">
      <span className="return-chip">
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
    </div>
  );
}
