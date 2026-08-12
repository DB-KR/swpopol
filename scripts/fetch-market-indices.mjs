// GitHub Actions에서 하루 두 번(한국시간 07:00, 18:00) 실행되어
// S&P500(^GSPC), KOSPI(^KS11) 값을 Yahoo Finance 비공식 엔드포인트에서 가져와
// Supabase의 market_indices 테이블에 저장합니다.
//
// Yahoo의 v8 chart 엔드포인트는 공식 API가 아니라서 예고 없이 막히거나 바뀔 수 있습니다.
// 실패해도 워크플로 전체가 죽지 않도록 지수별로 개별 처리합니다.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 없어요.");
  process.exit(1);
}

const TARGETS = [
  { symbol: "SP500", ticker: "^GSPC" },
  { symbol: "KOSPI", ticker: "^KS11" },
];

function todayKST() {
  const now = new Date();
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, "0");
  const d = String(kst.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function fetchYahooPrice(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (typeof price !== "number") throw new Error("가격 필드를 찾지 못했어요");
  return price;
}

async function upsertIndex(symbol, value, date) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/market_indices?on_conflict=date,symbol`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ date, symbol, value }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase 저장 실패 (${res.status}): ${text}`);
  }
}

async function main() {
  const date = todayKST();
  let failures = 0;

  for (const { symbol, ticker } of TARGETS) {
    try {
      const price = await fetchYahooPrice(ticker);
      await upsertIndex(symbol, price, date);
      console.log(`✓ ${symbol} = ${price} (${date})`);
    } catch (e) {
      failures += 1;
      console.error(`✗ ${symbol} 실패: ${e.message}`);
    }
  }

  // 전부 실패한 경우에만 워크플로를 실패로 표시 (부분 실패는 다음 실행 때 다시 시도)
  if (failures === TARGETS.length) {
    process.exit(1);
  }
}

main();
