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

  // 모바일에서 화면 왼쪽 가장자리를 오른쪽으로 스와이프하면 메뉴가 열리고,
  // 메뉴가 열려있을 때 오른쪽에서 왼쪽으로 스와이프하면 닫히도록 합니다.
  // 데스크톱(860px 초과)에서는 사이드바가 항상 보이므로 굳이 추적하지 않습니다.
  const touchStart = useRef(null);
  const EDGE_ZONE_PX = 70;
  const SWIPE_THRESHOLD_PX = 80;

  function handleTouchStart(e) {
    if (window.innerWidth > 860) {
      touchStart.current = null;
      return;
    }
    const t = e.touches[0];
    if (!t) return;
    // 메뉴가 닫혀있을 땐 왼쪽 가장자리에서 시작한 터치만, 열려있을 땐 어디서든 인식합니다.
    if (!sidebarOpen && t.clientX > EDGE_ZONE_PX) {
      touchStart.current = null;
      return;
    }
    touchStart.current = { x: t.clientX, y: t.clientY, locked: false };
  }

  function handleTouchMove(e) {
    if (!touchStart.current) return;
    const t = e.touches[0];
    if (!t) return;
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;

    // 방향을 아직 확정하지 않았다면, 이동량이 일정 수준(10px)을 넘는 순간 딱 한 번만 판단합니다.
    // 세로 이동이 가로 이동보다 크거나 같으면 스크롤로 보고 이 제스처는 완전히 포기합니다(다시 판단하지 않음).
    // 이렇게 방향을 "고정"해야, 스크롤 도중 가로로 살짝 밀렸다고 나중에 메뉴가 열리는 오작동을 막을 수 있어요.
    if (!touchStart.current.locked) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dy) >= Math.abs(dx)) {
        touchStart.current = null;
        return;
      }
      touchStart.current.locked = true;
    }

    if (!sidebarOpen && dx > SWIPE_THRESHOLD_PX) {
      setSidebarOpen(true);
      touchStart.current = null;
    } else if (sidebarOpen && dx < -SWIPE_THRESHOLD_PX) {
      setSidebarOpen(false);
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
