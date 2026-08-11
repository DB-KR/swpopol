import { useCallback, useEffect, useState } from "react";

// 무료·키 불필요 환율 API (Frankfurter, ECB 기준 매일 갱신)
export function useFxRates(currencies) {
  const list = [...new Set(currencies)].filter((c) => c && c !== "KRW");
  const key = list.sort().join(",");

  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (list.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        list.map(async (c) => {
          try {
            const res = await fetch(`https://api.frankfurter.app/latest?from=${c}&to=KRW`);
            const data = await res.json();
            return [c, data?.rates?.KRW ?? null];
          } catch (e) {
            return [c, null];
          }
        })
      );
      const next = {};
      results.forEach(([c, rate]) => { if (rate) next[c] = rate; });
      setRates(next);
    } catch (e) {
      setError("환율 정보를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { refresh(); }, [refresh]);

  return { rates, loading, error, refresh };
}
