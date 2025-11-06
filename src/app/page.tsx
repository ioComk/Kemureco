import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function fetchRecommendations() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { mixes: [] };
  }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/recommend`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }

    return (await res.json()) as { mixes: { title: string; score: number }[] };
  } catch (error) {
    console.error(error);
    return { mixes: [] };
  }
}

export default async function Page() {
  const data = await fetchRecommendations();

  const recentSessions = [
    {
      id: 1,
      title: "渋谷ラウンジ",
      summary: "チルな夜。ブルーベリーがよかった。",
    },
    { id: 2, title: "下北沢ハウス", summary: "シトラスミントで気分転換。" },
  ];

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>在庫があればおすすめ</CardTitle>
          <CardDescription>
            Edge Function からのおすすめを表示します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.mixes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              おすすめデータがまだありません。
            </p>
          ) : (
            <div className="space-y-4">
              {data.mixes.map((mix, index) => (
                <div key={mix.title} className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{mix.title}</p>
                      <p className="text-sm text-muted-foreground">
                        スコア {(mix.score * 100).toFixed(0)}%
                      </p>
                    </div>
                    <Badge variant="secondary">#{index + 1}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>最近の記録</CardTitle>
          <CardDescription>
            最近のセッションをざっくり振り返りましょう。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSessions.map((session) => (
              <div key={session.id} className="rounded-md border p-4">
                <p className="font-medium">{session.title}</p>
                <p className="text-sm text-muted-foreground">
                  {session.summary}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
