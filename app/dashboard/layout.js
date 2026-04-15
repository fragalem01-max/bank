"use client";

import { AuthProvider, useAuth } from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";
import { SkeletonDashboard } from "@/components/Skeleton";

function DashboardContent({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <aside className="hidden lg:flex w-64 bg-bank-800 h-screen fixed left-0 top-0 flex-col z-30">
          <div className="p-6 pb-8 animate-pulse-soft"><div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded bg-white/10" /><div className="h-5 w-28 rounded bg-white/10" /></div></div>
          <div className="px-3 space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-11 rounded-[var(--radius-md)] bg-white/5" />)}</div>
        </aside>
        <main className="lg:ml-64 pt-16 lg:pt-0"><div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto"><SkeletonDashboard /></div></main>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <main className="lg:ml-64 pt-16 lg:pt-0"><div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">{children}</div></main>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return <AuthProvider><DashboardContent>{children}</DashboardContent></AuthProvider>;
}
