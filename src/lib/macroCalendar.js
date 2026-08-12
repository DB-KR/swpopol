// 2026년 주요 거시경제 일정. FOMC·한국은행 금통위·미국 CPI는 공식 발표된 확정 일정이고,
// 한국 CPI는 매월 발표일이 조금씩 달라져서 예상일(추정)로 표시합니다.
// 새해가 되면 이 파일만 다음 해 일정으로 갱신하면 됩니다.
export const MACRO_EVENTS = [
  // FOMC (미국 연방공개시장위원회, 금리 발표일 기준)
  { date: "2026-09-16", country: "US", category: "fomc", title: "FOMC 금리 결정", confirmed: true },
  { date: "2026-10-28", country: "US", category: "fomc", title: "FOMC 금리 결정", confirmed: true },
  { date: "2026-12-09", country: "US", category: "fomc", title: "FOMC 금리 결정", confirmed: true },

  // 한국은행 금융통화위원회 (기준금리 결정)
  { date: "2026-08-27", country: "KR", category: "rate", title: "한국은행 기준금리 결정", confirmed: true },
  { date: "2026-10-22", country: "KR", category: "rate", title: "한국은행 기준금리 결정", confirmed: true },
  { date: "2026-11-26", country: "KR", category: "rate", title: "한국은행 기준금리 결정", confirmed: true },

  // 미국 소비자물가지수 (BLS)
  { date: "2026-09-11", country: "US", category: "cpi", title: "미국 CPI 발표", confirmed: true },
  { date: "2026-10-14", country: "US", category: "cpi", title: "미국 CPI 발표", confirmed: true },
  { date: "2026-11-10", country: "US", category: "cpi", title: "미국 CPI 발표", confirmed: true },
  { date: "2026-12-10", country: "US", category: "cpi", title: "미국 CPI 발표", confirmed: true },

  // 한국 소비자물가동향 (통계청/국가데이터처, 매월 발표일이 조금씩 달라 추정일)
  { date: "2026-09-03", country: "KR", category: "cpi", title: "한국 소비자물가동향", confirmed: false },
  { date: "2026-10-05", country: "KR", category: "cpi", title: "한국 소비자물가동향", confirmed: false },
  { date: "2026-11-04", country: "KR", category: "cpi", title: "한국 소비자물가동향", confirmed: false },
  { date: "2026-12-31", country: "KR", category: "cpi", title: "한국 소비자물가동향(연간)", confirmed: false },
];
