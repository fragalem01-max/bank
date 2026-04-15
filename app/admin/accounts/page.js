"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, formatAccountId } from "@/lib/utils";
import { UserPlus, Loader2, CheckCircle2, AlertCircle, ShieldCheck, ShieldX, X, Eye, EyeOff, Copy, Check, Search } from "lucide-react";
import { SkeletonTable } from "@/components/Skeleton";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: "", email: "", phone: "", password: "", language: "en" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdAccount, setCreatedAccount] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [copied, setCopied] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { loadAccounts(); }, []);
  async function loadAccounts() { try { const r = await fetch("/api/admin/accounts"); if (r.ok) { const d = await r.json(); setAccounts(d.accounts); } } catch {} finally { setLoading(false); } }

  const handleCreate = async (e) => {
    e.preventDefault(); setCreating(true); setCreateError("");
    try { const r = await fetch("/api/admin/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(createForm) }); const d = await r.json(); if (!r.ok) { setCreateError(d.error); return; } setCreatedAccount(d.account); loadAccounts(); } catch { setCreateError("Connection error"); } finally { setCreating(false); }
  };

  const copyText = (t, k) => { navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(""), 2000); };
  const openModal = () => { setShowCreate(true); requestAnimationFrame(() => setCreateVisible(true)); };
  const closeModal = () => { setCreateVisible(false); setTimeout(() => { setShowCreate(false); setCreateForm({ fullName: "", email: "", phone: "", password: "", language: "en" }); setCreateError(""); setCreatedAccount(null); setShowPw(false); }, 200); };

  const users = accounts.filter(a => a.role === "user");
  const filtered = users.filter(a => !searchQuery || a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || a.account_number.includes(searchQuery) || a.account_id.includes(searchQuery.replace(/-/g, "")) || (a.email && a.email.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in">
        <h1 className="text-2xl font-semibold text-text-primary">Accounts</h1>
        <button onClick={openModal} className="btn-primary flex items-center gap-2 text-sm !px-4 !py-2.5"><UserPlus className="w-4 h-4" />Create Account</button>
      </div>
      <div className="relative max-w-sm animate-fade-in-up" style={{ animationDelay: "60ms" }}><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" /><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name, account #, email..." className="input-field pl-10 !py-2.5 text-sm" /></div>

      {loading ? <SkeletonTable rows={6} cols={5} /> : (
        <div className="card overflow-hidden animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border-light bg-surface">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">Account #</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Lang</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Available</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden lg:table-cell">Reserve</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="px-4 py-3" />
              </tr></thead>
              <tbody className="divide-y divide-border-light">
                {filtered.map((a, i) => (
                  <tr key={a.id} className="hover:bg-surface-hover transition-colors duration-200" style={{ animation: `fade-in-up 0.3s ease-out ${i * 25}ms both` }}>
                    <td className="px-4 py-3.5"><div><span className="font-medium text-text-primary">{a.full_name}</span>{a.email && <span className="block text-xs text-text-muted mt-0.5">{a.email}</span>}</div></td>
                    <td className="px-4 py-3.5 font-mono text-text-secondary text-xs hidden sm:table-cell">{a.account_number}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell"><span className="text-xs text-text-muted uppercase">{a.language || "en"}</span></td>
                    <td className="px-4 py-3.5 font-mono text-text-primary">{formatCurrency(a.balance_available)}</td>
                    <td className="px-4 py-3.5 font-mono text-text-secondary hidden lg:table-cell">{formatCurrency(a.balance_reserve)}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell"><div className="flex items-center gap-1.5">{a.is_verified ? <ShieldCheck className="w-3.5 h-3.5 text-success" /> : <ShieldX className="w-3.5 h-3.5 text-text-muted" />}<span className={`text-xs capitalize ${a.status === "active" ? "text-success" : "text-danger"}`}>{a.status}</span></div></td>
                    <td className="px-4 py-3.5"><Link href={`/admin/accounts/${a.id}`} className="text-bank-700 hover:text-bank-800 text-xs font-medium">Manage</Link></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted text-sm">{searchQuery ? "No accounts match" : "No accounts yet"}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${createVisible ? "bg-black/40" : "bg-black/0 pointer-events-none"}`} onClick={closeModal}>
          <div className={`bg-white rounded-[var(--radius-xl)] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl transition-all duration-200 ${createVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-0"><h2 className="text-lg font-semibold text-text-primary">{createdAccount ? "Account Created" : "Create New Account"}</h2><button onClick={closeModal} className="p-2 hover:bg-surface-hover rounded-full transition-all duration-200 cursor-pointer hover:rotate-90"><X className="w-5 h-5 text-text-muted" /></button></div>
            <div className="p-6">
              {createdAccount ? (
                <div className="space-y-4 animate-fade-in-up">
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-[var(--radius-md)]"><CheckCircle2 className="w-4 h-4 text-success shrink-0" /><span className="text-sm text-success">Account created successfully</span></div>
                  <div className="space-y-3 bg-surface p-4 rounded-[var(--radius-lg)] stagger-children">
                    <div className="flex items-center justify-between"><span className="text-xs text-text-muted">Account ID (Login)</span><div className="flex items-center gap-1"><span className="font-mono text-sm text-text-primary">{formatAccountId(createdAccount.account_id)}</span><button onClick={() => copyText(createdAccount.account_id, "aid")} className="p-1 cursor-pointer active:scale-90 transition-transform">{copied === "aid" ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}</button></div></div>
                    <div className="flex items-center justify-between"><span className="text-xs text-text-muted">Account Number</span><span className="font-mono text-sm text-text-primary">{createdAccount.account_number}</span></div>
                    <div className="flex items-center justify-between"><span className="text-xs text-text-muted">Name</span><span className="text-sm text-text-primary">{createdAccount.full_name}</span></div>
                    <div className="flex items-center justify-between"><span className="text-xs text-text-muted">Language</span><span className="text-sm text-text-primary uppercase">{createdAccount.language || "en"}</span></div>
                  </div>
                  <button onClick={closeModal} className="btn-primary w-full">Done</button>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className={`overflow-hidden transition-all duration-300 ${createError ? "max-h-16 opacity-100" : "max-h-0 opacity-0"}`}><div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-md)]"><AlertCircle className="w-4 h-4 text-danger shrink-0" /><span className="text-sm text-danger">{createError}</span></div></div>
                  <div><label className="block text-xs font-medium text-text-secondary mb-1.5">Full Name *</label><input type="text" value={createForm.fullName} onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })} className="input-field" required /></div>
                  <div><label className="block text-xs font-medium text-text-secondary mb-1.5">Email (optional)</label><input type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} className="input-field" /></div>
                  <div><label className="block text-xs font-medium text-text-secondary mb-1.5">Phone (optional)</label><input type="tel" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} className="input-field" /></div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Language</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setCreateForm({ ...createForm, language: "en" })} className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-[var(--radius-md)] transition-all duration-200 cursor-pointer ${createForm.language === "en" ? "bg-bank-800 text-white" : "bg-surface text-text-secondary border border-border hover:bg-surface-hover"}`}>English</button>
                      <button type="button" onClick={() => setCreateForm({ ...createForm, language: "it" })} className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-[var(--radius-md)] transition-all duration-200 cursor-pointer ${createForm.language === "it" ? "bg-bank-800 text-white" : "bg-surface text-text-secondary border border-border hover:bg-surface-hover"}`}>Italiano</button>
                    </div>
                  </div>
                  <div><label className="block text-xs font-medium text-text-secondary mb-1.5">Password *</label><div className="relative"><input type={showPw ? "text" : "password"} value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} className="input-field pr-10" placeholder="Min 8 characters" required minLength={8} /><button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted cursor-pointer">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                  <button type="submit" disabled={creating} className="btn-primary w-full flex items-center justify-center gap-2">{creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" />Create Account</>}</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
