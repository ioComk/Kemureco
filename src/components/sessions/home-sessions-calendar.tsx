"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { Session } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

export function HomeSessionsCalendar() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { toast } = useToast();
  const [sessionState, setSessionState] = useState<{ loading: boolean; userId?: string }>({ loading: true });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        const userId = data.user?.id;
        setSessionState({ loading: false, userId });
        if (userId) {
          void fetchSessions(userId);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setSessionState({ loading: false, userId: undefined });
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      const nextUserId = authSession?.user?.id;
      setSessionState({ loading: false, userId: nextUserId });
      if (nextUserId) {
        void fetchSessions(nextUserId);
      } else {
        setSessions([]);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSessions = async (userId: string) => {
    const { data, error } = await supabase
      .from("sessions")
      .select("id, started_at, satisfaction")
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    if (error) {
      console.error(error);
      toast({ title: "記録の取得に失敗しました", description: error.message, variant: "destructive" });
      return;
    }

    setSessions(Array.isArray(data) ? data : []);
  };

  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { date?: Date }[] = [];
    for (let i = 0; i < startWeekDay; i += 1) cells.push({ date: undefined });
    for (let day = 1; day <= daysInMonth; day += 1) cells.push({ date: new Date(year, month, day) });
    while (cells.length % 7 !== 0) cells.push({ date: undefined });
    return cells;
  }, [currentMonth]);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, Session[]>();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    sessions.forEach((session) => {
      if (!session.started_at) return;
      const date = new Date(session.started_at);
      if (date < monthStart || date > monthEnd) return;
      const key = date.toISOString().slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(session);
      map.set(key, arr);
    });
    return map;
  }, [sessions, currentMonth]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>最近の記録カレンダー</CardTitle>
          <CardDescription>ログイン中のユーザーのセッションを月別に表示します。</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <ButtonControls
            onPrev={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            onNext={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            label={`${currentMonth.getFullYear()}年 ${currentMonth.getMonth() + 1}月`}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessionState.userId ? null : (
          <p className="text-sm text-muted-foreground">サインインするとカレンダーに記録が表示されます。</p>
        )}
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
          {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
            <div key={w} className="font-medium">
              {w}
            </div>
          ))}
          {calendarCells.map((cell, idx) => {
            const date = cell.date;
            const key = date ? date.toISOString().slice(0, 10) : `blank-${idx}`;
            const daySessions = date ? sessionsByDate.get(key) ?? [] : [];
            return (
              <div
                key={key}
                className={`h-20 rounded-md border bg-background p-2 text-left ${daySessions.length > 0 ? "border-primary/50" : ""}`}
              >
                {date ? <p className="text-xs font-medium">{date.getDate()}</p> : null}
                {daySessions.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {daySessions.length} 件
                    </Badge>
                    <div className="flex flex-wrap gap-1">
                      {daySessions.slice(0, 3).map((session) => (
                        <span key={session.id} className="text-[10px] text-muted-foreground">
                          {session.satisfaction ? `満足度 ${session.satisfaction}` : "記録"}
                        </span>
                      ))}
                      {daySessions.length > 3 ? (
                        <span className="text-[10px] text-muted-foreground">他 {daySessions.length - 3} 件</span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ButtonControls({ onPrev, onNext, label }: { onPrev: () => void; onNext: () => void; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        type="button"
        className="rounded-md border px-2 py-1 text-muted-foreground transition hover:bg-accent"
        onClick={onPrev}
        aria-label="前の月"
      >
        ←
      </button>
      <span className="font-medium">{label}</span>
      <button
        type="button"
        className="rounded-md border px-2 py-1 text-muted-foreground transition hover:bg-accent"
        onClick={onNext}
        aria-label="次の月"
      >
        →
      </button>
    </div>
  );
}
