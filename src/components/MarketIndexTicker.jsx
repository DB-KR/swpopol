import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useMarketIndices } from "../lib/useMarketIndices";
import { formatPct } from "../lib/format";

export default function MarketIndexTicker() {
  const { indices, loading, error } = useMarketIndices();

  if (loading) {
    return (
      <div className="market-ticker market-ticker-empty">
        <span className="muted">시장 지수 불러오는 중…</span>
      </div>
    );
  }

  if (error || indices.length === 0) {
    return (
      <div className="market-ticker market-ticker-empty">
        <span className="muted">{error || "표시할 시장 지수가 없어요."}</span>
      </div>
    );
  }

  return (
    <div className="market-ticker">
      {indices.map((idx) => (
        <div className="market-ticker-item" key={idx.symbol}>
          <span className="market-ticker-symbol">{idx.label}</span>
          <span className="market-ticker-value">{idx.value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}</span>
          {idx.changePct !== null && (
            <span className={`market-ticker-change ${idx.changePct >= 0 ? "pos" : "neg"}`}>
              {idx.changePct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {formatPct(idx.changePct)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
