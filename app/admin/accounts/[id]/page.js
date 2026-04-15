"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate, formatDateTime, formatAccountId } from "@/lib/utils";
import TransactionList from "@/components/TransactionList";
import { ArrowLeft, Loader2, CreditCard, Wallet, ShieldCheck, ShieldX, AlertCircle, CheckCircle2, Copy, Check, User, Mail, Phone, Hash, MapPin, Calendar, Image, X, Eye, Pencil, ArrowRightLeft, Bell, Send, Globe } from "lucide-react";
import Link from "next/link";

export default function AccountDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [ibanInput, setIbanInput] = useState("");
  const [ibanLoading, setIbanLoading] = useState(false);
  const [ibanMsg, setIbanMsg] = useState({ type: "", text: "" });

  const [balForm, setBalForm] = useState({ amount: "", balanceType: "available", description: "", reference: "", showInTransactions: true });
  const [balLoading, setBalLoading] = useState(false);
  const [balMsg, setBalMsg] = useState({ type: "", text: "" });

  const [moveForm, setMoveForm] = useState({ amount: "", direction: "reserve_to_available" });
  const [moveLoading, setMoveLoading] = useState(false);
  const [moveMsg, setMoveMsg] = useState({ type: "", text: "" });

  const [editModal, setEditModal] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", phone: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState({ type: "", text: "" });

  // Notification
  const [notifModal, setNotifModal] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifForm, setNotifForm] = useState({ title: "", message: "", type: "info" });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifMsg, setNotifMsg] = useState({ type: "", text: "" });

  const [statusLoading, setStatusLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [showIdPhoto, setShowIdPhoto] = useState(false);

  useEffect(() => { loadAccount(); }, [id]);

  async function loadAccount() { try { const r = await fetch(`/api/admin/accounts/${id}`); if (!r.ok) { router.push("/admin/accounts"); return; } const d = await r.json(); setAccount(d.account); setTransactions(d.transactions); setIbanInput(d.account.iban || ""); setEditForm({ full_name: d.account.full_name || "", email: d.account.email || "", phone: d.account.phone || "" }); } catch { router.push("/admin/accounts"); } finally { setLoading(false); } }

  const copyText = (t, k) => { navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(""), 2000); };

  const handleIban = async (e) => { e.preventDefault(); setIbanLoading(true); setIbanMsg({ type: "", text: "" }); try { const r = await fetch(`/api/admin/accounts/${id}/iban`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ iban: ibanInput }) }); const d = await r.json(); if (!r.ok) setIbanMsg({ type: "error", text: d.error }); else { setIbanMsg({ type: "success", text: "IBAN assigned" }); setAccount(p => ({ ...p, iban: d.account.iban })); } } catch { setIbanMsg({ type: "error", text: "Error" }); } finally { setIbanLoading(false); } };
  const handleBalance = async (e) => { e.preventDefault(); setBalLoading(true); setBalMsg({ type: "", text: "" }); try { const r = await fetch(`/api/admin/accounts/${id}/balance`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(balForm) }); const d = await r.json(); if (!r.ok) setBalMsg({ type: "error", text: d.error }); else { setBalMsg({ type: "success", text: `Done — Avail: €${d.balanceAvailable.toFixed(2)} | Rsv: €${d.balanceReserve.toFixed(2)}` }); setBalForm(p => ({ ...p, amount: "", description: "", reference: "" })); setAccount(p => ({ ...p, balance_available: d.balanceAvailable, balance_reserve: d.balanceReserve })); loadAccount(); } } catch { setBalMsg({ type: "error", text: "Error" }); } finally { setBalLoading(false); } };
  const handleMove = async (e) => { e.preventDefault(); setMoveLoading(true); setMoveMsg({ type: "", text: "" }); try { const r = await fetch(`/api/admin/accounts/${id}/move-funds`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(moveForm) }); const d = await r.json(); if (!r.ok) setMoveMsg({ type: "error", text: d.error }); else { setMoveMsg({ type: "success", text: `Moved — Avail: €${d.balanceAvailable.toFixed(2)} | Rsv: €${d.balanceReserve.toFixed(2)}` }); setMoveForm(p => ({ ...p, amount: "" })); setAccount(p => ({ ...p, balance_available: d.balanceAvailable, balance_reserve: d.balanceReserve })); } } catch { setMoveMsg({ type: "error", text: "Error" }); } finally { setMoveLoading(false); } };

  const openEdit = () => { setEditMsg({ type: "", text: "" }); setEditForm({ full_name: account.full_name || "", email: account.email || "", phone: account.phone || "" }); setEditModal(true); requestAnimationFrame(() => setEditVisible(true)); };
  const closeEdit = () => { setEditVisible(false); setTimeout(() => setEditModal(false), 200); };
  const handleEdit = async (e) => { e.preventDefault(); setEditLoading(true); setEditMsg({ type: "", text: "" }); try { const r = await fetch(`/api/admin/accounts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) }); const d = await r.json(); if (!r.ok) setEditMsg({ type: "error", text: d.error }); else { setEditMsg({ type: "success", text: "Updated" }); setAccount(p => ({ ...p, ...d.account })); setTimeout(closeEdit, 1000); } } catch { setEditMsg({ type: "error", text: "Error" }); } finally { setEditLoading(false); } };

  const openNotif = () => { setNotifMsg({ type: "", text: "" }); setNotifForm({ title: "", message: "", type: "info" }); setNotifModal(true); requestAnimationFrame(() => setNotifVisible(true)); };
  const closeNotif = () => { setNotifVisible(false); setTimeout(() => setNotifModal(false), 200); };
  const handleNotif = async (e) => { e.preventDefault(); setNotifLoading(true); setNotifMsg({ type: "", text: "" }); try { const r = await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId: id, ...notifForm }) }); const d = await r.json(); if (!r.ok) setNotifMsg({ type: "error", text: d.error }); else { setNotifMsg({ type: "success", text: "Notification sent" }); setTimeout(closeNotif, 1200); } } catch { setNotifMsg({ type: "error", text: "Error" }); } finally { setNotifLoading(false); } };

  const toggleStatus = async () => { setStatusLoading(true); try { const r = await fetch(`/api/admin/accounts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: account.status === "active" ? "suspended" : "active" }) }); if (r.ok) { const d = await r.json(); setAccount(p => ({ ...p, status: d.account.status })); } } catch {} setStatusLoading(false); };
  const toggleVerify = async () => { setVerifyLoading(true); try { const r = await fetch(`/api/admin/accounts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_verified: !account.is_verified }) }); if (r.ok) { const d = await r.json(); setAccount(p => ({ ...p, is_verified: d.account.is_verified })); } } catch {} setVerifyLoading(false); };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-bank-600" /></div>;
  if (!account) return null;

  const Msg = ({ msg }) => msg.text ? (<div className={`flex items-center gap-2 p-3 rounded-[var(--radius-md)] mb-4 ${msg.type === "error" ? "bg-red-50 border border-red-100" : "bg-emerald-50 border border-emerald-200"}`}>{msg.type === "error" ? <AlertCircle className="w-4 h-4 text-danger shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}<span className={`text-sm ${msg.type === "error" ? "text-danger" : "text-success"}`}>{msg.text}</span></div>) : null;
  const hasVer = account.address_line1 || account.address || account.id_photo_data;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3 animate-fade-in">
        <Link href="/admin/accounts" className="p-2 hover:bg-surface-hover rounded-[var(--radius-sm)] transition-colors"><ArrowLeft className="w-5 h-5 text-text-secondary" /></Link>
        <div className="flex-1"><h1 className="text-2xl font-semibold text-text-primary">{account.full_name}</h1><p className="text-sm text-text-muted font-mono">#{account.account_number}</p></div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className="text-xs text-text-muted uppercase">{account.language || "en"}</span>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${account.status === "active" ? "bg-emerald-50 text-success" : "bg-red-50 text-danger"}`}>{account.status}</span>
          <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${account.is_verified ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-text-muted"}`}>{account.is_verified ? <><ShieldCheck className="w-3 h-3" /> Verified</> : <><ShieldX className="w-3 h-3" /> Unverified</>}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 stagger-children">
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-5"><div className="flex items-center gap-2 mb-2"><Wallet className="w-4 h-4 text-bank-700" /><span className="text-xs text-text-muted">Available</span></div><p className="text-2xl font-semibold text-text-primary num-animate">{formatCurrency(account.balance_available)}</p></div>
            <div className="card p-5"><div className="flex items-center gap-2 mb-2"><Wallet className="w-4 h-4 text-amber-600" /><span className="text-xs text-text-muted">Reserve</span></div><p className="text-2xl font-semibold text-text-primary num-animate">{formatCurrency(account.balance_reserve)}</p></div>
          </div>
          <div className="card p-5"><h3 className="text-sm font-semibold text-text-primary mb-4">Add / Deduct Balance</h3><Msg msg={balMsg} /><form onSubmit={handleBalance} className="space-y-3"><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-medium text-text-secondary mb-1">Amount (EUR)</label><input type="number" value={balForm.amount} onChange={e => setBalForm({ ...balForm, amount: e.target.value })} className="input-field !py-2.5 text-sm" step="0.01" required /></div><div><label className="block text-xs font-medium text-text-secondary mb-1">Balance Type</label><select value={balForm.balanceType} onChange={e => setBalForm({ ...balForm, balanceType: e.target.value })} className="input-field !py-2.5 text-sm"><option value="available">Available</option><option value="reserve">Reserve</option></select></div></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-medium text-text-secondary mb-1">Description</label><input type="text" value={balForm.description} onChange={e => setBalForm({ ...balForm, description: e.target.value })} className="input-field !py-2.5 text-sm" /></div><div><label className="block text-xs font-medium text-text-secondary mb-1">Reference</label><input type="text" value={balForm.reference} onChange={e => setBalForm({ ...balForm, reference: e.target.value })} className="input-field !py-2.5 text-sm" /></div></div><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={balForm.showInTransactions} onChange={e => setBalForm({ ...balForm, showInTransactions: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm text-text-secondary">Show in transactions</span></label><button type="submit" disabled={balLoading} className="btn-primary text-sm !px-5 !py-2.5 flex items-center gap-2">{balLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}</button></form></div>
          <div className="card p-5"><h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-bank-700" /> Move Funds</h3><Msg msg={moveMsg} /><form onSubmit={handleMove} className="flex flex-wrap items-end gap-3"><div className="flex-1 min-w-[120px]"><label className="block text-xs font-medium text-text-secondary mb-1">Amount (EUR)</label><input type="number" value={moveForm.amount} onChange={e => setMoveForm({ ...moveForm, amount: e.target.value })} className="input-field !py-2.5 text-sm" step="0.01" min="0.01" required /></div><div className="flex-1 min-w-[180px]"><label className="block text-xs font-medium text-text-secondary mb-1">Direction</label><select value={moveForm.direction} onChange={e => setMoveForm({ ...moveForm, direction: e.target.value })} className="input-field !py-2.5 text-sm"><option value="reserve_to_available">Reserve → Available</option><option value="available_to_reserve">Available → Reserve</option></select></div><button type="submit" disabled={moveLoading} className="btn-primary text-sm !px-5 !py-2.5">{moveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Move"}</button></form></div>
          <div className="card p-5"><h3 className="text-sm font-semibold text-text-primary mb-4">IBAN Assignment</h3><Msg msg={ibanMsg} /><form onSubmit={handleIban} className="flex gap-3"><input type="text" value={ibanInput} onChange={e => { setIbanInput(e.target.value.toUpperCase()); setIbanMsg({ type: "", text: "" }); }} className="input-field !py-2.5 text-sm font-mono flex-1" required /><button type="submit" disabled={ibanLoading} className="btn-primary text-sm !px-5 !py-2.5">{ibanLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign"}</button></form></div>
          {hasVer && (<div className="card p-5"><h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-bank-700" /> Verification Documents</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="bg-surface rounded-[var(--radius-lg)] p-4 space-y-2.5"><p className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address</p>{account.address_line1 ? <div className="space-y-1"><p className="text-sm text-text-primary">{account.address_line1}</p>{account.address_line2 && <p className="text-sm text-text-secondary">{account.address_line2}</p>}<p className="text-sm text-text-primary">{account.postal_code}{account.country ? `, ${account.country}` : ""}</p></div> : <p className="text-sm text-text-muted italic">{account.address || "Not submitted"}</p>}</div><div className="bg-surface rounded-[var(--radius-lg)] p-4 space-y-2.5"><p className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5"><Image className="w-3.5 h-3.5" /> ID Document</p>{account.id_photo_data ? <div className="space-y-2"><div className="relative group cursor-pointer" onClick={() => setShowIdPhoto(true)}><img src={account.id_photo_data} alt="ID" className="w-full max-h-32 object-cover rounded-[var(--radius-md)] border border-border-light" /><div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-[var(--radius-md)] transition-colors flex items-center justify-center"><Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" /></div></div></div> : <p className="text-sm text-text-muted italic">{account.id_photo_url === "pending_review" ? "Submitted" : "Not submitted"}</p>}</div></div></div>)}
          <div><h3 className="text-sm font-semibold text-text-primary mb-3">Transactions ({transactions.length})</h3><TransactionList transactions={transactions} accountInfo={{ full_name: account.full_name, account_number: account.account_number, iban: account.iban }} /></div>
        </div>

        {/* Right */}
        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <div className="card overflow-hidden">
            <div className="p-4 bg-bank-800 flex items-center justify-between"><div><p className="text-white font-semibold">{account.full_name}</p><p className="text-bank-300 text-xs mt-0.5 font-mono">{formatAccountId(account.account_id)}</p></div><button onClick={openEdit} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer" title="Edit"><Pencil className="w-4 h-4 text-white" /></button></div>
            <div className="divide-y divide-border-light">
              {[{ l: "Account ID", v: formatAccountId(account.account_id), i: Hash, m: true, c: account.account_id },{ l: "Account #", v: account.account_number, i: CreditCard, m: true },{ l: "Email", v: account.email || "—", i: Mail },{ l: "Phone", v: account.phone || "—", i: Phone },{ l: "IBAN", v: account.iban ? account.iban.replace(/(.{4})/g, "$1 ").trim() : "Not assigned", i: CreditCard, m: true },{ l: "Language", v: (account.language || "en").toUpperCase(), i: Globe },{ l: "Created", v: formatDate(account.created_at), i: Calendar }].map(f => { const I = f.i; return (
                <div key={f.l} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors"><I className="w-4 h-4 text-text-muted shrink-0" /><div className="flex-1 min-w-0"><p className="text-[10px] text-text-muted uppercase tracking-wider">{f.l}</p><p className={`text-sm text-text-primary mt-0.5 truncate ${f.m ? "font-mono" : ""}`}>{f.v}</p></div>{f.c && <button onClick={() => copyText(f.c, f.l)} className="p-1 cursor-pointer active:scale-90 transition-transform">{copied === f.l ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}</button>}</div>
              ); })}
            </div>
          </div>
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">Actions</h3>
            <button onClick={openNotif} className="w-full text-left px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"><Bell className="w-4 h-4" /> Send Notification</button>
            <button onClick={openEdit} className="w-full text-left px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium bg-surface hover:bg-surface-hover transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98] text-text-primary"><Pencil className="w-4 h-4" /> Edit User Info</button>
            <button onClick={toggleVerify} disabled={verifyLoading} className={`w-full text-left px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98] ${account.is_verified ? "bg-amber-50 text-amber-800 hover:bg-amber-100" : "bg-emerald-50 text-success hover:bg-emerald-100"}`}>{verifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : account.is_verified ? <><ShieldX className="w-4 h-4" />Remove Verification</> : <><ShieldCheck className="w-4 h-4" />Approve Verification</>}</button>
            <button onClick={toggleStatus} disabled={statusLoading} className={`w-full text-left px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98] ${account.status === "active" ? "bg-red-50 text-danger hover:bg-red-100" : "bg-emerald-50 text-success hover:bg-emerald-100"}`}>{statusLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : account.status === "active" ? "Suspend Account" : "Activate Account"}</button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (<div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${editVisible ? "bg-black/40" : "bg-black/0 pointer-events-none"}`} onClick={closeEdit}><div className={`bg-white rounded-[var(--radius-xl)] w-full max-w-sm shadow-xl transition-all duration-200 ${editVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`} onClick={e => e.stopPropagation()}><div className="flex items-center justify-between p-5 pb-0"><h3 className="text-base font-semibold text-text-primary">Edit Account Info</h3><button onClick={closeEdit} className="p-1.5 hover:bg-surface-hover rounded-full cursor-pointer hover:rotate-90 transition-all"><X className="w-4 h-4 text-text-muted" /></button></div><form onSubmit={handleEdit} className="p-5 space-y-4"><Msg msg={editMsg} /><div><label className="block text-xs font-medium text-text-secondary mb-1.5">Full Name</label><input type="text" value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} className="input-field" required /></div><div><label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label><input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="input-field" /></div><div><label className="block text-xs font-medium text-text-secondary mb-1.5">Phone</label><input type="tel" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="input-field" /></div><div className="flex gap-3 pt-1"><button type="button" onClick={closeEdit} className="btn-secondary flex-1 text-sm">Cancel</button><button type="submit" disabled={editLoading} className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5">{editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}</button></div></form></div></div>)}

      {/* Send Notification Modal */}
      {notifModal && (<div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${notifVisible ? "bg-black/40" : "bg-black/0 pointer-events-none"}`} onClick={closeNotif}><div className={`bg-white rounded-[var(--radius-xl)] w-full max-w-sm shadow-xl transition-all duration-200 ${notifVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`} onClick={e => e.stopPropagation()}><div className="flex items-center justify-between p-5 pb-0"><h3 className="text-base font-semibold text-text-primary">Send Notification</h3><button onClick={closeNotif} className="p-1.5 hover:bg-surface-hover rounded-full cursor-pointer hover:rotate-90 transition-all"><X className="w-4 h-4 text-text-muted" /></button></div><form onSubmit={handleNotif} className="p-5 space-y-4"><Msg msg={notifMsg} /><p className="text-xs text-text-muted">To: <span className="text-text-primary font-medium">{account.full_name}</span></p><div><label className="block text-xs font-medium text-text-secondary mb-1.5">Type</label><select value={notifForm.type} onChange={e => setNotifForm({ ...notifForm, type: e.target.value })} className="input-field !py-2.5 text-sm"><option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option><option value="security">Security</option></select></div><div><label className="block text-xs font-medium text-text-secondary mb-1.5">Title *</label><input type="text" value={notifForm.title} onChange={e => setNotifForm({ ...notifForm, title: e.target.value })} className="input-field" placeholder="Notification title" required /></div><div><label className="block text-xs font-medium text-text-secondary mb-1.5">Message *</label><textarea value={notifForm.message} onChange={e => setNotifForm({ ...notifForm, message: e.target.value })} className="input-field min-h-[100px] resize-none" placeholder="Notification message..." required /></div><div className="flex gap-3"><button type="button" onClick={closeNotif} className="btn-secondary flex-1 text-sm">Cancel</button><button type="submit" disabled={notifLoading} className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5">{notifLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" />Send</>}</button></div></form></div></div>)}

      {/* ID Photo Lightbox */}
      {showIdPhoto && account.id_photo_data && (<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowIdPhoto(false)}><div className="relative max-w-3xl max-h-[90vh]" onClick={e => e.stopPropagation()}><button onClick={() => setShowIdPhoto(false)} className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 cursor-pointer z-10"><X className="w-5 h-5" /></button><img src={account.id_photo_data} alt="ID" className="max-w-full max-h-[85vh] object-contain rounded-[var(--radius-lg)]" /></div></div>)}
    </div>
  );
}
