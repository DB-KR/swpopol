export const CATEGORIES = [
  { key: "stock", label: "주식/ETF", color: "#E11D48" },
  { key: "cash", label: "예적금·현금", color: "#0D9488" },
  { key: "realestate", label: "부동산", color: "#4F46E5" },
  { key: "pension", label: "연금/보험", color: "#D97706" },
];

export function getCategory(key) {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[0];
}

export const INCOME_CATEGORIES = [
  { key: "salary", label: "월급", color: "#0D9488" },
  { key: "other_income", label: "기타수입", color: "#D97706" },
];

export const EXPENSE_CATEGORIES = [
  { key: "living", label: "생활비", color: "#E11D48" },
  { key: "telecom", label: "통신비", color: "#4F46E5" },
  { key: "insurance", label: "보험비", color: "#D97706" },
  { key: "loan_repayment", label: "대출상환", color: "#9333EA" },
  { key: "other_expense", label: "기타지출", color: "#64748B" },
];

export function getIncomeCategory(key) {
  return INCOME_CATEGORIES.find((c) => c.key === key) || INCOME_CATEGORIES[0];
}

export function getExpenseCategory(key) {
  return EXPENSE_CATEGORIES.find((c) => c.key === key) || EXPENSE_CATEGORIES[0];
}

export const CURRENCIES = [
  { key: "KRW", label: "원화 (KRW)", symbol: "₩" },
  { key: "USD", label: "미국달러 (USD)", symbol: "$" },
  { key: "JPY", label: "일본엔 (JPY)", symbol: "¥" },
  { key: "EUR", label: "유로 (EUR)", symbol: "€" },
  { key: "CNY", label: "위안 (CNY)", symbol: "¥" },
];

export function getCurrency(key) {
  return CURRENCIES.find((c) => c.key === key) || CURRENCIES[0];
}

// 티커 자동 시세 갱신 시, 코스피/코스닥 종목은 Yahoo Finance 조회용으로 .KS/.KQ를 자동으로 붙여줍니다.
export const TICKER_MARKETS = [
  { key: "US", label: "해외(미국 등)", suffix: "" },
  { key: "KOSPI", label: "코스피", suffix: ".KS" },
  { key: "KOSDAQ", label: "코스닥", suffix: ".KQ" },
];

export function getTickerMarket(key) {
  return TICKER_MARKETS.find((m) => m.key === key) || TICKER_MARKETS[0];
}

export const YEAR_COLORS = ["#0D9488", "#4F46E5", "#E11D48", "#D97706", "#64748B", "#9333EA"];

export function getYearColor(index) {
  return YEAR_COLORS[index % YEAR_COLORS.length];
}

// 자산 마일스톤 (만원 단위): 1억, 3억, 5억, 10억, 20억
export const ASSET_MILESTONES = [10000, 30000, 50000, 100000, 200000];

export const LIABILITY_CATEGORIES = [
  { key: "mortgage", label: "주택담보대출", color: "#E11D48" },
  { key: "credit", label: "신용대출", color: "#D97706" },
  { key: "jeonse", label: "전세자금대출", color: "#4F46E5" },
  { key: "other", label: "기타부채", color: "#64748B" },
];

export function getLiabilityCategory(key) {
  return LIABILITY_CATEGORIES.find((c) => c.key === key) || LIABILITY_CATEGORIES[3];
}
