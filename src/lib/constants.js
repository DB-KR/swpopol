export const CATEGORIES = [
  { key: "stock", label: "주식/ETF", color: "#B23A2F" },
  { key: "cash", label: "예적금·현금", color: "#2F6F4E" },
  { key: "realestate", label: "부동산", color: "#5C6F9E" },
  { key: "pension", label: "연금/보험", color: "#B08D57" },
];

export function getCategory(key) {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[0];
}

export const INCOME_CATEGORIES = [
  { key: "salary", label: "월급", color: "#2F6F4E" },
  { key: "other_income", label: "기타수입", color: "#B08D57" },
];

export const EXPENSE_CATEGORIES = [
  { key: "living", label: "생활비", color: "#B23A2F" },
  { key: "telecom", label: "통신비", color: "#5C6F9E" },
  { key: "insurance", label: "보험비", color: "#B08D57" },
  { key: "loan_repayment", label: "대출상환", color: "#8B4A5C" },
  { key: "other_expense", label: "기타지출", color: "#8A7F6E" },
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

export const YEAR_COLORS = ["#2F6F4E", "#5C6F9E", "#B23A2F", "#B08D57", "#8A7F6E", "#6B8F71"];

export function getYearColor(index) {
  return YEAR_COLORS[index % YEAR_COLORS.length];
}

// 자산 마일스톤 (만원 단위): 1억, 3억, 5억, 10억, 20억
export const ASSET_MILESTONES = [10000, 30000, 50000, 100000, 200000];

export const LIABILITY_CATEGORIES = [
  { key: "mortgage", label: "주택담보대출", color: "#B23A2F" },
  { key: "credit", label: "신용대출", color: "#B08D57" },
  { key: "jeonse", label: "전세자금대출", color: "#5C6F9E" },
  { key: "other", label: "기타부채", color: "#8A7F6E" },
];

export function getLiabilityCategory(key) {
  return LIABILITY_CATEGORIES.find((c) => c.key === key) || LIABILITY_CATEGORIES[3];
}
