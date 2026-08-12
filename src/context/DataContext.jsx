import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [allocationTargets, setAllocationTargets] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [goal, setGoal] = useState(null);
  const [cashflowItems, setCashflowItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [a, l, t, s, g, c] = await Promise.all([
        supabase.from("assets").select("*").order("created_at", { ascending: true }),
        supabase.from("liabilities").select("*").order("created_at", { ascending: true }),
        supabase.from("allocation_targets").select("*"),
        supabase.from("snapshots").select("*").order("month", { ascending: true }),
        supabase.from("goals").select("*").limit(1).maybeSingle(),
        supabase.from("cashflow_items").select("*").order("month", { ascending: true }),
      ]);
      if (a.error) throw a.error;
      if (l.error) throw l.error;
      if (t.error) throw t.error;
      if (s.error) throw s.error;
      if (g.error) throw g.error;
      if (c.error) throw c.error;
      setAssets(a.data || []);
      setLiabilities(l.data || []);
      setAllocationTargets(t.data || []);
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
      buy_date: form.buyDate === "" || form.buyDate === undefined ? null : form.buyDate,
      quantity: form.quantity === "" || form.quantity === undefined ? null : Number(form.quantity),
    });
    if (err) { setError(`자산 추가에 실패했어요. (${err.message})`); return; }
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
        buy_date: form.buyDate === "" || form.buyDate === undefined ? null : form.buyDate,
        quantity: form.quantity === "" || form.quantity === undefined ? null : Number(form.quantity),
      })
      .eq("id", id);
    if (err) { setError(`자산 수정에 실패했어요. (${err.message})`); return; }
    await refresh();
  }

  async function deleteAsset(id) {
    const { error: err } = await supabase.from("assets").delete().eq("id", id);
    if (err) { setError(`자산 삭제에 실패했어요. (${err.message})`); return; }
    await refresh();
  }

  async function addLiability(form) {
    const { error: err } = await supabase.from("liabilities").insert({
      category: form.category,
      name: form.name.trim(),
      amount: Number(form.amount) || 0,
      interest_rate: form.interestRate === "" || form.interestRate === undefined ? null : Number(form.interestRate),
      term_months: form.termMonths === "" || form.termMonths === undefined ? null : Number(form.termMonths),
      memo: (form.memo || "").trim(),
    });
    if (err) { setError(`부채 추가에 실패했어요. (${err.message})`); return; }
    await refresh();
  }

  async function updateLiability(id, form) {
    const { error: err } = await supabase
      .from("liabilities")
      .update({
        category: form.category,
        name: form.name.trim(),
        amount: Number(form.amount) || 0,
        interest_rate: form.interestRate === "" || form.interestRate === undefined ? null : Number(form.interestRate),
        term_months: form.termMonths === "" || form.termMonths === undefined ? null : Number(form.termMonths),
        memo: (form.memo || "").trim(),
      })
      .eq("id", id);
    if (err) { setError(`부채 수정에 실패했어요. (${err.message})`); return; }
    await refresh();
  }

  async function deleteLiability(id) {
    const { error: err } = await supabase.from("liabilities").delete().eq("id", id);
    if (err) { setError(`부채 삭제에 실패했어요. (${err.message})`); return; }
    await refresh();
  }

  async function saveAllocationTargets(targets) {
    // targets: [{ category: 'stock', targetPct: 40 }, ...]
    const rows = targets.map((t) => ({ category: t.category, target_pct: Number(t.targetPct) || 0 }));
    const { error: err } = await supabase.from("allocation_targets").upsert(rows, { onConflict: "user_id,category" });
    if (err) { setError(`목표 비중 저장에 실패했어요. (${err.message})`); return; }
    await refresh();
  }

  async function saveSnapshot(month, total, realEstateTotal = 0, financialTotal = 0) {
    const { error: err } = await supabase
      .from("snapshots")
      .upsert({ month, total, real_estate_total: realEstateTotal, financial_total: financialTotal }, { onConflict: "user_id,month" });
    if (err) { setError(`스냅샷 저장에 실패했어요. (${err.message})`); return; }
    await refresh();
  }

  async function deleteSnapshot(month) {
    const { error: err } = await supabase.from("snapshots").delete().eq("month", month);
    if (err) { setError(`스냅샷 삭제에 실패했어요. (${err.message})`); return; }
    await refresh();
  }

  async function saveGoal(form) {
    const payload = {
      label: (form.label || "").trim() || "자산 목표",
      real_estate_target: form.realEstateTarget === "" ? 0 : Number(form.realEstateTarget) || 0,
      financial_target: form.financialTarget === "" ? 0 : Number(form.financialTarget) || 0,
      target_date: form.targetDate,
    };
    const { error: err } = await supabase.from("goals").upsert(payload, { onConflict: "user_id" });
    if (err) { setError(`목표 저장에 실패했어요. (${err.message})`); return; }
    await refresh();
  }

  async function addCashflowItem(form) {
    const { error: err } = await supabase.from("cashflow_items").insert({
      month: form.month,
      type: form.type,
      category: form.category,
      amount: Number(form.amount) || 0,
      memo: (form.memo || "").trim(),
      is_recurring: !!form.isRecurring,
    });
    if (err) { setError(`현금흐름 항목 추가에 실패했어요. (${err.message})`); return; }
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
        is_recurring: !!form.isRecurring,
      })
      .eq("id", id);
    if (err) { setError(`현금흐름 항목 수정에 실패했어요. (${err.message})`); return; }
    await refresh();
  }

  async function deleteCashflowItem(id) {
    const { error: err } = await supabase.from("cashflow_items").delete().eq("id", id);
    if (err) { setError(`현금흐름 항목 삭제에 실패했어요. (${err.message})`); return; }
    await refresh();
  }

  // 백업 JSON으로 현재 데이터를 전부 대체합니다. id/user_id/created_at 같은 메타 필드는
  // 원본 프로젝트/계정에 종속적이라 제외하고, 실제 데이터 컬럼만 골라서 새로 넣습니다.
  const NIL_UUID = "00000000-0000-0000-0000-000000000000";

  function pick(obj, fields) {
    const out = {};
    fields.forEach((f) => { if (obj[f] !== undefined) out[f] = obj[f]; });
    return out;
  }

  async function replaceTable(table, rows, fields) {
    const del = await supabase.from(table).delete().neq("id", NIL_UUID);
    if (del.error) throw del.error;
    if (Array.isArray(rows) && rows.length > 0) {
      const payload = rows.map((r) => pick(r, fields));
      const ins = await supabase.from(table).insert(payload);
      if (ins.error) throw ins.error;
    }
  }

  async function restoreBackup(data) {
    setError(null);
    try {
      await replaceTable("assets", data.assets, ["category", "name", "value", "memo", "currency", "buy_price", "sell_price", "buy_fx_rate", "buy_date", "quantity"]);
      await replaceTable("liabilities", data.liabilities, ["category", "name", "amount", "interest_rate", "term_months", "memo"]);
      await replaceTable("snapshots", data.snapshots, ["month", "total", "real_estate_total", "financial_total"]);
      await replaceTable("cashflow_items", data.cashflowItems, ["month", "type", "category", "amount", "memo", "is_recurring"]);
      await replaceTable("allocation_targets", data.allocationTargets, ["category", "target_pct"]);
      if (data.goal) {
        const payload = pick(data.goal, ["label", "target_date", "real_estate_target", "financial_target"]);
        const { error: gErr } = await supabase.from("goals").upsert(payload, { onConflict: "user_id" });
        if (gErr) throw gErr;
      }
      await refresh();
      return { success: true };
    } catch (e) {
      setError("복원 중 오류가 발생했어요. 일부만 반영됐을 수 있어요.");
      await refresh();
      return { success: false };
    }
  }

  const value = {
    assets, liabilities, allocationTargets, snapshots, goal, cashflowItems, loading, error, refresh,
    addAsset, updateAsset, deleteAsset,
    addLiability, updateLiability, deleteLiability,
    saveAllocationTargets,
    saveSnapshot, deleteSnapshot,
    saveGoal,
    addCashflowItem, updateCashflowItem, deleteCashflowItem,
    restoreBackup,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
