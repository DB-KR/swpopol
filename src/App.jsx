import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div className="loading-screen">불러오는 중…</div>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <DataProvider>
      <div className="shell">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={() => supabase.auth.signOut()}
          userEmail={session.user.email}
          theme={theme}
          toggleTheme={toggleTheme}
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
