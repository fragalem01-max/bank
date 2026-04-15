"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, Wallet, ShieldCheck, ShieldX, ArrowRight, UserPlus, Clock, ArrowLeftRight } from "lucide-react";
import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/Skeleton";

function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-8 stagger-children">
      <div className="flex items-center justify-between"><Skeleton className="h-7 w-48" /><Skeleton className="h-10 w-36 rounded-[var(--radius-md)]" /></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
      <Skeleton className="h-16 w-full rounded-[var(--radius-lg)]" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-[var(--radius-lg)]" />)}</div>
      <SkeletonTable rows={5} cols={4} />
    </div>
  );
}

export default function AdminDashboard() {
  const [accounts, setAccounts] = useState([]);
  const [pendingTx, setPendingTx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try { const [a, t] = await Promise.all([fetch("/api/admin/accounts"), fetch("/api/admin/transactions?status=pending&limit=1")]); if (a.ok) { const d = await a.json(); setAccounts(d.accounts); } if (t.ok) { const d = await t.json(); setPendingTx(d.pagination?.total || 0); } } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const users = accounts.filter(a => a.role === "user");
  const totalAvailable = users.reduce((s, a) => s + parseFloat(a.balance_available || 0), 0);
  const totalReserve = users.reduce((s, a) => s + parseFloat(a.balance_reserve || 0), 0);
  const verifiedCount = users.filter(a => a.is_verified).length;

  const stats = [
    { label: "Total Accounts", value: users.length, icon: Users, color: "text-bank-700", bg: "bg-bank-50" },
    { label: "Pending Transfers", value: pendingTx, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", highlight: pendingTx > 0 },
    { label: "Total Available", value: formatCurrency(totalAvailable), icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Reserve", value: formatCurrency(totalReserve), icon: Wallet, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <div className="space-y-6 pb-8 stagger-children">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Admin Dashboard</h1>
        <Link href="/admin/accounts" className="btn-primary flex items-center gap-2 text-sm !px-4 !py-2.5"><UserPlus className="w-4 h-4" /><span className="hidden sm:inline">New Account</span></Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`card-hover p-5 group ${stat.highlight ? "ring-2 ring-amber-300 animate-pulse-soft" : ""}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-[var(--radius-sm)] ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-xl font-semibold text-text-primary num-animate">{stat.value}</p>
              <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {pendingTx > 0 && (
        <Link href="/admin/transactions">
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-[var(--radius-lg)] hover:bg-amber-100/70 transition-all duration-300 cursor-pointer group">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="flex-1"><p className="text-sm font-medium text-amber-900">{pendingTx} pending transfer{pendingTx > 1 ? "s" : ""} awaiting approval</p><p className="text-xs text-amber-700 mt-0.5">Click to review</p></div>
            <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[{ href: "/admin/accounts", icon: Users, title: "Manage Accounts", sub: `${users.length} accounts` },
          { href: "/admin/transactions", icon: ArrowLeftRight, title: "Transactions", sub: `${pendingTx} pending` },
          { href: "/admin/accounts", icon: ShieldCheck, title: "Verifications", sub: `${verifiedCount} verified` }].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.title} href={item.href} className="card-hover p-5 flex items-center gap-3 cursor-pointer group">
              <Icon className="w-5 h-5 text-bank-700 group-hover:scale-110 transition-transform duration-300" />
              <div><p className="text-sm font-medium text-text-primary">{item.title}</p><p className="text-xs text-text-muted">{item.sub}</p></div>
            </Link>
          );
        })}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Recent Accounts</h2>
          <Link href="/admin/accounts" className="text-sm text-bank-700 hover:text-bank-800 flex items-center gap-1 group">View all <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></Link>
        </div>
        <div className="card overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border-light bg-surface">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">Account #</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Available</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="px-4 py-3" />
              </tr></thead>
              <tbody className="divide-y divide-border-light">
                {users.slice(0, 8).map((a) => (
                  <tr key={a.id} className="hover:bg-surface-hover transition-colors duration-200">
                    <td className="px-4 py-3"><span className="font-medium text-text-primary">{a.full_name}</span></td>
                    <td className="px-4 py-3 font-mono text-text-secondary hidden sm:table-cell">{a.account_number}</td>
                    <td className="px-4 py-3 font-mono text-text-primary">{formatCurrency(a.balance_available)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">{a.is_verified ? <ShieldCheck className="w-3.5 h-3.5 text-success" /> : <ShieldX className="w-3.5 h-3.5 text-text-muted" />}<span className={`text-xs ${a.status === "active" ? "text-success" : "text-danger"}`}>{a.status}</span></div>
                    </td>
                    <td className="px-4 py-3"><Link href={`/admin/accounts/${a.id}`} className="text-bank-700 hover:text-bank-800 text-xs font-medium">Manage</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
