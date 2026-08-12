import { useEffect, useState } from "react";
import { supabase } from "./supabase";

// GitHub Actions 크론잡이 하루 한 번(마지막 실행 기준) 채워넣는 market_indices 테이블에서
// 심볼별 최신값과 전일 대비 변화율을 계산합니다.
const SYMBOL_ORDER = ["KOSPI", "SP500"];
export const SYMBOL_LABEL = { KOSPI: "코스피", SP500: "S&P 500" };

export function useMarketIndices() {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from("market_indices")
        .select("date, symbol, value")
        .order("date", { ascending: false })
        .limit(40);

      if (cancelled) return;

      if (err) {
        setError("시장 지수를 불러오지 못했어요.");
        setIndices([]);
        setLoading(false);
        return;
      }

      const bySymbol = {};
      (data || []).forEach((row) => {
        if (!bySymbol[row.symbol]) bySymbol[row.symbol] = [];
        bySymbol[row.symbol].push(row);
      });

      const result = Object.entries(bySymbol).map(([symbol, rows]) => {
        const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
        const latest = sorted[0];
        const prev = sorted[1];
        const changePct = prev && prev.value ? ((latest.value - prev.value) / prev.value) * 100 : null;
        return {
          symbol,
          label: SYMBOL_LABEL[symbol] || symbol,
          value: latest.value,
          date: latest.date,
          changePct,
        };
      });

      result.sort((a, b) => {
        const ia = SYMBOL_ORDER.indexOf(a.symbol);
        const ib = SYMBOL_ORDER.indexOf(b.symbol);
        if (ia === -1 && ib === -1) return a.symbol.localeCompare(b.symbol);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });

      setIndices(result);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { indices, loading, error };
}
