"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, Minus, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { SkeletonTransactionList } from "./Skeleton";
import TransactionDetail from "./TransactionDetail";
import { useAuth } from "./AuthProvider";

const typeConfig = {
  credit: { icon: Plus, color: "text-success", bg: "bg-emerald-50", sign: "+" },
  debit: { icon: Minus, color: "text-danger", bg: "bg-red-50", sign: "-" },
  transfer_in: { icon: ArrowDownLeft, color: "text-success", bg: "bg-emerald-50", sign: "+" },
  transfer_out: { icon: ArrowUpRight, color: "text-danger", bg: "bg-red-50", sign: "-" },
};

export default function TransactionList({ transactions, pagination, onPageChange, accountInfo, loading }) {
  const { t } = useAuth();
  const [selectedTx, setSelectedTx] = useState(null);
  const usesServerPagination = !!pagination && !!onPageChange;
  const perPage = 10;
  const [clientPage, setClientPage] = useState(1);

  if (loading) return <SkeletonTransactionList count={5} />;

  const items = usesServerPagination ? transactions : transactions?.slice((clientPage - 1) * perPage, clientPage * perPage);
  const totalPages = usesServerPagination ? pagination.totalPages : Math.ceil((transactions?.length || 0) / perPage);
  const currentPage = usesServerPagination ? pagination.page : clientPage;
  const goToPage = (p) => { if (p < 1 || p > totalPages) return; usesServerPagination ? onPageChange(p) : setClientPage(p); };

  if (!transactions || transactions.length === 0) {
    return <div className="card p-8 text-center animate-fade-in"><p className="text-text-muted text-sm">{t("noTransactions")}</p></div>;
  }

  return (
    <>
      <div className="card overflow-hidden animate-fade-in">
        <div className="divide-y divide-border-light">
          {items.map((tx, i) => {
            const config = typeConfig[tx.type] || typeConfig.credit;
            const Icon = config.icon;
            return (
              <div key={tx.id} onClick={() => setSelectedTx(tx)} className="flex items-center gap-4 p-4 hover:bg-surface-hover transition-all duration-200 cursor-pointer group" style={{ animationDelay: `${i * 40}ms` }}>
                <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200`}><Icon className={`w-[18px] h-[18px] ${config.color}`} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{tx.description || tx.counterparty_name || t("credit")}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-text-muted">{formatDateTime(tx.created_at)}</span>
                    {tx.transaction_ref && (<><span className="text-xs text-text-muted">·</span><span className="text-[11px] text-bank-700 font-mono bg-bank-50 px-1.5 py-0.5 rounded">{tx.transaction_ref}</span></>)}
                    {tx.status === "pending" && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{t("pending").toUpperCase()}</span>}
                    {tx.status === "failed" && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-danger">{t("declined").toUpperCase()}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${config.color} group-hover:scale-105 transition-transform duration-200 origin-right`}>{config.sign}{formatCurrency(tx.amount)}</p>
                  {tx.balance_type === "reserve" && <span className="text-[10px] text-text-muted uppercase tracking-wider">{t("reserve")}</span>}
                </div>
              </div>
            );
          })}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border-light bg-surface/50">
            <p className="text-xs text-text-muted">{t("page")} {currentPage} {t("of")} {totalPages}{pagination?.total != null && ` · ${pagination.total} ${t("transactions")}`}{!usesServerPagination && ` · ${transactions.length} ${t("transactions")}`}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} className="p-1.5 rounded-[var(--radius-sm)] hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer active:scale-90"><ChevronLeft className="w-4 h-4 text-text-secondary" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { let pg; if (totalPages <= 5) pg = i + 1; else if (currentPage <= 3) pg = i + 1; else if (currentPage >= totalPages - 2) pg = totalPages - 4 + i; else pg = currentPage - 2 + i; return (
                <button key={pg} onClick={() => goToPage(pg)} className={`w-8 h-8 rounded-[var(--radius-sm)] text-xs font-medium transition-all duration-200 cursor-pointer active:scale-90 ${pg === currentPage ? "bg-bank-800 text-white scale-105" : "text-text-secondary hover:bg-surface-hover"}`}>{pg}</button>
              ); })}
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages} className="p-1.5 rounded-[var(--radius-sm)] hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer active:scale-90"><ChevronRight className="w-4 h-4 text-text-secondary" /></button>
            </div>
          </div>
        )}
      </div>
      {selectedTx && <TransactionDetail transaction={selectedTx} accountInfo={accountInfo} onClose={() => setSelectedTx(null)} />}
    </>
  );
}
