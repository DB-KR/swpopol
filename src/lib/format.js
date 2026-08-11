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
