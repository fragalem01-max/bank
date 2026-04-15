"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import TransactionList from "@/components/TransactionList";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, Loader2, AlertCircle, ShieldAlert, X, Clock } from "lucide-react";
import Link from "next/link";

export default function TransferPage() {
  const { user, refreshUser, t } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [txLoading, setTxLoading] = useState(true);
  const [form, setForm] = useState({ recipientName: "", recipientIban: "", amount: "", reference: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [confirmModal, setConfirmModal] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const loadTx = useCallback(async (page = 1) => { setTxLoading(true); try { const r = await fetch(`/api/transfer?page=${page}&limit=10`); if (r.ok) { const d = await r.json(); setTransactions(d.transactions); setPagination(d.pagination); } } catch {} finally { setTxLoading(false); } }, []);
  useEffect(() => { loadTx(1); }, [loadTx]);

  const canTransfer = user?.is_verified && user?.iban;
  const accountInfo = user ? { full_name: user.full_name, account_number: user.account_number, iban: user.iban } : null;

  const openConfirm = (e) => { e.preventDefault(); if (!form.recipientName || !form.recipientIban || !form.amount) { setError(t("allFieldsRequired")); return; } const n = parseFloat(form.amount); if (isNaN(n) || n <= 0) { setError(t("invalidAmount")); return; } if (n > parseFloat(user?.balance_available || 0)) { setError(t("insufficientFunds")); return; } setError(""); setConfirmModal(true); requestAnimationFrame(() => setConfirmVisible(true)); };
  const closeConfirm = () => { setConfirmVisible(false); setTimeout(() => setConfirmModal(false), 200); };

  const handleSubmit = async () => { setLoading(true); setError(""); setSuccess(""); closeConfirm(); try { const r = await fetch("/api/transfer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const d = await r.json(); if (!r.ok) { setError(d.error); return; } setSuccess(`${t("transferSubmitted")} — ${d.transactionRef}. ${t("pendingApproval")}`); setForm({ recipientName: "", recipientIban: "", amount: "", reference: "", description: "" }); refreshUser(); loadTx(1); setTimeout(() => setSuccess(""), 6000); } catch { setError(t("connectionError")); } finally { setLoading(false); } };

  if (!canTransfer) {
    return (
      <div className="space-y-6 pb-8 stagger-children">
        <h1 className="text-2xl font-semibold text-text-primary">{t("sepaTransfers")}</h1>
        <div className="card p-8 text-center space-y-4 animate-fade-in-up">
          <ShieldAlert className="w-12 h-12 text-warning mx-auto" />
          <div><h2 className="text-lg font-semibold text-text-primary">{!user?.is_verified ? t("verificationRequired") : t("ibanNotAssignedTitle")}</h2><p className="text-text-secondary text-sm mt-1 max-w-md mx-auto">{!user?.is_verified ? t("verificationRequiredDesc") : t("ibanNotAssignedDesc")}</p></div>
          {!user?.is_verified && <Link href="/dashboard/verification" className="btn-primary inline-flex items-center gap-2">{t("completeVerification")}</Link>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-2xl font-semibold text-text-primary animate-fade-in">{t("sepaTransfers")}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <div className="card p-6">
            <h2 className="text-base font-semibold text-text-primary mb-1">{t("newTransfer")}</h2>
            <p className="text-xs text-text-muted mb-5">{t("available")}: {formatCurrency(user?.balance_available || 0)}</p>
            <div className={`overflow-hidden transition-all duration-300 ${success ? "max-h-24 opacity-100 mb-4" : "max-h-0 opacity-0"}`}><div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-[var(--radius-md)]"><Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" /><span className="text-sm text-success">{success}</span></div></div>
            <div className={`overflow-hidden transition-all duration-300 ${error ? "max-h-20 opacity-100 mb-4" : "max-h-0 opacity-0"}`}><div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-md)]"><AlertCircle className="w-4 h-4 text-danger shrink-0" /><span className="text-sm text-danger">{error}</span></div></div>
            <form onSubmit={openConfirm} className="space-y-4">
              <div><label className="block text-xs font-medium text-text-secondary mb-1.5">{t("recipientName")} *</label><input type="text" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} className="input-field" required /></div>
              <div><label className="block text-xs font-medium text-text-secondary mb-1.5">{t("recipientIban")} *</label><input type="text" value={form.recipientIban} onChange={(e) => setForm({ ...form, recipientIban: e.target.value.toUpperCase() })} className="input-field font-mono text-sm" required /></div>
              <div><label className="block text-xs font-medium text-text-secondary mb-1.5">{t("amountEur")} *</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input-field" step="0.01" min="0.01" required /></div>
              <div><label className="block text-xs font-medium text-text-secondary mb-1.5">{t("reference")}</label><input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-text-secondary mb-1.5">{t("description")}</label><input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" /></div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowUpRight className="w-4 h-4" />{t("reviewTransfer")}</>}</button>
            </form>
          </div>
        </div>
        <div className="lg:col-span-3 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <h2 className="text-base font-semibold text-text-primary mb-4">{t("transactionHistory")}</h2>
          <TransactionList transactions={transactions} pagination={pagination} onPageChange={p => loadTx(p)} accountInfo={accountInfo} loading={txLoading} />
        </div>
      </div>
      {/* Confirm Modal */}
      {confirmModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${confirmVisible ? "bg-black/40" : "bg-black/0"}`} onClick={closeConfirm}>
          <div className={`bg-white rounded-[var(--radius-xl)] w-full max-w-sm shadow-xl transition-all duration-200 ${confirmVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 pb-0"><h3 className="text-base font-semibold text-text-primary">{t("confirmTransfer")}</h3><button onClick={closeConfirm} className="p-1.5 hover:bg-surface-hover rounded-full cursor-pointer hover:rotate-90 transition-all duration-200"><X className="w-4 h-4 text-text-muted" /></button></div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-text-secondary">{t("reviewDetails")}</p>
              <div className="bg-surface rounded-[var(--radius-lg)] p-4 space-y-3 stagger-children">
                <div className="flex justify-between"><span className="text-xs text-text-muted">{t("recipient")}</span><span className="text-sm font-medium text-text-primary">{form.recipientName}</span></div>
                <div className="flex justify-between"><span className="text-xs text-text-muted">IBAN</span><span className="text-xs font-mono text-text-primary">{form.recipientIban}</span></div>
                <div className="flex justify-between"><span className="text-xs text-text-muted">{t("amount")}</span><span className="text-lg font-bold text-text-primary">{form.amount ? formatCurrency(parseFloat(form.amount)) : "€0.00"}</span></div>
                {form.reference && <div className="flex justify-between"><span className="text-xs text-text-muted">{t("reference")}</span><span className="text-sm text-text-primary">{form.reference}</span></div>}
              </div>
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)]"><Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" /><p className="text-xs text-amber-800">{t("transferPendingNote")}</p></div>
              <div className="flex gap-3">
                <button onClick={closeConfirm} className="btn-secondary flex-1 text-sm">{t("cancel")}</button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5">{loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><ArrowUpRight className="w-3.5 h-3.5" />{t("confirmAndSend")}</>}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
