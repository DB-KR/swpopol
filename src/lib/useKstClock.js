import { useEffect, useState } from "react";

export function useKstClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour12: false });

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const map = {};
  parts.forEach((p) => { map[p.type] = p.value; });

  return {
    timeStr,
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
}
