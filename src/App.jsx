import React, { useEffect, useState } from "react";
import { HashRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";
import { supabase } from "./lib/supabase";
import { DataProvider } from "./context/DataContext";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import Overview from "./pages/Overview";
import Trend from "./pages/Trend";
import Goal from "./pages/Goal";
import Cashflow from "./pages/Cashflow";
import Assets from "./pages/Assets";

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
        <Route path="/trend" element={<PageWrap><Trend /></PageWrap>} />
        <Route path="/goal" element={<PageWrap><Goal /></PageWrap>} />
        <Route path="/cashflow" element={<PageWrap><Cashflow /></PageWrap>} />
        <Route path="/assets" element={<PageWrap><Assets /></PageWrap>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function Shell() {
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
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
