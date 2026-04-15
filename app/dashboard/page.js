"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import BalanceCards from "@/components/BalanceCards";
import TransactionList from "@/components/TransactionList";
import { formatAccountId } from "@/lib/utils";
import { ArrowLeftRight, ShieldCheck, Copy, Check, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, t, greeting } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [txLoading, setTxLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadTx = useCallback(async (page = 1) => { setTxLoading(true); try { const r = await fetch(`/api/transfer?page=${page}&limit=10`); if (r.ok) { const d = await r.json(); setTransactions(d.transactions); setPagination(d.pagination); } } catch {} finally { setTxLoading(false); } }, []);
  useEffect(() => { loadTx(1); }, [loadTx]);
  const copyIban = () => { if (user?.iban) { navigator.clipboard.writeText(user.iban); setCopied(true); setTimeout(() => setCopied(false), 2000); } };
  const accountInfo = user ? { full_name: user.full_name, account_number: user.account_number, iban: user.iban } : null;

  return (
    <div className="space-y-6 pb-8 stagger-children">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div><p className="text-text-muted text-sm">{greeting()},</p><h1 className="text-2xl font-semibold text-text-primary mt-1">{user?.full_name?.split(" ")[0]}</h1></div>
        <div className="text-sm text-text-secondary">{t("account")} <span className="font-mono text-text-primary">{formatAccountId(user?.account_id)}</span></div>
      </div>
      {!user?.iban && user?.is_verified && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-[var(--radius-lg)] animate-fade-in-down"><AlertCircle className="w-5 h-5 text-blue-600 shrink-0" /><p className="text-sm text-blue-800">{t("ibanNotAssigned")}</p></div>
      )}
      <BalanceCards available={user?.balance_available} reserve={user?.balance_reserve} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-hover p-5 group"><p className="text-xs text-text-muted uppercase tracking-wider mb-2">{t("yourIban")}</p>
          {user?.iban ? (<div className="flex items-center gap-2"><span className="font-mono text-sm text-text-primary tracking-wide">{user.iban.replace(/(.{4})/g, "$1 ").trim()}</span><button onClick={copyIban} className="p-1.5 hover:bg-surface-hover rounded transition-all duration-200 cursor-pointer active:scale-90">{copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-text-muted" />}</button></div>) : <p className="text-sm text-text-muted italic">{t("notAssigned")}</p>}
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/transfer" className="flex-1"><div className="card-hover p-5 h-full flex flex-col items-center justify-center gap-2 cursor-pointer group"><ArrowLeftRight className="w-5 h-5 text-bank-700 group-hover:scale-110 transition-transform duration-300" /><span className="text-sm font-medium text-text-primary">{t("newTransfer")}</span></div></Link>
          <Link href="/dashboard/verification" className="flex-1"><div className="card-hover p-5 h-full flex flex-col items-center justify-center gap-2 cursor-pointer group"><ShieldCheck className="w-5 h-5 text-bank-700 group-hover:scale-110 transition-transform duration-300" /><span className="text-sm font-medium text-text-primary">{t("verification")}</span></div></Link>
        </div>
      </div>
      <div><h2 className="text-lg font-semibold text-text-primary mb-4">{t("recentTransactions")}</h2><TransactionList transactions={transactions} pagination={pagination} onPageChange={p => loadTx(p)} accountInfo={accountInfo} loading={txLoading} /></div>
    </div>
  );
}
