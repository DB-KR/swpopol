import React, { useEffect, useRef, useState } from "react";
import { HashRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";
import { supabase } from "./lib/supabase";
import { useTheme } from "./lib/useTheme";
import { DataProvider } from "./context/DataContext";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import Overview from "./pages/Overview";
import Cashflow from "./pages/Cashflow";
import Assets from "./pages/Assets";
import Holdings from "./pages/Holdings";
import Rebalance from "./pages/Rebalance";
import Performance from "./pages/Performance";
import Settings from "./pages/Settings";

function PageWrap({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrap><Overview /></PageWrap>} />
        <Route path="/assets" element={<PageWrap><Assets /></PageWrap>} />
        <Route path="/cashflow" element={<PageWrap><Cashflow /></PageWrap>} />
        <Route path="/holdings" element={<PageWrap><Holdings /></PageWrap>} />
        <Route path="/rebalance" element={<PageWrap><Rebalance /></PageWrap>} />
        <Route path="/performance" element={<PageWrap><Performance /></PageWrap>} />
        <Route path="/settings" element={<PageWrap><Settings /></PageWrap>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function Shell({ theme, toggleTheme }) {
  const [session, setSession] = useState(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebarCollapsed") === "true";
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("sidebarCollapsed", String(next));
      } catch (e) {
        // ignore write failures
      }
      return next;
    });
  }

  // 모바일에서 화면 왼쪽 가장자리를 오른쪽으로 스와이프하면 메뉴가 열리도록 합니다.
  // 데스크톱(860px 초과)에서는 사이드바가 항상 보이므로 굳이 추적하지 않습니다.
  const touchStart = useRef(null);
  const EDGE_ZONE_PX = 24;
  const SWIPE_THRESHOLD_PX = 60;

  function handleTouchStart(e) {
    if (sidebarOpen || window.innerWidth > 860) {
      touchStart.current = null;
      return;
    }
    const t = e.touches[0];
    if (t.clientX > EDGE_ZONE_PX) return;
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchMove(e) {
    if (!touchStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    if (dx > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
      setSidebarOpen(true);
      touchStart.current = null;
    } else if (Math.abs(dy) > 40) {
      // 세로 스크롤로 보이면 스와이프 추적을 그만둡니다.
      touchStart.current = null;
    }
  }

  function handleTouchEnd() {
    touchStart.current = null;
  }

  if (session === undefined) {
    return <div className="loading-screen">불러오는 중…</div>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <DataProvider>
      <div
        className={`shell ${collapsed ? "collapsed" : ""}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={() => supabase.auth.signOut()}
          userEmail={session.user.email}
          theme={theme}
          toggleTheme={toggleTheme}
          collapsed={collapsed}
          toggleCollapsed={toggleCollapsed}
        />
        <div className="topbar">
          <button className="icon-btn" onClick={() => setSidebarOpen(true)} aria-label="메뉴 열기">
            <Menu size={20} />
          </button>
          <span className="topbar-title">MY 자산 통장</span>
        </div>
        <main className="main">
          <AnimatedRoutes />
        </main>
      </div>
    </DataProvider>
  );
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  return (
    <HashRouter>
      <Shell theme={theme} toggleTheme={toggleTheme} />
    </HashRouter>
  );
}
