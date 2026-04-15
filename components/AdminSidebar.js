"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { LayoutDashboard, Users, ArrowLeftRight, LogOut, Menu, X, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/accounts", label: "Accounts", icon: Users },
  { href: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight, badge: true },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function fetchPending() { try { const r = await fetch("/api/admin/transactions?status=pending&limit=1"); if (r.ok) { const d = await r.json(); setPendingCount(d.pagination?.total || 0); } } catch {} }
    fetchPending(); const interval = setInterval(fetchPending, 15000); return () => clearInterval(interval);
  }, []);

  const NavContent = () => (
    <>
      <div className="p-6 pb-8">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="DNB" className="h-8 w-auto brightness-0 invert" />
          <div>
            <span className="text-white font-semibold text-lg tracking-tight block">DNB</span>
            <span className="text-bank-400 text-[10px] uppercase tracking-widest flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Admin Panel</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200 ${isActive ? "bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]" : "text-bank-300 hover:text-white hover:bg-white/8"}`}>
              <Icon className={`w-[18px] h-[18px] transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
              <span>{item.label}</span>
              {item.badge && pendingCount > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none animate-scale-in">{pendingCount}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-9 h-9 rounded-full bg-bank-600 flex items-center justify-center text-white text-xs font-semibold">A</div>
          <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium truncate">{user?.full_name}</p><p className="text-bank-400 text-xs">Administrator</p></div>
        </div>
        <button onClick={logout} className="flex items-center gap-2 w-full px-4 py-2.5 text-bank-400 hover:text-white text-sm rounded-[var(--radius-md)] hover:bg-white/8 transition-all duration-200 cursor-pointer active:scale-[0.98]">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-bank-800 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2"><img src="/logo.svg" alt="DNB" className="h-7 w-auto brightness-0 invert" /><span className="text-white font-semibold tracking-tight">Admin</span></div>
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
