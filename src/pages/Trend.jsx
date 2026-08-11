import React, { useState } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useData } from "../context/DataContext";
import { formatManwon, formatMonthLabel, formatPct, currentMonth } from "../lib/format";
import { TrendArea } from "../components/charts";
import { SnapshotForm } from "../components/forms";
import Stamp from "../components/Stamp";

export default function Trend() {
  const { assets, snapshots, loading, saveSnapshot, deleteSnapshot } = useData();
  const [showForm, setShowForm] = useState(false);
  const [justSnapshotted, setJustSnapshotted] = useState(false);

  const totalAssets = assets.reduce((s, a) => s + Number(a.value || 0), 0);
  const trendData = [...snapshots].sort((a, b) => a.month.localeCompare(b.month));
  const hasSnapshotThisMonth = trendData.some((s) => s.month === currentMonth());

  const overallReturnPct = (() => {
    if (trendData.length < 2) return null;
    const first = trendData[0].total;
    const last = trendData[trendData.length - 1].total;
    if (!first) return null;
    return ((last - first) / first) * 100;
  })();

  async function handleQuickSnapshot() {
    await saveSnapshot(currentMonth(), totalAssets);
    setJustSnapshotted(true);
    setTimeout(() => setJustSnapshotted(false), 1800);
  }

  if (loading) return <div className="loading-screen">불러오는 중…</div>;

  return (
    <div className="page">
      <div className="card">
        <div className="card-head">
          <h2>자산 증감 추이</h2>
          <span className="card-sub">
            {overallReturnPct === null ? (
              "스냅샷 2개 이상부터 표시돼요"
            ) : (
              <span className={overallReturnPct >= 0 ? "pos" : "neg"}>
                {overallReturnPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} 전체 {formatPct(overallReturnPct)}
              </span>
            )}
          </span>
        </div>

        <TrendArea data={trendData} />

        <div className="snapshot-actions">
          <button className="btn-primary" onClick={handleQuickSnapshot}>
            <Plus size={14} /> {hasSnapshotThisMonth ? "이번 달 스냅샷 업데이트" : "이번 달 스냅샷 기록"}
          </button>
          <button className="btn-ghost" onClick={() => setShowForm((v) => !v)}>다른 달 기록</button>
          {justSnapshotted && <Stamp text="기록완료" />}
        </div>

        {showForm && (
          <SnapshotForm
            defaultTotal={totalAssets}
            onSubmit={async (m, t) => { await saveSnapshot(m, t); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {trendData.length > 0 && (
          <div className="mini-list">
            {[...trendData].reverse().map((s) => (
              <div className="mini-list-row" key={s.month}>
                <span>{formatMonthLabel(s.month)}</span>
                <span>{formatManwon(s.total)}</span>
                <button className="icon-btn" onClick={() => deleteSnapshot(s.month)} aria-label="스냅샷 삭제">
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
