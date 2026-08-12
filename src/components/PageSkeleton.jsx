import React from "react";

export default function PageSkeleton({ cards = 3, hero = false }) {
  return (
    <div className="skeleton-page">
      {hero && <div className="skeleton-card skeleton-hero" />}
      {Array.from({ length: cards }).map((_, i) => (
        <div className="skeleton-card" key={i} />
      ))}
    </div>
  );
}
