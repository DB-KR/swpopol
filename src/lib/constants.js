export const CATEGORIES = [
  { key: "stock", label: "주식/ETF", color: "#B23A2F" },
  { key: "cash", label: "예적금·현금", color: "#2F6F4E" },
  { key: "realestate", label: "부동산", color: "#1B2A41" },
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
  { key: "telecom", label: "통신비", color: "#1B2A41" },
  { key: "insurance", label: "보험비", color: "#B08D57" },
  { key: "other_expense", label: "기타지출", color: "#5B6472" },
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
