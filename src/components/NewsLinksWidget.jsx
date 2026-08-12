import React from "react";
import { ExternalLink } from "lucide-react";

const NEWS_LINKS = [
  { label: "네이버 증시", url: "https://finance.naver.com" },
  { label: "다음 증권", url: "https://finance.daum.net" },
  { label: "Yahoo Finance", url: "https://finance.yahoo.com" },
  { label: "Investing.com", url: "https://www.investing.com" },
];

export default function NewsLinksWidget() {
  return (
    <div className="news-links">
      <div className="news-links-head">증시 뉴스 바로가기</div>
      <div className="news-links-grid">
        {NEWS_LINKS.map((l) => (
          <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="news-link-btn">
            {l.label} <ExternalLink size={11} />
          </a>
        ))}
      </div>
    </div>
  );
}
