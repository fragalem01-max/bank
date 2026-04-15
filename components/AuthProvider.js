"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { t as translate, getGreeting as getGreetingFn } from "@/lib/translations";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLangState] = useState("en");
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/verify");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user?.language) setLangState(data.user.language);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  const refreshUser = () => fetchUser();

  const setLang = async (newLang) => {
    setLangState(newLang);
    try {
      await fetch("/api/auth/verify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: newLang }),
      });
    } catch {}
  };

  const t = (key) => translate(lang, key);
  const greeting = () => getGreetingFn(lang);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser, lang, setLang, t, greeting }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
