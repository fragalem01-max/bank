"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { formatAccountId } from "@/lib/utils";
import { User, Mail, Phone, Hash, CreditCard, ShieldCheck, ShieldX, Globe, Check } from "lucide-react";

export default function SettingsPage() {
  const { user, t, lang, setLang } = useAuth();
  const [langSaved, setLangSaved] = useState(false);

  const handleLangChange = async (newLang) => {
    await setLang(newLang);
    setLangSaved(true);
    setTimeout(() => setLangSaved(false), 2000);
  };

  const fields = [
    { label: t("fullName"), value: user?.full_name, icon: User },
    { label: t("accountId"), value: formatAccountId(user?.account_id), icon: Hash, mono: true },
    { label: t("accountNumber"), value: user?.account_number, icon: CreditCard, mono: true },
    { label: "IBAN", value: user?.iban ? user.iban.replace(/(.{4})/g, "$1 ").trim() : t("notAssigned"), icon: CreditCard, mono: true },
    { label: t("email"), value: user?.email || "—", icon: Mail },
    { label: t("phone"), value: user?.phone || "—", icon: Phone },
    { label: t("verification"), value: user?.is_verified ? t("accountVerified") : t("verificationRequired"), icon: user?.is_verified ? ShieldCheck : ShieldX, highlight: user?.is_verified ? "text-success" : "text-warning" },
  ];

  return (
    <div className="space-y-6 pb-8 stagger-children">
      <h1 className="text-2xl font-semibold text-text-primary">{t("accountSettings")}</h1>

      {/* Language Selector */}
      <div className="card overflow-hidden max-w-2xl">
        <div className="p-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4 text-text-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-muted">{t("language")}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <button
                onClick={() => handleLangChange("en")}
                className={`px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-all duration-200 cursor-pointer active:scale-[0.97] ${lang === "en" ? "bg-bank-800 text-white" : "bg-surface text-text-secondary hover:bg-surface-hover"}`}
              >
                {t("english")}
              </button>
              <button
                onClick={() => handleLangChange("it")}
                className={`px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-all duration-200 cursor-pointer active:scale-[0.97] ${lang === "it" ? "bg-bank-800 text-white" : "bg-surface text-text-secondary hover:bg-surface-hover"}`}
              >
                {t("italian")}
              </button>
              <div className={`flex items-center gap-1 text-xs text-success transition-all duration-300 ${langSaved ? "opacity-100" : "opacity-0"}`}>
                <Check className="w-3.5 h-3.5" /> {t("languageSaved")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="card overflow-hidden max-w-2xl">
        <div className="divide-y divide-border-light">
          {fields.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.label} className="flex items-center gap-4 p-4 hover:bg-surface-hover transition-colors duration-200">
                <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-muted">{field.label}</p>
                  <p className={`text-sm mt-0.5 ${field.highlight || "text-text-primary"} ${field.mono ? "font-mono" : ""}`}>{field.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-2xl"><p className="text-xs text-text-muted">{t("contactAdmin")}</p></div>
    </div>
  );
}
