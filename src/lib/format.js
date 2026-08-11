export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  return `${y}.${m}`;
}

export function formatManwon(v) {
  if (v === null || v === undefined || isNaN(v)) return "-";
  const neg = v < 0;
  const abs = Math.round(Math.abs(v));
  const eok = Math.floor(abs / 10000);
  const man = abs % 10000;
  let str;
  if (eok > 0 && man > 0) str = `${eok.toLocaleString("ko-KR")}억 ${man.toLocaleString("ko-KR")}만원`;
  else if (eok > 0) str = `${eok.toLocaleString("ko-KR")}억원`;
  else str = `${man.toLocaleString("ko-KR")}만원`;
  return (neg ? "-" : "") + str;
}

export function formatPct(v, digits = 1) {
  if (v === null || v === undefined || isNaN(v)) return "-";
  return `${v >= 0 ? "+" : ""}${v.toFixed(digits)}%`;
}

export function aggregateCashflowByMonth(items) {
  const map = {};
  items.forEach((it) => {
    if (!map[it.month]) map[it.month] = { month: it.month, income: 0, expense: 0 };
    if (it.type === "income") map[it.month].income += Number(it.amount) || 0;
    else map[it.month].expense += Number(it.amount) || 0;
  });
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
}

const CURRENCY_SYMBOLS = { KRW: "₩", USD: "$", JPY: "¥", EUR: "€", CNY: "¥" };

export function formatCurrencyAmount(value, currencyKey) {
  if (value === null || value === undefined || value === "" || isNaN(value)) return "-";
  const symbol = CURRENCY_SYMBOLS[currencyKey] || "";
  return `${symbol}${Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

// 매수가/매도가(+환율)로부터 가격 수익률, 환차손익률, 총수익률(%)을 계산합니다.
// 외화 자산이 아니거나 값이 비어있으면 null을 반환합니다. fxRates는 { USD: 1350.2, ... } 형태의 현재 환율입니다.
export function computeAssetReturns(asset, fxRates = {}) {
  const buy = asset.buy_price;
  const sell = asset.sell_price;
  if (buy === null || buy === undefined || buy === "" || Number(buy) === 0) return null;
  if (sell === null || sell === undefined || sell === "") return null;

  const priceReturnPct = ((Number(sell) - Number(buy)) / Number(buy)) * 100;

  const isForeign = asset.currency && asset.currency !== "KRW";
  const buyFx = asset.buy_fx_rate;
  const hasFx = isForeign && buyFx !== null && buyFx !== undefined && buyFx !== "" && Number(buyFx) !== 0;

  let fxReturnPct = null;
  let totalReturnPct = priceReturnPct;
  let currentFxRate = null;

  if (hasFx) {
    currentFxRate = fxRates[asset.currency] || null;
    if (currentFxRate) {
      fxReturnPct = ((currentFxRate - Number(buyFx)) / Number(buyFx)) * 100;
      totalReturnPct = ((1 + priceReturnPct / 100) * (1 + fxReturnPct / 100) - 1) * 100;
    }
  }

  return {
    priceReturnPct,
    fxReturnPct,
    totalReturnPct,
    currentFxRate,
    hasFx,
    isForeign,
    buy,
    sell,
  };
}

// 스냅샷 기록을 연도별로 묶어, 각 연도의 마지막 기록을 기준으로 목표 대비 달성률(%)을 계산합니다.
export function computeYearlyGoalProgress(snapshots, targetAmount) {
  if (!targetAmount || targetAmount <= 0) return [];
  const byYear = {};
  snapshots.forEach((s) => {
    const year = s.month.slice(0, 4);
    if (!byYear[year] || s.month > byYear[year].month) byYear[year] = s;
  });
  return Object.keys(byYear)
    .sort()
    .map((year) => ({
      year,
      total: byYear[year].total,
      pct: (byYear[year].total / targetAmount) * 100,
    }));
}

// 목표 게이지를 연도별 색상 구간으로 나눕니다. 완료된 연도는 그 해 마지막 스냅샷을,
// 올해는 실시간 총자산을 사용합니다. 자산이 줄어든 해는 구간 폭이 0이 되어 표시되지 않습니다.
export function computeGaugeSegments(snapshots, targetAmount, totalAssets, colorFn) {
  if (!targetAmount || targetAmount <= 0) return [];
  const thisYear = String(new Date().getFullYear());
  const totals = {};
  snapshots.forEach((s) => {
    const year = s.month.slice(0, 4);
    if (!totals[year] || s.month > totals[year].month) totals[year] = { month: s.month, total: s.total };
  });
  const yearTotal = {};
  Object.keys(totals).forEach((y) => { yearTotal[y] = totals[y].total; });
  yearTotal[thisYear] = totalAssets;

  const years = Object.keys(yearTotal).sort();
  let prevPct = 0;
  return years.map((year, i) => {
    const pct = Math.min(100, (yearTotal[year] / targetAmount) * 100);
    const to = Math.max(prevPct, pct);
    const from = prevPct;
    prevPct = to;
    return { year, from, to, color: colorFn(i) };
  });
}
