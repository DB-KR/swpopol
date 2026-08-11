import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, TrendingUp, Target, Wallet, List, Settings as SettingsIcon, LogOut, X } from "lucide-react";

const MENU = [
  { to: "/", label: "개요", icon: LayoutDashboard },
  { to: "/trend", label: "자산 증감 추이", icon: TrendingUp },
  { to: "/goal", label: "목표", icon: Target },
  { to: "/cashflow", label: "현금흐름", icon: Wallet },
  { to: "/assets", label: "자산 내역", icon: List },
  { to: "/settings", label: "설정", icon: SettingsIcon },
];

export default function Sidebar({ open, onClose, onLogout, userEmail }) {
  const location = useLocation();

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-head">
          <div>
            <span className="eyebrow">PERSONAL ASSET PASSBOOK</span>
            <h1>MY 자산 통장</h1>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="메뉴 닫기">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {MENU.map((item) => {
            const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                onClick={onClose}
              >
                {active && (
                  <motion.span
                    layoutId="active-pill"
                    className="active-pill"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          {userEmail && <span className="sidebar-email">{userEmail}</span>}
          <button className="link-btn" onClick={onLogout}>
            <LogOut size={13} /> 로그아웃
          </button>
        </div>
      </aside>
    </>
  );
}
