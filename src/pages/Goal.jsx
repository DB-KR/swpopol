import React, { useState } from "react";
import { Plus, Pencil, Target } from "lucide-react";
import { useData } from "../context/DataContext";
import { formatManwon } from "../lib/format";
import { GoalForm } from "../components/forms";
import Stamp from "../components/Stamp";

export default function Goal() {
  const { assets, goal, loading, saveGoal } = useData();
  const [showForm, setShowForm] = useState(false);

  const totalAssets = assets.reduce((s, a) => s + Number(a.value || 0), 0);
  const goalProgressPct = goal && goal.target_amount > 0 ? (totalAssets / goal.target_amount) * 100 : null;
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
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.min(100, goalProgressPct || 0)}%` }} />
              {[25, 50, 75].map((t) => <div className="progress-tick" style={{ left: `${t}%` }} key={t} />)}
            </div>
            <div className="goal-nums">
              <span>{formatManwon(totalAssets)} / {formatManwon(goal.target_amount)}</span>
              <span className={(goalProgressPct || 0) >= 100 ? "pos" : ""}>{(goalProgressPct || 0).toFixed(1)}%</span>
            </div>
            {(goalProgressPct || 0) >= 100 && <Stamp text="목표 달성" />}
          </div>
        )}
      </div>
    </div>
  );
}
