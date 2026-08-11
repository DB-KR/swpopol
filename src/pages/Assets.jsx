import React, { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useData } from "../context/DataContext";
import { getCategory } from "../lib/constants";
import { formatManwon } from "../lib/format";
import { AssetForm } from "../components/forms";

export default function Assets() {
  const { assets, loading, addAsset, updateAsset, deleteAsset } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
            {assets.map((a) =>
              editingId === a.id ? (
                <div className="ledger-row-edit" key={a.id}>
                  <AssetForm
                    initial={a}
                    onSubmit={async (f) => { await updateAsset(a.id, f); setEditingId(null); }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div className="ledger-row" key={a.id}>
                  <span>
                    <span className="tag" style={{ color: getCategory(a.category).color, borderColor: getCategory(a.category).color }}>
                      {getCategory(a.category).label}
                    </span>
                  </span>
                  <span>{a.name}</span>
                  <span className="muted">{a.memo || "-"}</span>
                  <span className="num">{formatManwon(a.value)}</span>
                  <span className="row-actions">
                    <button className="icon-btn" onClick={() => setEditingId(a.id)} aria-label="수정"><Pencil size={13} /></button>
                    <button className="icon-btn" onClick={() => deleteAsset(a.id)} aria-label="삭제"><Trash2 size={13} /></button>
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
