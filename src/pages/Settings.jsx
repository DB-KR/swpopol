import React, { useState } from "react";
import { Download } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useData } from "../context/DataContext";
import { downloadJson, downloadCsv } from "../lib/exportData";

export default function Settings() {
  const { assets, liabilities, snapshots, goal, cashflowItems, allocationTargets } = useData();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState(null); // { type: "success" | "error", message }
  const [saving, setSaving] = useState(false);

  function handleFullBackup() {
    const payload = {
      exportedAt: new Date().toISOString(),
      assets,
      liabilities,
      snapshots,
      goal,
      cashflowItems,
      allocationTargets,
    };
    const today = new Date().toISOString().slice(0, 10);
    downloadJson(payload, `my-asset-passbook-backup-${today}.json`);
  }

  function handleCsvExport(rows, label) {
    const today = new Date().toISOString().slice(0, 10);
    const ok = downloadCsv(rows, `${label}-${today}.csv`);
    if (!ok) setStatus({ type: "error", message: "내보낼 데이터가 없어요." });
  }

  async function submit(e) {
    e.preventDefault();
    setStatus(null);

    if (password.length < 6) {
      setStatus({ type: "error", message: "비밀번호는 6자 이상이어야 해요." });
      return;
    }
    if (password !== confirm) {
      setStatus({ type: "error", message: "두 비밀번호가 서로 달라요." });
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setStatus({ type: "error", message: "비밀번호 설정에 실패했어요. 다시 시도해주세요." });
    } else {
      setStatus({ type: "success", message: "비밀번호가 설정됐어요. 다음부터는 이메일과 비밀번호로 바로 로그인할 수 있어요." });
      setPassword("");
      setConfirm("");
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div className="card-head">
          <h2>데이터 백업</h2>
          <span className="card-sub">Supabase 무료 플랜은 자동 백업이 없어요 — 가끔 내려받아두세요</span>
        </div>

        <div className="snapshot-actions">
          <button className="btn-primary" onClick={handleFullBackup}>
            <Download size={14} /> 전체 데이터 백업 (JSON)
          </button>
        </div>

        <p className="form-hint" style={{ marginTop: 14 }}>표별로 CSV로 내려받기</p>
        <div className="snapshot-actions">
          <button className="btn-ghost" onClick={() => handleCsvExport(assets, "assets")}>자산</button>
          <button className="btn-ghost" onClick={() => handleCsvExport(liabilities, "liabilities")}>부채</button>
          <button className="btn-ghost" onClick={() => handleCsvExport(cashflowItems, "cashflow")}>현금흐름</button>
          <button className="btn-ghost" onClick={() => handleCsvExport(snapshots, "snapshots")}>스냅샷</button>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>비밀번호 설정</h2>
          <span className="card-sub">한 번 설정해두면 다음부터 이메일 링크 없이 로그인할 수 있어요</span>
        </div>

        <form className="ledger-form" onSubmit={submit}>
          <div className="form-row">
            <label>
              새 비밀번호
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상"
                required
                minLength={6}
              />
            </label>
            <label>
              비밀번호 확인
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="다시 입력"
                required
                minLength={6}
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "저장 중…" : "비밀번호 저장"}
            </button>
          </div>
        </form>

        {status && (
          <div className={status.type === "error" ? "error-banner" : "success-banner"}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}
