"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ShieldCheck, Upload, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";

const countries = ["Albania","Austria","Belgium","Bosnia and Herzegovina","Bulgaria","Croatia","Cyprus","Czech Republic","Denmark","Estonia","Finland","France","Germany","Greece","Hungary","Iceland","Ireland","Italy","Kosovo","Latvia","Liechtenstein","Lithuania","Luxembourg","Malta","Moldova","Monaco","Montenegro","Netherlands","North Macedonia","Norway","Poland","Portugal","Romania","San Marino","Serbia","Slovakia","Slovenia","Spain","Sweden","Switzerland","Turkey","Ukraine","United Kingdom","Other"];

export default function VerificationPage() {
  const { user, refreshUser, t } = useAuth();
  const [form, setForm] = useState({ addressLine1: "", addressLine2: "", postalCode: "", country: "" });
  const [idFile, setIdFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const upd = (f, v) => { setForm(p => ({ ...p, [f]: v })); setError(""); };

  if (user?.is_verified) return (
    <div className="space-y-6 pb-8"><h1 className="text-2xl font-semibold text-text-primary">{t("verificationCenter")}</h1>
      <div className="card p-8 text-center space-y-3 animate-fade-in-up"><CheckCircle2 className="w-14 h-14 text-success mx-auto" /><h2 className="text-xl font-semibold text-text-primary">{t("accountVerified")}</h2><p className="text-text-secondary text-sm max-w-sm mx-auto">{t("accountVerifiedDesc")}</p></div>
    </div>
  );

  const handleFile = (e) => { const f = e.target.files[0]; if (f) { if (f.size > 5*1024*1024) { setError(t("fileTooLarge")); return; } if (!f.type.startsWith("image/")) { setError(t("onlyImages")); return; } setIdFile(f); setError(""); const r = new FileReader(); r.onload = ev => setPreview(ev.target.result); r.readAsDataURL(f); } };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.addressLine1.trim()) { setError(t("addressRequired")); return; }
    if (!form.postalCode.trim()) { setError(t("postalRequired")); return; }
    if (!form.country) { setError(t("countryRequired")); return; }
    if (!idFile) { setError(t("idRequired")); return; }
    setLoading(true); setError("");
    try { const r = new FileReader(); r.onload = async (ev) => { try { const res = await fetch("/api/verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ addressLine1: form.addressLine1.trim(), addressLine2: form.addressLine2.trim(), postalCode: form.postalCode.trim(), country: form.country, idPhotoBase64: ev.target.result }) }); const d = await res.json(); if (!res.ok) { setError(d.error); setLoading(false); return; } setSuccess(true); refreshUser(); } catch { setError(t("connectionError")); } setLoading(false); }; r.readAsDataURL(idFile); } catch { setError(t("connectionError")); setLoading(false); }
  };

  if (success || user?.id_photo_url) return (
    <div className="space-y-6 pb-8"><h1 className="text-2xl font-semibold text-text-primary">{t("verificationCenter")}</h1>
      <div className="card p-8 text-center space-y-3 animate-fade-in-up"><div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto"><Loader2 className="w-7 h-7 text-warning animate-[spin_3s_linear_infinite]" /></div><h2 className="text-xl font-semibold text-text-primary">{t("underReview")}</h2><p className="text-text-secondary text-sm max-w-sm mx-auto">{t("underReviewDesc")}</p></div>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-2xl font-semibold text-text-primary animate-fade-in">{t("verificationCenter")}</h1>
      <div className="max-w-lg animate-fade-in-up">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-full bg-bank-50 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-bank-700" /></div><div><h2 className="font-semibold text-text-primary">{t("identityVerification")}</h2><p className="text-xs text-text-muted">{t("requiredForTransfers")}</p></div></div>
          <div className={`overflow-hidden transition-all duration-300 ${error ? "max-h-20 opacity-100 mb-4" : "max-h-0 opacity-0"}`}><div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-md)]"><AlertCircle className="w-4 h-4 text-danger shrink-0" /><span className="text-sm text-danger">{error}</span></div></div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-2 mb-1"><div className="w-6 h-6 rounded-full bg-bank-800 text-white text-xs flex items-center justify-center font-semibold">1</div><span className="text-sm font-semibold text-text-primary">{t("residentialAddress")}</span></div>
            <div className="space-y-3 pl-8">
              <div><label className="block text-xs font-medium text-text-secondary mb-1.5">{t("addressLine1")} *</label><input type="text" value={form.addressLine1} onChange={e => upd("addressLine1", e.target.value)} className="input-field" required /></div>
              <div><label className="block text-xs font-medium text-text-secondary mb-1.5">{t("addressLine2")} <span className="text-text-muted">({t("optional")})</span></label><input type="text" value={form.addressLine2} onChange={e => upd("addressLine2", e.target.value)} className="input-field" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-text-secondary mb-1.5">{t("postalCode")} *</label><input type="text" value={form.postalCode} onChange={e => upd("postalCode", e.target.value)} className="input-field" required /></div>
                <div><label className="block text-xs font-medium text-text-secondary mb-1.5">{t("country")} *</label><select value={form.country} onChange={e => upd("country", e.target.value)} className="input-field" required><option value="">{t("selectCountry")}</option>{countries.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
            </div>
            <div className="pt-2"><div className="flex items-center gap-2 mb-1"><div className="w-6 h-6 rounded-full bg-bank-800 text-white text-xs flex items-center justify-center font-semibold">2</div><span className="text-sm font-semibold text-text-primary">{t("identityDocument")}</span></div><p className="text-xs text-text-muted pl-8 mb-3">{t("idUploadDesc")}</p></div>
            <div className="pl-8">
              <div className={`border-2 border-dashed rounded-[var(--radius-lg)] transition-colors ${preview ? "border-bank-300 bg-bank-50/30 p-4" : "border-border hover:border-bank-400 hover:bg-surface-hover p-8 cursor-pointer"}`} onClick={() => !preview && document.getElementById("id-upload").click()}>
                {preview ? (<div className="space-y-3"><div className="relative inline-block"><img src={preview} alt="ID" className="max-h-48 rounded-[var(--radius-md)] object-contain border border-border-light" /><button type="button" onClick={() => { setIdFile(null); setPreview(null); }} className="absolute -top-2 -right-2 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"><X className="w-3.5 h-3.5" /></button></div><p className="text-xs text-text-muted">{idFile?.name}</p></div>) : (<div className="text-center space-y-2"><div className="w-12 h-12 rounded-full bg-surface mx-auto flex items-center justify-center"><Upload className="w-5 h-5 text-text-muted" /></div><p className="text-sm text-text-secondary">{t("clickToUpload")}</p><p className="text-xs text-text-muted">{t("fileLimit")}</p></div>)}
                <input id="id-upload" type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleFile} className="hidden" />
              </div>
            </div>
            <div className="pt-2"><button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 h-[50px]">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4" />{t("submitVerification")}</>}</button></div>
          </form>
          <p className="text-[11px] text-text-muted mt-4 leading-relaxed">{t("verificationDisclaimer")}</p>
        </div>
      </div>
    </div>
  );
}
