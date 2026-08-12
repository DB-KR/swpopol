import React, { useState } from "react";
import { Plus, Pencil, Target } from "lucide-react";
import { useData } from "../context/DataContext";
import { formatManwon } from "../lib/format";
import { getCategory } from "../lib/constants";
import { GoalForm } from "../components/forms";
import Stamp from "../components/Stamp";

const FINANCIAL_COLOR = "#2F6F4E";

export default function Goal() {
  const { assets, goal, loading, saveGoal } = useData();
  const [showForm, setShowForm] = useState(false);

  const realEstateColor = getCategory("realestate").color;

  const realEstateTotal = assets
    .filter((a) => a.category === "realestate")
    .reduce((s, a) => s + Number(a.value || 0), 0);
  const financialTotal = assets
    .filter((a) => a.category !== "realestate")
    .reduce((s, a) => s + Number(a.value || 0), 0);
  const totalAssets = realEstateTotal + financialTotal;

  const realEstateTarget = goal?.real_estate_target || 0;
  const financialTarget = goal?.financial_target || 0;
  const combinedTarget = realEstateTarget + financialTarget;

  const overallPct = combinedTarget > 0 ? (totalAssets / combinedTarget) * 100 : null;
  const realEstatePct = realEstateTarget > 0 ? (realEstateTotal / realEstateTarget) * 100 : null;
  const financialPct = financialTarget > 0 ? (financialTotal / financialTarget) * 100 : null;

  const daysLeft = goal && goal.target_date ? Math.ceil((new Date(goal.target_date) - new Date()) / 86400000) : null;

  if (loading) return <div className="loading-screen">불러오는 중…</div>;

  return (
    <div className="page">
      <div className="card">
        <div className="card-head">
          <h2>목표 달성률</h2>
          {goal && !showForm && (
            <button className="link-btn" onClick={() => setShowForm(true)}><Pencil size={12} /> 수정</button>
          )}
        </div>

        {!goal ? (
          showForm ? (
            <GoalForm onSubmit={async (f) => { await saveGoal(f); setShowForm(false); }} onCancel={() => setShowForm(false)} />
          ) : (
            <div className="empty-state">
              <div className="empty-ring"><Target size={20} /></div>
              <p>목표를 설정하면 진행 상황을 볼 수 있어요.</p>
              <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={14} /> 목표 설정하기</button>
            </div>
          )
        ) : showForm ? (
          <GoalForm initial={goal} onSubmit={async (f) => { await saveGoal(f); setShowForm(false); }} onCancel={() => setShowForm(false)} />
        ) : (
          <div className="goal-body">
            <div className="goal-top">
              <span className="goal-label">{goal.label}</span>
              <span className="goal-days">{daysLeft === null ? "" : daysLeft >= 0 ? `D-${daysLeft}` : `${Math.abs(daysLeft)}일 지남`}</span>
            </div>

            <div className="goal-split">
              <div className="goal-split-item">
                <div className="goal-split-head">
                  <span className="goal-split-label">
                    <span className="legend-dot" style={{ background: realEstateColor }} /> 부동산
                  </span>
                  <span className="goal-split-pct">{(realEstatePct || 0).toFixed(1)}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${Math.min(100, realEstatePct || 0)}%`, background: realEstateColor }} />
                </div>
                <div className="goal-split-amt">{formatManwon(realEstateTotal)} / {formatManwon(realEstateTarget)}</div>
              </div>

              <div className="goal-split-item">
                <div className="goal-split-head">
                  <span className="goal-split-label">
                    <span className="legend-dot" style={{ background: FINANCIAL_COLOR }} /> 금융자산
                  </span>
                  <span className="goal-split-pct">{(financialPct || 0).toFixed(1)}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${Math.min(100, financialPct || 0)}%`, background: FINANCIAL_COLOR }} />
                </div>
                <div className="goal-split-amt">{formatManwon(financialTotal)} / {formatManwon(financialTarget)}</div>
              </div>
            </div>

            <div className="goal-nums">
              <span>합계 {formatManwon(totalAssets)} / {formatManwon(combinedTarget)}</span>
              <span className={(overallPct || 0) >= 100 ? "pos" : ""}>{(overallPct || 0).toFixed(1)}%</span>
            </div>
            {(overallPct || 0) >= 100 && <Stamp text="목표 달성" />}
          </div>
        )}
      </div>
    </div>
  );
}
