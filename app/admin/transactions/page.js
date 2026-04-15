"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, AlertCircle, X } from "lucide-react";
import { SkeletonTable } from "@/components/Skeleton";

const statusStyles = { pending: "bg-amber-50 text-amber-800", completed: "bg-emerald-50 text-success", failed: "bg-red-50 text-danger", cancelled: "bg-gray-100 text-text-muted" };

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try { const r = await fetch(`/api/admin/transactions?status=${filter}&page=${page}&limit=15`); if (r.ok) { const d = await r.json(); setTransactions(d.transactions); setPagination(d.pagination); } } catch {} finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { load(1); }, [load]);

  const handleAction = async (txId, action, reason) => {
    setActionLoading(txId); setMessage({ type: "", text: "" });
    try {
      const r = await fetch("/api/admin/transactions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transactionId: txId, action, reason }) });
      const d = await r.json();
      if (!r.ok) setMessage({ type: "error", text: d.error });
      else { setMessage({ type: "success", text: `Transaction ${action === "approve" ? "approved" : "declined"}` }); closeReject(); load(pagination?.page || 1); setTimeout(() => setMessage({ type: "", text: "" }), 3000); }
    } catch { setMessage({ type: "error", text: "Connection error" }); } finally { setActionLoading(null); }
  };

  const openReject = (tx) => { setRejectModal(tx); requestAnimationFrame(() => setRejectVisible(true)); };
  const closeReject = () => { setRejectVisible(false); setTimeout(() => { setRejectModal(null); setRejectReason(""); }, 200); };

  const tabs = [{ value: "pending", label: "Pending" }, { value: "completed", label: "Completed" }, { value: "failed", label: "Declined" }, { value: "all", label: "All" }];

  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-2xl font-semibold text-text-primary animate-fade-in">Transactions</h1>

      <div className="flex gap-1 bg-surface-card border border-border-light rounded-[var(--radius-lg)] p-1 w-fit animate-fade-in-up">
        {tabs.map(tab => (
          <button key={tab.value} onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-all duration-200 cursor-pointer ${filter === tab.value ? "bg-bank-800 text-white shadow-sm" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className={`overflow-hidden transition-all duration-300 ${message.text ? "max-h-16 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className={`flex items-center gap-2 p-3 rounded-[var(--radius-md)] ${message.type === "error" ? "bg-red-50 border border-red-100" : "bg-emerald-50 border border-emerald-200"}`}>
          {message.type === "error" ? <AlertCircle className="w-4 h-4 text-danger" /> : <CheckCircle2 className="w-4 h-4 text-success" />}
          <span className={`text-sm ${message.type === "error" ? "text-danger" : "text-success"}`}>{message.text}</span>
        </div>
      </div>

      {loading ? <SkeletonTable rows={6} cols={5} /> : transactions.length === 0 ? (
        <div className="card p-12 text-center animate-fade-in"><Clock className="w-10 h-10 text-text-muted mx-auto mb-3" /><p className="text-text-muted">No {filter === "all" ? "" : filter} transactions</p></div>
      ) : (
        <div className="card overflow-hidden animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border-light bg-surface">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Ref</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Account</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Recipient</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                {filter === "pending" && <th className="px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider text-right">Actions</th>}
              </tr></thead>
              <tbody className="divide-y divide-border-light">
                {transactions.map((tx, i) => (
                  <tr key={tx.id} className="hover:bg-surface-hover transition-colors duration-200" style={{ animation: `fade-in-up 0.3s ease-out ${i * 30}ms both` }}>
                    <td className="px-4 py-3.5"><span className="font-mono text-xs text-bank-700 bg-bank-50 px-1.5 py-0.5 rounded">{tx.transaction_ref || "—"}</span></td>
                    <td className="px-4 py-3.5"><div><span className="font-medium text-text-primary text-sm">{tx.accounts?.full_name}</span><span className="block text-xs text-text-muted font-mono">{tx.accounts?.account_number}</span></div></td>
                    <td className="px-4 py-3.5 hidden md:table-cell"><div><span className="text-sm text-text-primary">{tx.counterparty_name || "—"}</span>{tx.counterparty_iban && <span className="block text-xs text-text-muted font-mono">{tx.counterparty_iban}</span>}</div></td>
                    <td className="px-4 py-3.5"><span className="font-semibold text-text-primary">{formatCurrency(tx.amount)}</span></td>
                    <td className="px-4 py-3.5 text-text-muted text-xs hidden sm:table-cell">{formatDateTime(tx.created_at)}</td>
                    <td className="px-4 py-3.5"><span className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${statusStyles[tx.status] || statusStyles.cancelled}`}>{tx.status}</span></td>
                    {filter === "pending" && (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => handleAction(tx.id, "approve")} disabled={!!actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-success text-xs font-medium rounded-[var(--radius-md)] hover:bg-emerald-100 transition-all duration-200 cursor-pointer disabled:opacity-50 active:scale-95">
                            {actionLoading === tx.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
                          </button>
                          <button onClick={() => openReject(tx)} disabled={!!actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-danger text-xs font-medium rounded-[var(--radius-md)] hover:bg-red-100 transition-all duration-200 cursor-pointer disabled:opacity-50 active:scale-95">
                            <XCircle className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border-light bg-surface/50">
              <p className="text-xs text-text-muted">Page {pagination.page} of {pagination.totalPages} · {pagination.total} total</p>
              <div className="flex items-center gap-1">
                <button onClick={() => load(pagination.page - 1)} disabled={pagination.page <= 1} className="p-1.5 rounded hover:bg-surface-hover disabled:opacity-30 cursor-pointer active:scale-90 transition-all"><ChevronLeft className="w-4 h-4 text-text-secondary" /></button>
                <button onClick={() => load(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="p-1.5 rounded hover:bg-surface-hover disabled:opacity-30 cursor-pointer active:scale-90 transition-all"><ChevronRight className="w-4 h-4 text-text-secondary" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${rejectVisible ? "bg-black/40" : "bg-black/0 pointer-events-none"}`} onClick={closeReject}>
          <div className={`bg-white rounded-[var(--radius-xl)] w-full max-w-sm shadow-xl transition-all duration-200 ${rejectVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 pb-0">
              <h3 className="text-base font-semibold text-text-primary">Decline Transfer</h3>
              <button onClick={closeReject} className="p-1.5 hover:bg-surface-hover rounded-full cursor-pointer hover:rotate-90 transition-all duration-200"><X className="w-4 h-4 text-text-muted" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-surface rounded-[var(--radius-md)] p-3 space-y-1">
                <p className="text-sm text-text-primary font-medium">{formatCurrency(rejectModal.amount)} → {rejectModal.counterparty_name}</p>
                <p className="text-xs text-text-muted font-mono">{rejectModal.transaction_ref}</p>
              </div>
              <div><label className="block text-xs font-medium text-text-secondary mb-1.5">Reason (optional)</label><textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="input-field min-h-[80px] resize-none" placeholder="Reason for declining..." /></div>
              <div className="flex gap-3">
                <button onClick={closeReject} className="btn-secondary flex-1 !py-2.5 text-sm">Cancel</button>
                <button onClick={() => handleAction(rejectModal.id, "reject", rejectReason)} disabled={!!actionLoading} className="btn-danger flex-1 !py-2.5 text-sm flex items-center justify-center gap-1.5">
                  {actionLoading === rejectModal.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
