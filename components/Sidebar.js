"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { getInitials } from "@/lib/utils";
import { LayoutDashboard, ArrowLeftRight, Bell, ShieldCheck, Settings, LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, t } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = [
    { href: "/dashboard", label: t("overview"), icon: LayoutDashboard },
    { href: "/dashboard/transfer", label: t("transfers"), icon: ArrowLeftRight },
    { href: "/dashboard/notifications", label: t("notifications"), icon: Bell },
    { href: "/dashboard/verification", label: t("verification"), icon: ShieldCheck },
    { href: "/dashboard/settings", label: t("settings"), icon: Settings },
  ];

  useEffect(() => {
    async function fetchUnread() { try { const r = await fetch("/api/notifications"); if (r.ok) { const d = await r.json(); setUnreadCount(d.notifications?.filter(n => !n.is_read).length || 0); } } catch {} }
    fetchUnread(); const iv = setInterval(fetchUnread, 30000); return () => clearInterval(iv);
  }, []);

  const NavContent = () => (
    <>
      <div className="p-6 pb-8">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="DNB" className="h-8 w-auto brightness-0 invert" />
          <span className="text-white font-semibold text-lg tracking-tight">DNB</span>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200 ${isActive ? "bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]" : "text-bank-300 hover:text-white hover:bg-white/8"}`}>
              <Icon className={`w-[18px] h-[18px] transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
              <span>{item.label}</span>
              {item.label === t("notifications") && unreadCount > 0 && (
                <span className="ml-auto bg-white/20 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center animate-scale-in">{unreadCount}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-9 h-9 rounded-full bg-bank-600 flex items-center justify-center text-white text-xs font-semibold">{getInitials(user?.full_name)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-bank-400 text-xs truncate">{user?.account_number ? `Acc: ${user.account_number}` : ""}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-2 w-full px-4 py-2.5 text-bank-400 hover:text-white text-sm rounded-[var(--radius-md)] hover:bg-white/8 transition-all duration-200 cursor-pointer active:scale-[0.98]">
          <LogOut className="w-4 h-4" />{t("signOut")}
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-bank-800 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2"><img src="/logo.svg" alt="DNB" className="h-7 w-auto brightness-0 invert" /><span className="text-white font-semibold tracking-tight">DNB</span></div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white p-2 cursor-pointer active:scale-90 transition-transform">{mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
      </div>
      <div className={`lg:hidden fixed inset-0 z-40 pt-16 transition-all duration-300 ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div className={`absolute inset-0 bg-black transition-opacity duration-300 ${mobileOpen ? "opacity-50" : "opacity-0"}`} onClick={() => setMobileOpen(false)} />
        <div className={`w-72 h-full bg-bank-800 flex flex-col relative z-10 transition-transform duration-300 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}><NavContent /></div>
      </div>
      <aside className="hidden lg:flex w-64 bg-bank-800 h-screen fixed left-0 top-0 flex-col z-30"><NavContent /></aside>
    </>
  );
}
