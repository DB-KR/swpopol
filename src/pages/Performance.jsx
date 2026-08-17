import React, { useEffect, useState } from "react";
import { Percent, Calendar } from "lucide-react";
import { useData } from "../context/DataContext";
import { supabase } from "../lib/supabase";
import { formatManwon, formatPct, computeAnnualReport } from "../lib/format";
import { useFxRates } from "../lib/useFxRates";
import { CumulativeReturnChart, SingleIndexChart, BenchmarkCompareChart } from "../components/charts";
import PageSkeleton from "../components/PageSkeleton";

export default function Performance() {
  const { assets, snapshots, loading } = useData();
  const [indices, setIndices] = useState([]);
  const [indicesLoading, setIndicesLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIndicesLoading(true);
      // Supabase 프로젝트의 API "Max Rows" 설정이 응답 건수를 강제로 제한할 수 있어서
      // (기본값 1000 등), 오래된 순으로 가져오면 최신 데이터가 잘려나갈 수 있습니다.
      // 최신순(내림차순)으로 가져온 뒤 화면에서 다시 오래된 순으로 뒤집어서,
      // 응답이 잘리더라도 최근 데이터가 우선 보이도록 합니다.
      const { data } = await supabase
        .from("market_indices")
        .select("*")
        .order("date", { ascending: false })
        .limit(4000);
      setIndices((data || []).slice().reverse());
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

  // 심볼별 원본 시계열 ({date, value} 오름차순) — 지수별로 카드를 따로 그리고
  // 기간 버튼으로 구간을 좁혀 보여주기 위해 SingleIndexChart에 그대로 넘깁니다.
  const sp500Rows = indices.filter((r) => r.symbol === "SP500").map((r) => ({ date: r.date, value: Number(r.value) }));
  const kospiRows = indices.filter((r) => r.symbol === "KOSPI").map((r) => ({ date: r.date, value: Number(r.value) }));

  // 지수를 "그 달의 최신값"으로 월별 집계 (indices가 date 오름차순이라 덮어쓰면 마지막 값이 남음)
  const monthlyIndexBySymbol = {};
  indices.forEach((row) => {
    const month = row.date.slice(0, 7);
    if (!monthlyIndexBySymbol[row.symbol]) monthlyIndexBySymbol[row.symbol] = {};
    monthlyIndexBySymbol[row.symbol][month] = Number(row.value);
  });

  // 내 자산 스냅샷과 지수(월별)를 같은 시작월 기준 등락률(%)로 정규화해서 비교합니다.
  // 지수 데이터가 있는 첫 스냅샷 달을 0%로 놓고, 그 이후 스냅샷만 사용합니다.
  function buildBenchmarkCompareData(monthlyIndex) {
    const withIndex = sortedSnapshots.filter((s) => monthlyIndex && monthlyIndex[s.month] != null);
    if (withIndex.length === 0) return [];
    const baseTotal = withIndex[0].total;
    const baseIndex = monthlyIndex[withIndex[0].month];
    if (!baseIndex) return [];
    return withIndex.map((s) => ({
      month: s.month,
      portfolioPct: baseTotal ? ((s.total - baseTotal) / baseTotal) * 100 : 0,
      indexPct: ((monthlyIndex[s.month] - baseIndex) / baseIndex) * 100,
    }));
  }
  const sp500CompareData = buildBenchmarkCompareData(monthlyIndexBySymbol.SP500);
  const kospiCompareData = buildBenchmarkCompareData(monthlyIndexBySymbol.KOSPI);

  const annualReport = computeAnnualReport(snapshots);

  if (loading) return <PageSkeleton cards={3} />;

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

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h2>S&P500 vs 내 자산</h2>
            <span className="card-sub">월별 등락률 비교</span>
          </div>
          {indicesLoading ? (
            <div className="empty-state"><div className="empty-ring" /><p>불러오는 중…</p></div>
          ) : (
            <BenchmarkCompareChart data={sp500CompareData} indexLabel="S&P500" indexColor="var(--stamp-red)" />
          )}
        </div>
        <div className="card">
          <div className="card-head">
            <h2>KOSPI vs 내 자산</h2>
            <span className="card-sub">월별 등락률 비교</span>
          </div>
          {indicesLoading ? (
            <div className="empty-state"><div className="empty-ring" /><p>불러오는 중…</p></div>
          ) : (
            <BenchmarkCompareChart data={kospiCompareData} indexLabel="KOSPI" indexColor="var(--ink)" />
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>환율 변동 영향 분리</h2>
          <span className="card-sub">외화 자산의 주가 수익 vs 환차익 기여도</span>
        </div>
        {!hasContribData ? (
          <div className="empty-state">
            <div className="empty-ring"><Percent size={20} /></div>
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
            <div className="empty-ring"><Calendar size={20} /></div>
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

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h2>S&P500 지수</h2>
            <span className="card-sub">매일 자동 수집</span>
          </div>
          {indicesLoading ? (
            <div className="empty-state"><div className="empty-ring" /><p>불러오는 중…</p></div>
          ) : (
            <SingleIndexChart rows={sp500Rows} label="S&P500" color="var(--stamp-red)" />
          )}
        </div>
        <div className="card">
          <div className="card-head">
            <h2>KOSPI 지수</h2>
            <span className="card-sub">매일 자동 수집</span>
          </div>
          {indicesLoading ? (
            <div className="empty-state"><div className="empty-ring" /><p>불러오는 중…</p></div>
          ) : (
            <SingleIndexChart rows={kospiRows} label="KOSPI" color="var(--ink)" />
          )}
        </div>
      </div>
    </div>
  );
}
