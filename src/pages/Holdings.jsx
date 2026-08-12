import React from "react";
import { TrendingUp, TrendingDown, Briefcase } from "lucide-react";
import { useData } from "../context/DataContext";
import { formatManwon, formatCurrencyAmount, formatPct, computeAssetReturns } from "../lib/format";
import { getYearColor } from "../lib/constants";
import { useFxRates } from "../lib/useFxRates";
import { AllocationDonut } from "../components/charts";
import PageSkeleton from "../components/PageSkeleton";

export default function Holdings() {
  const { assets, loading } = useData();
  const stocks = assets.filter((a) => a.category === "stock");

  const foreignCurrencies = stocks.map((a) => a.currency).filter((c) => c && c !== "KRW");
  const { rates: fxRates } = useFxRates(foreignCurrencies);

  const totalValue = stocks.reduce((s, a) => s + Number(a.value || 0), 0);

  const stockAllocation = stocks
    .map((a, i) => ({
      key: a.id,
      label: a.name,
      color: getYearColor(i),
      value: Number(a.value || 0),
      pct: totalValue > 0 ? (Number(a.value || 0) / totalValue) * 100 : 0,
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  if (loading) return <PageSkeleton cards={2} />;

  return (
    <div className="page">
      <div className="card">
        <div className="card-head">
          <h2>주식 포트폴리오</h2>
          <span className="card-sub">평가금액 {formatManwon(totalValue)}</span>
        </div>

        {stocks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-ring"><Briefcase size={20} /></div>
            <p>주식/ETF 카테고리 자산이 없어요. [자산 구성]에서 구분을 "주식/ETF"로 추가해보세요.</p>
          </div>
        ) : (
          <div className="holdings-table">
            <div className="holdings-row holdings-head">
              <span>종목명</span>
              <span className="num">수량</span>
              <span className="num">매수가</span>
              <span className="num">현재가</span>
              <span className="num">평가손익</span>
              <span className="num">수익률</span>
            </div>
            {stocks.map((a) => {
              const r = computeAssetReturns(a, fxRates);
              return (
                <div className="holdings-row" key={a.id}>
                  <span data-label="종목명">{a.name}</span>
                  <span data-label="수량" className="num">{a.quantity || "-"}</span>
                  <span data-label="매수가" className="num">{r ? formatCurrencyAmount(r.buy, a.currency) : "-"}</span>
                  <span data-label="현재가" className="num">{r ? formatCurrencyAmount(r.sell, a.currency) : "-"}</span>
                  <span data-label="평가손익" className={`num ${r && r.gainManwon !== null ? (r.gainManwon >= 0 ? "pos" : "neg") : "muted"}`}>
                    {r && r.gainManwon !== null ? `${r.gainManwon >= 0 ? "+" : ""}${formatManwon(r.gainManwon)}` : "-"}
                  </span>
                  <span data-label="수익률" className={`num ${r ? (r.totalReturnPct >= 0 ? "pos" : "neg") : "muted"}`}>
                    {r ? (
                      <>
                        {r.totalReturnPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {formatPct(r.totalReturnPct)}
                      </>
                    ) : "-"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>종목별 비중</h2>
          <span className="card-sub">평가금액 기준</span>
        </div>
        <AllocationDonut allocation={stockAllocation} totalAssets={totalValue} centerLabel="주식 평가금액" />
      </div>
    </div>
  );
}
