// 하루 두 번(fetch-market-indices.mjs와 같은 스케줄) 실행되어, 티커가 입력된 종목 자산의
// 현재가(sell_price)와 평가금액(value)을 최신 종가로 자동 갱신합니다.
// 티커가 비어있는 자산(부동산·현금 등, 또는 수동 관리를 원하는 종목)은 건드리지 않습니다.
//
// 코스피/코스닥 종목은 ticker_market 값에 따라 Yahoo Finance 조회용으로 .KS/.KQ를 자동으로 붙입니다.
// 외화 종목은 평가금액 재계산에 원/외화 환율이 필요해서, Frankfurter(무료·키 불필요) 환율 API를 사용합니다.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 없어요.");
  process.exit(1);
}

const MARKET_SUFFIX = { US: "", KOSPI: ".KS", KOSDAQ: ".KQ" };

function toYahooTicker(ticker, market) {
  const suffix = MARKET_SUFFIX[market] ?? "";
  return `${ticker}${suffix}`;
}

async function fetchYahooPrice(yahooTicker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (typeof price !== "number") throw new Error("가격 필드를 찾지 못했어요");
  return price;
}

async function fetchKrwRate(base) {
  const attempts = [
    { url: `https://api.frankfurter.dev/v2/rate/${base}/KRW`, extract: (d) => d?.rate },
    { url: `https://api.frankfurter.app/latest?from=${base}&to=KRW`, extract: (d) => d?.rates?.KRW },
  ];
  for (const { url, extract } of attempts) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const rate = extract(data);
      if (rate) return rate;
    } catch (e) {
      // 다음 후보로 재시도
    }
  }
  return null;
}

async function fetchAssets() {
  const url = `${SUPABASE_URL}/rest/v1/assets?category=eq.stock&ticker=not.is.null&select=id,ticker,ticker_market,currency,quantity`;
  const res = await fetch(url, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`자산 조회 실패 (${res.status}): ${await res.text()}`);
  return res.json();
}

async function updateAsset(id, fields) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/assets?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error(`자산 갱신 실패 (${res.status}): ${await res.text()}`);
}

async function main() {
  const assets = await fetchAssets();
  if (assets.length === 0) {
    console.log("티커가 등록된 종목이 없어요. 건너뜁니다.");
    return;
  }

  // 필요한 외화 환율을 한 번씩만 가져옵니다.
  const foreignCurrencies = [...new Set(assets.map((a) => a.currency).filter((c) => c && c !== "KRW"))];
  const fxRates = {};
  for (const c of foreignCurrencies) {
    const rate = await fetchKrwRate(c);
    if (rate) fxRates[c] = rate;
  }

  let ok = 0;
  let failed = 0;

  for (const a of assets) {
    try {
      const yahooTicker = toYahooTicker(a.ticker, a.ticker_market || "US");
      const price = await fetchYahooPrice(yahooTicker);

      const fields = { sell_price: price };

      // 수량이 있으면 평가금액(만원)도 "수량 × 현재가 × 환율"로 재계산합니다.
      // 외화 자산인데 환율을 못 가져왔으면, 잘못된 값으로 덮어쓰지 않도록 평가금액은 건드리지 않습니다.
      if (a.quantity && Number(a.quantity) > 0) {
        const isForeign = a.currency && a.currency !== "KRW";
        const rate = isForeign ? fxRates[a.currency] : 1;
        if (!isForeign || rate) {
          fields.value = (Number(a.quantity) * price * rate) / 10000;
        }
      }

      await updateAsset(a.id, fields);
      console.log(`✓ ${yahooTicker}: ${price}`);
      ok += 1;
    } catch (e) {
      console.error(`✗ ${a.ticker} 실패: ${e.message}`);
      failed += 1;
    }
  }

  console.log(`완료: ${ok}건 성공, ${failed}건 실패`);
  if (ok === 0 && failed > 0) process.exit(1);
}

main();
