"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [accountId, setAccountId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const formatInput = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const handleAccountIdChange = (e) => { setAccountId(formatInput(e.target.value)); setError(""); };
  const getRawAccountId = () => accountId.replace(/-/g, "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const raw = getRawAccountId();
    if (raw.length !== 11) { setError("Account ID must be 11 digits"); return; }
    if (!password) { setError("Password is required"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId: raw, password }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      if (data.role === "admin") router.push("/admin"); else router.push("/dashboard");
    } catch { setError("Connection error. Please try again."); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-bank-800 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </div>
        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="DNB" className="h-10 w-auto brightness-0 invert" />
            <span className="text-white text-xl font-semibold tracking-tight">DNB</span>
          </div>
        </div>
        <div className="relative z-10 space-y-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <h1 className="text-4xl xl:text-5xl text-white font-light leading-[1.15] tracking-tight">
            We believe your<br />finances will be<br /><span className="font-semibold">better off with us</span>
          </h1>
          <p className="text-bank-300 text-lg max-w-md leading-relaxed">Secure, reliable, and always accessible. Your banking experience, reimagined for the digital age.</p>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-bank-400 text-sm animate-fade-in" style={{ animationDelay: "500ms" }}>
          <Shield className="w-4 h-4" /><span>256-bit SSL encrypted connection</span>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-12 animate-fade-in">
            <img src="/logo.svg" alt="DNB" className="h-9 w-auto" />
            <span className="text-bank-800 text-xl font-semibold tracking-tight">DNB</span>
          </div>

          <div className="space-y-2 mb-10 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <h2 className="text-2xl font-semibold text-text-primary">Welcome back</h2>
            <p className="text-text-secondary">Sign in with your Account ID to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">Account ID</label>
              <input type="text" value={accountId} onChange={handleAccountIdChange} placeholder="000-0000-0000" className="input-field font-mono text-lg tracking-wider" autoComplete="off" maxLength={13} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="Enter your password" className="input-field pr-12" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors p-1 cursor-pointer">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error with animation */}
            <div className={`overflow-hidden transition-all duration-300 ${error ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-md)] text-danger text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-danger mt-1.5 shrink-0" />{error}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 text-base h-[52px]">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (<>Sign In<ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border-light animate-fade-in" style={{ animationDelay: "400ms" }}>
            <p className="text-text-muted text-sm text-center">Contact your administrator if you need access or have forgotten your credentials.</p>
          </div>
          <div className="lg:hidden mt-8 flex items-center justify-center gap-2 text-text-muted text-xs animate-fade-in" style={{ animationDelay: "500ms" }}>
            <Shield className="w-3.5 h-3.5" /><span>256-bit SSL encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
