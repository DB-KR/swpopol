import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [assets, setAssets] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [goal, setGoal] = useState(null);
  const [cashflowItems, setCashflowItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [a, s, g, c] = await Promise.all([
        supabase.from("assets").select("*").order("created_at", { ascending: true }),
        supabase.from("snapshots").select("*").order("month", { ascending: true }),
        supabase.from("goals").select("*").limit(1).maybeSingle(),
        supabase.from("cashflow_items").select("*").order("month", { ascending: true }),
      ]);
      if (a.error) throw a.error;
      if (s.error) throw s.error;
      if (g.error) throw g.error;
      if (c.error) throw c.error;
      setAssets(a.data || []);
      setSnapshots(s.data || []);
      setGoal(g.data || null);
      setCashflowItems(c.data || []);
      setError(null);
    } catch (e) {
      setError("데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addAsset(form) {
    const { error: err } = await supabase.from("assets").insert({
      category: form.category,
      name: form.name.trim(),
      value: Number(form.value) || 0,
      memo: (form.memo || "").trim(),
      currency: form.currency || "KRW",
      buy_price: form.buyPrice === "" || form.buyPrice === undefined ? null : Number(form.buyPrice),
      sell_price: form.sellPrice === "" || form.sellPrice === undefined ? null : Number(form.sellPrice),
      buy_fx_rate: form.buyFxRate === "" || form.buyFxRate === undefined ? null : Number(form.buyFxRate),
    });
    if (err) { setError("자산 추가에 실패했어요."); return; }
    await refresh();
  }

  async function updateAsset(id, form) {
    const { error: err } = await supabase
      .from("assets")
      .update({
        category: form.category,
        name: form.name.trim(),
        value: Number(form.value) || 0,
        memo: (form.memo || "").trim(),
        currency: form.currency || "KRW",
        buy_price: form.buyPrice === "" || form.buyPrice === undefined ? null : Number(form.buyPrice),
        sell_price: form.sellPrice === "" || form.sellPrice === undefined ? null : Number(form.sellPrice),
        buy_fx_rate: form.buyFxRate === "" || form.buyFxRate === undefined ? null : Number(form.buyFxRate),
      })
      .eq("id", id);
    if (err) { setError("자산 수정에 실패했어요."); return; }
    await refresh();
  }

  async function deleteAsset(id) {
    const { error: err } = await supabase.from("assets").delete().eq("id", id);
    if (err) { setError("자산 삭제에 실패했어요."); return; }
    await refresh();
  }

  async function saveSnapshot(month, total) {
    const { error: err } = await supabase
      .from("snapshots")
      .upsert({ month, total }, { onConflict: "user_id,month" });
    if (err) { setError("스냅샷 저장에 실패했어요."); return; }
    await refresh();
  }

  async function deleteSnapshot(month) {
    const { error: err } = await supabase.from("snapshots").delete().eq("month", month);
    if (err) { setError("스냅샷 삭제에 실패했어요."); return; }
    await refresh();
  }

  async function saveGoal(form) {
    const payload = {
      label: (form.label || "").trim() || "자산 목표",
      target_amount: Number(form.targetAmount) || 0,
      target_date: form.targetDate,
    };
    const { error: err } = await supabase.from("goals").upsert(payload, { onConflict: "user_id" });
    if (err) { setError("목표 저장에 실패했어요."); return; }
    await refresh();
  }

  async function addCashflowItem(form) {
    const { error: err } = await supabase.from("cashflow_items").insert({
      month: form.month,
      type: form.type,
      category: form.category,
      amount: Number(form.amount) || 0,
      memo: (form.memo || "").trim(),
    });
    if (err) { setError("현금흐름 항목 추가에 실패했어요."); return; }
    await refresh();
  }

  async function updateCashflowItem(id, form) {
    const { error: err } = await supabase
      .from("cashflow_items")
      .update({
        month: form.month,
        type: form.type,
        category: form.category,
        amount: Number(form.amount) || 0,
        memo: (form.memo || "").trim(),
      })
      .eq("id", id);
    if (err) { setError("현금흐름 항목 수정에 실패했어요."); return; }
    await refresh();
  }

  async function deleteCashflowItem(id) {
    const { error: err } = await supabase.from("cashflow_items").delete().eq("id", id);
    if (err) { setError("현금흐름 항목 삭제에 실패했어요."); return; }
    await refresh();
  }

  const value = {
    assets, snapshots, goal, cashflowItems, loading, error, refresh,
    addAsset, updateAsset, deleteAsset,
    saveSnapshot, deleteSnapshot,
    saveGoal,
    addCashflowItem, updateCashflowItem, deleteCashflowItem,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
