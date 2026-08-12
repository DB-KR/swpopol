import React, { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { supabase } from "../lib/supabase";
import { formatManwon, formatPct, computeAnnualReport } from "../lib/format";
import { useFxRates } from "../lib/useFxRates";
import { CumulativeReturnChart, MarketIndexChart } from "../components/charts";

export default function Performance() {
  const { assets, snapshots, loading } = useData();
  const [indices, setIndices] = useState([]);
  const [indicesLoading, setIndicesLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIndicesLoading(true);
      const { data } = await supabase
        .from("market_indices")
        .select("*")
        .order("date", { ascending: true })
        .limit(400);
      setIndices(data || []);
      setIndicesLoading(false);
    })();
  }, []);

  const foreignCurrencies = assets.map((a) => a.currency).filter((c) => c && c !== "KRW");
  const { rates: fxRates } = useFxRates(foreignCurrencies);

  // 포트폴리오 누적 수익률 (첫 스냅샷 대비)
  const sortedSnapshots = [...snapshots].sort((a, b) => a.month.localeCompare(b.month));
  const firstTotal = sortedSnapshots[0]?.total;
  const cumData = sortedSnapshots.map((s) => ({
    month: s.month,
    cumPct: firstTotal ? ((s.total - firstTotal) / firstTotal) * 100 : 0,
  }));
  const latestCumPct = cumData.length > 0 ? cumData[cumData.length - 1].cumPct : null;

  // 환차익 vs 주가수익 기여 (수량이 있는 외화 자산만 집계 가능)
  const foreignWithQty = assets.filter(
    (a) => a.currency && a.currency !== "KRW" && a.quantity && a.buy_price && a.sell_price && a.buy_fx_rate
  );
  let priceContrib = 0;
  let fxContrib = 0;
  foreignWithQty.forEach((a) => {
    const currentRate = fxRates[a.currency] || Number(a.buy_fx_rate);
    const qty = Number(a.quantity);
    fxContrib += (qty * Number(a.buy_price) * (currentRate - Number(a.buy_fx_rate))) / 10000;
    priceContrib += (qty * currentRate * (Number(a.sell_price) - Number(a.buy_price))) / 10000;
  });
  const hasContribData = foreignWithQty.length > 0;

  // 시장지수 데이터를 날짜별로 피벗 (recharts용 {date, SP500, KOSPI} 형태)
  const indexByDate = {};
  indices.forEach((row) => {
    if (!indexByDate[row.date]) indexByDate[row.date] = { date: row.date.slice(5) };
    indexByDate[row.date][row.symbol] = Number(row.value);
  });
  const indexData = Object.values(indexByDate);
  const latestSP500 = [...indices].reverse().find((r) => r.symbol === "SP500");
  const latestKOSPI = [...indices].reverse().find((r) => r.symbol === "KOSPI");

  const annualReport = computeAnnualReport(snapshots);

  if (loading) return <div className="loading-screen">불러오는 중…</div>;

  return (
    <div className="page">
      <div className="card">
        <div className="card-head">
          <h2>포트폴리오 누적 수익률</h2>
          {latestCumPct !== null && (
            <span className={`card-sub ${latestCumPct >= 0 ? "pos" : "neg"}`}>
              누적 {formatPct(latestCumPct)}
            </span>
          )}
        </div>
        <CumulativeReturnChart data={cumData} />
      </div>

      <div className="card">
        <div className="card-head">
          <h2>환율 변동 영향 분리</h2>
          <span className="card-sub">외화 자산의 주가 수익 vs 환차익 기여도</span>
        </div>
        {!hasContribData ? (
          <div className="empty-state">
            <div className="empty-ring" />
            <p>외화 자산에 수량·매수가·매도가·매수 시 환율을 모두 입력하면 계산돼요.</p>
          </div>
        ) : (
          <div className="contrib-summary">
            <div className="contrib-item">
              <span className="networth-label">주가 수익 기여</span>
              <span className={`networth-value ${priceContrib >= 0 ? "pos" : "neg"}`}>
                {priceContrib >= 0 ? "+" : ""}{formatManwon(priceContrib)}
              </span>
            </div>
            <div className="contrib-item">
              <span className="networth-label">환차익 기여</span>
              <span className={`networth-value ${fxContrib >= 0 ? "pos" : "neg"}`}>
                {fxContrib >= 0 ? "+" : ""}{formatManwon(fxContrib)}
              </span>
            </div>
            <div className="contrib-item">
              <span className="networth-label">합계</span>
              <span className={`networth-value strong ${priceContrib + fxContrib >= 0 ? "pos" : "neg"}`}>
                {priceContrib + fxContrib >= 0 ? "+" : ""}{formatManwon(priceContrib + fxContrib)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>연간 리포트</h2>
          <span className="card-sub">연말 스냅샷 기준 전년대비 증감</span>
        </div>
        {annualReport.length === 0 ? (
          <div className="empty-state">
            <div className="empty-ring" />
            <p>연도별 스냅샷이 쌓이면 전년대비 증감이 표시돼요.</p>
          </div>
        ) : (
          <div className="rebalance-table">
            <div className="rebalance-row rebalance-head">
              <span>연도</span><span className="num">연말 자산</span><span className="num">전년대비</span><span className="num">부동산/금융</span>
            </div>
            {[...annualReport].reverse().map((r) => (
              <div className="rebalance-row" key={r.year}>
                <span>{r.year}년</span>
                <span className="num">{formatManwon(r.total)}</span>
                <span className={`num ${r.yoyPct === null ? "muted" : r.yoyPct >= 0 ? "pos" : "neg"}`}>
                  {r.yoyPct === null ? "-" : formatPct(r.yoyPct)}
                </span>
                <span className="num muted" style={{ fontSize: 11 }}>
                  {r.realEstateYoyPct === null ? "-" : formatPct(r.realEstateYoyPct, 0)} / {r.financialYoyPct === null ? "-" : formatPct(r.financialYoyPct, 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>시장지수 비교</h2>
          <span className="card-sub">매일 자동 수집 (S&P500 · KOSPI)</span>
        </div>
        <div className="hero-pills" style={{ marginBottom: 12 }}>
          {latestSP500 && <span className="pill">S&P500 {latestSP500.value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })} ({latestSP500.date})</span>}
          {latestKOSPI && <span className="pill">KOSPI {latestKOSPI.value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })} ({latestKOSPI.date})</span>}
        </div>
        {indicesLoading ? (
          <div className="empty-state"><div className="empty-ring" /><p>불러오는 중…</p></div>
        ) : (
          <MarketIndexChart data={indexData} />
        )}
      </div>
    </div>
  );
}
