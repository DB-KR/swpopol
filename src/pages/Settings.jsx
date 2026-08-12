import React, { useState, useRef } from "react";
import { Download, Upload } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useData } from "../context/DataContext";
import { downloadJson, downloadCsv, readJsonFile } from "../lib/exportData";

export default function Settings() {
  const { assets, liabilities, snapshots, goal, cashflowItems, allocationTargets, restoreBackup } = useData();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState(null); // { type: "success" | "error", message }
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef(null);

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

  async function handleRestoreFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 선택해도 onChange가 발생하도록 초기화
    if (!file) return;

    setStatus(null);
    let data;
    try {
      data = await readJsonFile(file);
    } catch (err) {
      setStatus({ type: "error", message: err.message });
      return;
    }

    const hasKnownShape = data && typeof data === "object" && (
      Array.isArray(data.assets) || Array.isArray(data.liabilities) || Array.isArray(data.cashflowItems) || Array.isArray(data.snapshots)
    );
    if (!hasKnownShape) {
      setStatus({ type: "error", message: "이 앱의 백업 파일 형식이 아니에요." });
      return;
    }

    const confirmed = window.confirm(
      "복원하면 현재 저장된 자산·부채·현금흐름·스냅샷·목표·목표 비중이 전부 이 백업 파일 내용으로 대체돼요. 되돌릴 수 없어요. 계속할까요?"
    );
    if (!confirmed) return;

    setRestoring(true);
    const result = await restoreBackup(data);
    setRestoring(false);

    if (result.success) {
      setStatus({ type: "success", message: "복원이 완료됐어요." });
    }
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
          <h2>데이터 복원</h2>
          <span className="card-sub">백업 JSON 파일을 업로드하면 현재 데이터를 대체해요</span>
        </div>
        <p className="form-hint neg" style={{ marginBottom: 10 }}>
          주의: 복원하면 지금 저장된 데이터가 백업 파일 내용으로 완전히 바뀌어요. 되돌릴 수 없으니, 먼저 현재 데이터를 백업해두는 걸 권장해요.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleRestoreFile}
          style={{ display: "none" }}
        />
        <div className="snapshot-actions">
          <button className="btn-ghost" onClick={() => fileInputRef.current?.click()} disabled={restoring}>
            <Upload size={14} /> {restoring ? "복원 중…" : "백업 파일 선택하고 복원"}
          </button>
        </div>
      </div>

      {status && (
        <div className={status.type === "error" ? "error-banner" : "success-banner"}>
          {status.message}
        </div>
      )}

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
      </div>
    </div>
  );
}
