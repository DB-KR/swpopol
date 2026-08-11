import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [mode, setMode] = useState("password"); // "password" | "magic"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submitPassword(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (err) setError("이메일 또는 비밀번호가 올바르지 않아요.");
  }

  async function submitMagicLink(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setLoading(false);
    if (err) setError("로그인 링크 전송에 실패했어요. 이메일을 확인해주세요.");
    else setSent(true);
  }

  function switchMode(next) {
    setMode(next);
    setError(null);
    setSent(false);
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <span className="eyebrow">PERSONAL ASSET PASSBOOK</span>
        <h1>MY 자산 통장</h1>

        {mode === "password" ? (
          <>
            <p className="login-copy">이메일과 비밀번호로 로그인하세요.</p>
            <form onSubmit={submitPassword} className="login-form">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                required
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "확인 중…" : "로그인"}
              </button>
            </form>
            <button className="link-btn login-switch" onClick={() => switchMode("magic")}>
              비밀번호가 아직 없으신가요? 이메일 링크로 로그인
            </button>
          </>
        ) : (
          <>
            <p className="login-copy">등록된 이메일로 로그인 링크를 보내드려요.</p>
            {sent ? (
              <p className="login-sent">{email}로 링크를 보냈어요. 메일함을 확인해주세요.</p>
            ) : (
              <form onSubmit={submitMagicLink} className="login-form">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="btn-primary" type="submit" disabled={loading}>
                  {loading ? "전송 중…" : "로그인 링크 받기"}
                </button>
              </form>
            )}
            <button className="link-btn login-switch" onClick={() => switchMode("password")}>
              비밀번호로 로그인
            </button>
          </>
        )}

        {error && <div className="error-banner">{error}</div>}
      </div>
    </div>
  );
}
