"use client";

import { Wallet, Shield, Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { SkeletonCard } from "./Skeleton";
import { useAuth } from "./AuthProvider";

export default function BalanceCards({ available, reserve, loading }) {
  const { t } = useAuth();

  if (loading) return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><SkeletonCard /><SkeletonCard /></div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
      <div className="card-hover p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-bank-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-bank-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"><Wallet className="w-[18px] h-[18px] text-bank-700" /></div>
            <span className="text-text-secondary text-sm font-medium">{t("availableBalance")}</span>
          </div>
          <p className="text-3xl font-semibold text-text-primary tracking-tight num-animate">{formatCurrency(available || 0)}</p>
          <p className="text-text-muted text-xs mt-2 flex items-center gap-1"><Info className="w-3 h-3" />{t("availableForTransfers")}</p>
        </div>
      </div>
      <div className="card-hover p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"><Shield className="w-[18px] h-[18px] text-amber-600" /></div>
            <span className="text-text-secondary text-sm font-medium">{t("reserveBalance")}</span>
          </div>
          <p className="text-3xl font-semibold text-text-primary tracking-tight num-animate">{formatCurrency(reserve || 0)}</p>
          <p className="text-text-muted text-xs mt-2 flex items-center gap-1"><Info className="w-3 h-3" />{t("heldInReserve")}</p>
        </div>
      </div>
    </div>
  );
}
