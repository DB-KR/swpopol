import React from "react";
import { MACRO_EVENTS } from "../lib/macroCalendar";
import { formatDate } from "../lib/format";

const CATEGORY_LABEL = { fomc: "FOMC", rate: "기준금리", cpi: "CPI" };
const COUNTRY_LABEL = { US: "미국", KR: "한국" };

export default function MacroCalendarWidget({ limit = 3 }) {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = MACRO_EVENTS
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);

  return (
    <div className="macro-cal">
      <div className="macro-cal-head">거시경제 일정</div>
      {upcoming.length === 0 ? (
        <p className="form-hint">예정된 일정이 없어요.</p>
      ) : (
        <div className="macro-cal-list">
          {upcoming.map((e, i) => (
            <div className="macro-cal-row" key={i}>
              <span className="macro-cal-date">{formatDate(e.date)}</span>
              <span className={`macro-cal-tag macro-cal-${e.category}`}>{COUNTRY_LABEL[e.country]} · {CATEGORY_LABEL[e.category]}</span>
              <span className="macro-cal-title">{e.title}{!e.confirmed && <span className="muted"> (예정)</span>}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function getMacroEventDaysForMonth(year, month) {
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  return MACRO_EVENTS.filter((e) => e.date.startsWith(prefix)).map((e) => Number(e.date.slice(8, 10)));
}
