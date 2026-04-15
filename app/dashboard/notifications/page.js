"use client";

import { useState, useEffect } from "react";
import { formatDateTime } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { Bell, CheckCircle2, AlertCircle, Info, ArrowLeftRight, Shield, CheckCheck } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";

const typeIcons = { info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50" }, success: { icon: CheckCircle2, color: "text-success", bg: "bg-emerald-50" }, warning: { icon: AlertCircle, color: "text-warning", bg: "bg-amber-50" }, transfer: { icon: ArrowLeftRight, color: "text-bank-700", bg: "bg-bank-50" }, security: { icon: Shield, color: "text-purple-600", bg: "bg-purple-50" } };

export default function NotificationsPage() {
  const { t } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { try { const r = await fetch("/api/notifications"); if (r.ok) { const d = await r.json(); setNotifications(d.notifications); } } catch {} finally { setLoading(false); } })(); }, []);

  const markAllRead = async () => { try { await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) }); setNotifications(p => p.map(n => ({ ...n, is_read: true }))); } catch {} };
  const markOneRead = async (id) => { try { await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id }) }); setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n)); } catch {} };
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between animate-fade-in">
        <div><h1 className="text-2xl font-semibold text-text-primary">{t("notifications")}</h1>{unreadCount > 0 && <p className="text-sm text-text-muted mt-1">{unreadCount} {t("unread")}</p>}</div>
        {unreadCount > 0 && <button onClick={markAllRead} className="btn-secondary text-sm flex items-center gap-2 !px-4 !py-2"><CheckCheck className="w-4 h-4" />{t("markAllRead")}</button>}
      </div>
      {loading ? (
        <div className="card overflow-hidden divide-y divide-border-light">{[1,2,3,4].map(i => <div key={i} className="flex items-start gap-4 p-4"><Skeleton className="w-10 h-10 rounded-full shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-64" /><Skeleton className="h-3 w-24" /></div></div>)}</div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center animate-fade-in"><Bell className="w-10 h-10 text-text-muted mx-auto mb-3" /><p className="text-text-muted">{t("noNotifications")}</p></div>
      ) : (
        <div className="card overflow-hidden divide-y divide-border-light animate-fade-in-up">
          {notifications.map((notif, i) => { const config = typeIcons[notif.type] || typeIcons.info; const Icon = config.icon; return (
            <div key={notif.id} onClick={() => !notif.is_read && markOneRead(notif.id)} className={`flex items-start gap-4 p-4 transition-all duration-300 cursor-pointer group ${notif.is_read ? "bg-white hover:bg-surface-hover" : "bg-bank-50/30 hover:bg-bank-50/50"}`} style={{ animationDelay: `${i * 30}ms` }}>
              <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200`}><Icon className={`w-[18px] h-[18px] ${config.color}`} /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2"><p className={`text-sm ${notif.is_read ? "text-text-secondary" : "text-text-primary font-medium"}`}>{notif.title}</p>{!notif.is_read && <div className="w-2 h-2 rounded-full bg-bank-600 shrink-0 mt-1.5 animate-pulse-soft" />}</div>
                <p className="text-sm text-text-muted mt-0.5 leading-relaxed">{notif.message}</p>
                <p className="text-xs text-text-muted mt-1.5">{formatDateTime(notif.created_at)}</p>
              </div>
            </div>
          ); })}
        </div>
      )}
    </div>
  );
}
