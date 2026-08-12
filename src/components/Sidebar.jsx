import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, ClipboardList, Wallet, Briefcase, Scale, LineChart, Settings as SettingsIcon, LogOut, X, Moon, Sun, ChevronsLeft, ChevronsRight } from "lucide-react";

const MENU_GROUPS = [
  {
    label: "전체 자산",
    items: [
      { to: "/", label: "개요", icon: LayoutDashboard },
      { to: "/assets", label: "자산 구성", icon: ClipboardList },
      { to: "/cashflow", label: "현금 흐름", icon: Wallet },
    ],
  },
  {
    label: "투자 관리",
    items: [
      { to: "/holdings", label: "주식 포트폴리오", icon: Briefcase },
      { to: "/rebalance", label: "비중 & 리밸런싱", icon: Scale },
      { to: "/performance", label: "성과 분석", icon: LineChart },
    ],
  },
  {
    label: "설정",
    items: [
      { to: "/settings", label: "환경 설정", icon: SettingsIcon },
    ],
  },
];

export default function Sidebar({ open, onClose, onLogout, userEmail, theme, toggleTheme, collapsed, toggleCollapsed }) {
  const location = useLocation();

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-head">
          <div className="sidebar-head-text">
            <span className="eyebrow">PERSONAL ASSET PASSBOOK</span>
            <h1>MY 자산 통장</h1>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="메뉴 닫기">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {MENU_GROUPS.map((group) => (
            <div className="sidebar-group" key={group.label}>
              <span className="sidebar-group-label">{group.label}</span>
              {group.items.map((item) => {
                const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                  >
                    {active && (
                      <motion.span
                        layoutId="active-pill"
                        className="active-pill"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <Icon size={16} />
                    <span className="sidebar-label">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          {userEmail && <span className="sidebar-email">{userEmail}</span>}
          <button className="link-btn" onClick={toggleTheme} title={collapsed ? (theme === "dark" ? "라이트 모드" : "다크 모드") : undefined}>
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />} <span className="sidebar-label">{theme === "dark" ? "라이트 모드" : "다크 모드"}</span>
          </button>
          <button className="sidebar-collapse-btn" onClick={toggleCollapsed} aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}>
            {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />} <span className="sidebar-label">{collapsed ? "펼치기" : "접기"}</span>
          </button>
          <button className="link-btn" onClick={onLogout} title={collapsed ? "로그아웃" : undefined}>
            <LogOut size={13} /> <span className="sidebar-label">로그아웃</span>
          </button>
        </div>
      </aside>
    </>
  );
}
