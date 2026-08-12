import React from "react";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

export default function MiniCalendar({ year, month, day, eventDays = [] }) {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const eventSet = new Set(eventDays);

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="mini-calendar">
      <div className="mini-calendar-head">{year}.{String(month).padStart(2, "0")}</div>
      <div className="mini-calendar-grid">
        {DOW.map((d) => <span className="mini-calendar-dow" key={d}>{d}</span>)}
        {cells.map((d, i) => (
          <span
            className={`mini-calendar-day ${d === null ? "empty" : ""} ${d === day ? "today" : ""} ${d !== null && eventSet.has(d) ? "has-event" : ""}`}
            key={i}
          >
            {d || "-"}
          </span>
        ))}
      </div>
    </div>
  );
}
