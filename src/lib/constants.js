export const CATEGORIES = [
  { key: "stock", label: "주식/ETF", color: "#B23A2F" },
  { key: "cash", label: "예적금·현금", color: "#2F6F4E" },
  { key: "realestate", label: "부동산", color: "#1B2A41" },
  { key: "pension", label: "연금/보험", color: "#B08D57" },
];

export function getCategory(key) {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[0];
}
