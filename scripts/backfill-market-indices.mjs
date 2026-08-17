// 1회성 스크립트: S&P500(^GSPC), KOSPI(^KS11)의 최근 5년치 일별 종가를
// Yahoo Finance 비공식 차트 엔드포인트에서 한 번에 받아와 market_indices 테이블에 채워넣습니다.
//
// 이후 매일 도는 fetch-market-indices.mjs(크론잡)가 그날그날 값을 계속 추가하기만 하고,
// 이 스크립트가 넣은 과거 데이터를 지우는 로직은 없습니다 — 즉 데이터는 계속 쌓이기만 합니다.
//
// 실행 방법: GitHub 저장소의 Actions 탭 → "Backfill Market Indices" 워크플로 →
// "Run workflow" 버튼으로 한 번만 실행하면 됩니다. (이미 등록된 SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY 시크릿을 그대로 재사용합니다.)
//
// Yahoo의 v8 chart 엔드포인트는 공식 API가 아니라서 예고 없이 막히거나 바뀔 수 있습니다.
// 실패해도 이미 저장된 데이터는 그대로 남고, 실패한 심볼만 다시 시도하면 됩니다.

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

const RANGE = "5y";
const INTERVAL = "1d";
const CHUNK_SIZE = 500;

function toDateString(unixSeconds) {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

async function fetchHistory(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${RANGE}&interval=${INTERVAL}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  const timestamps = result?.timestamp;
  const closes = result?.indicators?.quote?.[0]?.close;
  if (!Array.isArray(timestamps) || !Array.isArray(closes)) {
    throw new Error("시계열 데이터를 찾지 못했어요");
  }
  const rows = [];
  timestamps.forEach((ts, i) => {
    const value = closes[i];
    if (typeof value === "number") {
      rows.push({ date: toDateString(ts), value });
    }
  });
  return rows;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function upsertRows(symbol, rows) {
  for (const batch of chunk(rows, CHUNK_SIZE)) {
    const payload = batch.map((r) => ({ date: r.date, symbol, value: r.value }));
    const res = await fetch(`${SUPABASE_URL}/rest/v1/market_indices?on_conflict=date,symbol`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase 저장 실패 (${res.status}): ${text}`);
    }
  }
}

async function main() {
  let failures = 0;

  for (const { symbol, ticker } of TARGETS) {
    try {
      const rows = await fetchHistory(ticker);
      await upsertRows(symbol, rows);
      console.log(`✓ ${symbol}: ${rows.length}건 저장 (${rows[0]?.date} ~ ${rows[rows.length - 1]?.date})`);
    } catch (e) {
      failures += 1;
      console.error(`✗ ${symbol} 실패: ${e.message}`);
    }
  }

  if (failures === TARGETS.length) {
    process.exit(1);
  }
}

main();
