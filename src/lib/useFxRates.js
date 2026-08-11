import { useCallback, useEffect, useState } from "react";

// 무료·키 불필요 환율 API (Frankfurter, ECB 기준 매일 갱신).
// 최신 도메인(frankfurter.dev)을 먼저 시도하고, 실패하면 예전 도메인(frankfurter.app)으로 재시도합니다.
async function fetchKrwRate(base) {
  const attempts = [
    { url: `https://api.frankfurter.dev/v2/rate/${base}/KRW`, extract: (d) => d?.rate },
    { url: `https://api.frankfurter.app/latest?from=${base}&to=KRW`, extract: (d) => d?.rates?.KRW },
  ];
  for (const { url, extract } of attempts) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const rate = extract(data);
      if (rate) return rate;
    } catch (e) {
      // 다음 후보로 재시도
    }
  }
  return null;
}

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
      const results = await Promise.all(list.map(async (c) => [c, await fetchKrwRate(c)]));
      const next = {};
      results.forEach(([c, rate]) => { if (rate) next[c] = rate; });
      setRates(next);
      if (Object.keys(next).length === 0) setError("환율 정보를 불러오지 못했어요.");
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
