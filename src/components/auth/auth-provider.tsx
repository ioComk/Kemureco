"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createSupabaseClient } from "@/lib/supabase";

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [state, setState] = useState<AuthContextValue>({
    loading: true,
    session: null,
    user: null
  });

  useEffect(() => {
    let mounted = true;
    // #region agent log
    const startTime = Date.now();
    fetch('http://127.0.0.1:7242/ingest/627f6a83-0837-4204-a620-6f09c7612d3e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-provider.tsx:getSession:start',message:'認証状態取得開始',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/627f6a83-0837-4204-a620-6f09c7612d3e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-provider.tsx:getSession:end',message:'認証状態取得完了',data:{duration:Date.now()-startTime,hasSession:!!data.session},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        setState({
          loading: false,
          session: data.session ?? null,
          user: data.session?.user ?? null
        });
      })
      .catch(() => {
        if (!mounted) return;
        setState({ loading: false, session: null, user: null });
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        loading: false,
        session,
        user: session?.user ?? null
      });
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
