import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setLoading(false);
    if (err) setError("로그인 링크 전송에 실패했어요. 이메일을 확인해주세요.");
    else setSent(true);
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <span className="eyebrow">PERSONAL ASSET PASSBOOK</span>
        <h1>MY 자산 통장</h1>
        <p className="login-copy">등록된 이메일로 로그인 링크를 보내드려요.</p>

        {sent ? (
          <p className="login-sent">{email}로 링크를 보냈어요. 메일함을 확인해주세요.</p>
        ) : (
          <form onSubmit={submit} className="login-form">
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

        {error && <div className="error-banner">{error}</div>}
      </div>
    </div>
  );
}
