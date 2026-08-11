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

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${y}.${m}.${d}`;
}

// 매수가/매도가(+환율/매수일)로부터 가격 수익률, 환차손익률, 총수익률, 연환산 수익률(%)을 계산합니다.
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

  let annualizedReturnPct = null;
  let holdingDays = null;
  if (asset.buy_date) {
    const buyDate = new Date(asset.buy_date);
    const days = (Date.now() - buyDate.getTime()) / (1000 * 60 * 60 * 24);
    if (days > 0) {
      holdingDays = days;
      const growth = 1 + totalReturnPct / 100;
      if (growth > 0) {
        annualizedReturnPct = (Math.pow(growth, 365 / days) - 1) * 100;
      }
    }
  }

  // 수량이 있으면 절대 평가손익(만원)도 계산합니다.
  let gainManwon = null;
  const qty = asset.quantity;
  if (qty !== null && qty !== undefined && qty !== "" && Number(qty) > 0) {
    const rateForBuy = isForeign ? Number(buyFx) || 0 : 1;
    const rateForSell = isForeign ? (currentFxRate || Number(buyFx) || 0) : 1;
    if (!isForeign || (rateForBuy && rateForSell)) {
      const boughtManwon = (Number(qty) * Number(buy) * rateForBuy) / 10000;
      const nowManwon = (Number(qty) * Number(sell) * rateForSell) / 10000;
      gainManwon = nowManwon - boughtManwon;
    }
  }

  return {
    priceReturnPct,
    fxReturnPct,
    totalReturnPct,
    annualizedReturnPct,
    holdingDays,
    gainManwon,
    quantity: qty,
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
// 올해는 실시간 현재값(currentValue)을 사용합니다. valueKey로 total/real_estate_total/financial_total 중 선택합니다.
export function computeGaugeSegments(snapshots, targetAmount, currentValue, colorFn, valueKey = "total") {
  if (!targetAmount || targetAmount <= 0) return [];
  const thisYear = String(new Date().getFullYear());
  const latestByYear = {};
  snapshots.forEach((s) => {
    const year = s.month.slice(0, 4);
    if (!latestByYear[year] || s.month > latestByYear[year].month) latestByYear[year] = s;
  });
  const yearValue = {};
  Object.keys(latestByYear).forEach((y) => { yearValue[y] = Number(latestByYear[y][valueKey]) || 0; });
  yearValue[thisYear] = currentValue;

  const years = Object.keys(yearValue).sort();
  let prevPct = 0;
  return years.map((year, i) => {
    const pct = Math.min(100, (yearValue[year] / targetAmount) * 100);
    const to = Math.max(prevPct, pct);
    const from = prevPct;
    prevPct = to;
    return { year, from, to, color: colorFn(i) };
  });
}
