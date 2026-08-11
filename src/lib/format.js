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
// 외화 자산이 아니거나 값이 비어있으면 해당 항목은 null로 반환합니다.
export function computeAssetReturns(asset) {
  const buy = asset.buy_price;
  const sell = asset.sell_price;
  if (buy === null || buy === undefined || buy === "" || Number(buy) === 0) return null;
  if (sell === null || sell === undefined || sell === "") return null;

  const priceReturnPct = ((Number(sell) - Number(buy)) / Number(buy)) * 100;

  const isForeign = asset.currency && asset.currency !== "KRW";
  const buyFx = asset.buy_fx_rate;
  const hasFx = isForeign && buyFx !== null && buyFx !== undefined && buyFx !== "" && Number(buyFx) !== 0;

  return {
    priceReturnPct,
    hasFx,
    buy,
    sell,
    isForeign,
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
