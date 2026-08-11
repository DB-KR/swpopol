import React from "react";
import { Wrench } from "lucide-react";

export default function Rebalance() {
  return (
    <div className="page">
      <div className="card">
        <div className="empty-state">
          <div className="empty-ring"><Wrench size={20} /></div>
          <p>이 기능은 다음 단계에서 만들 예정이에요.</p>
        </div>
      </div>
    </div>
  );
}
