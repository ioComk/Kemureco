"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Flavor } from "@/lib/types";
import { createSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

type FlavorOption = Flavor & {
  brand: { id: number; name: string } | null;
};

type MixComponentSummary = {
  flavorId: number;
  flavorName: string;
  brandName?: string | null;
  ratio: number;
  layer: number;
};

type MixSummary = {
  id: number;
  title: string;
  description: string | null;
  created_at: string | null;
  components: MixComponentSummary[];
};

type MixComponentState = {
  flavorId: string;
  ratio: number;
};

type MixesDashboardProps = {
  flavors: FlavorOption[];
};

const MAX_COMPONENTS = 3;

export function MixesDashboard({ flavors }: MixesDashboardProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const router = useRouter();
  const { toast } = useToast();

  const [session, setSession] = useState<{ loading: boolean; userId?: string }>({ loading: true });
  const [mixes, setMixes] = useState<MixSummary[]>([]);
  const [loadingMixes, setLoadingMixes] = useState(true);
  const [editForm, setEditForm] = useState<{
    id: number;
    title: string;
    description: string;
    components: MixComponentState[];
  } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        const userId = data.user?.id;
        setSession({ loading: false, userId });
        if (userId) {
          fetchMixes(userId);
        } else {
          setLoadingMixes(false);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setSession({ loading: false, userId: undefined });
        setLoadingMixes(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      const nextUserId = authSession?.user?.id;
      setSession({ loading: false, userId: nextUserId });
      if (nextUserId) {
        fetchMixes(nextUserId);
      } else {
        setMixes([]);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const fetchMixes = useCallback(
    async (userId: string) => {
      setLoadingMixes(true);
      const { data, error } = await supabase
        .from("mixes")
        .select(
          "id,title,description,created_at,mix_components:mix_components(flavor_id,ratio_percent,layer_order,flavors(name,brands(name)))"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        toast({
          title: "ミックスの取得に失敗しました",
          description: error.message,
          variant: "destructive"
        });
        setLoadingMixes(false);
        return;
      }

      const normalized: MixSummary[] =
        data?.map((mix) => ({
          id: mix.id,
          title: mix.title,
          description: mix.description,
          created_at: mix.created_at,
          components:
            mix.mix_components?.map((component: any) => ({
              flavorId: component.flavor_id,
              flavorName: component.flavors?.name ?? "不明なフレーバー",
              brandName: component.flavors?.brands?.name ?? null,
              ratio: component.ratio_percent,
              layer: component.layer_order
            })) ?? []
        })) ?? [];

      setMixes(normalized);
      setLoadingMixes(false);
    },
    [supabase, toast]
  );

  const startEdit = (mix: MixSummary) => {
    setEditForm({
      id: mix.id,
      title: mix.title,
      description: mix.description ?? "",
      components:
        mix.components.length > 0
          ? mix.components
              .sort((a, b) => a.layer - b.layer)
              .map((component) => ({
                flavorId: String(component.flavorId),
                ratio: component.ratio
              }))
          : [{ flavorId: "", ratio: 100 }]
    });
  };

  const cancelEdit = () => {
    setEditForm(null);
  };

  const handleEditComponentChange = (index: number, partial: Partial<MixComponentState>) => {
    if (!editForm) return;
    const nextComponents = [...editForm.components];
    nextComponents[index] = { ...nextComponents[index], ...partial };
    setEditForm({ ...editForm, components: nextComponents });
  };

  const handleAddComponent = () => {
    if (!editForm || editForm.components.length >= MAX_COMPONENTS) return;
    setEditForm({
      ...editForm,
      components: [...editForm.components, { flavorId: "", ratio: 0 }]
    });
  };

  const handleRemoveComponent = (index: number) => {
    if (!editForm || editForm.components.length <= 1) return;
    setEditForm({
      ...editForm,
      components: editForm.components.filter((_, i) => i !== index)
    });
  };

  const totalEditRatio = editForm?.components.reduce((sum, component) => sum + component.ratio, 0) ?? 0;
  const editFormValid =
    !!editForm &&
    editForm.title.trim().length > 0 &&
    editForm.components.every((component) => component.flavorId !== "" && component.ratio > 0) &&
    totalEditRatio === 100;

  const handleSaveEdit = async () => {
    if (!editForm || !editFormValid) return;
    setSavingEdit(true);

    const trimmedDescription = editForm.description.trim();

    const { error: mixError } = await supabase
      .from("mixes")
      .update({
        title: editForm.title.trim(),
        description: trimmedDescription ? trimmedDescription : null
      })
      .eq("id", editForm.id);

    if (mixError) {
      toast({
        title: "ミックスの更新に失敗しました",
        description: mixError.message,
        variant: "destructive"
      });
      setSavingEdit(false);
      return;
    }

    await supabase.from("mix_components").delete().eq("mix_id", editForm.id);
    const componentsPayload = editForm.components.map((component, index) => ({
      mix_id: editForm.id,
      flavor_id: Number(component.flavorId),
      ratio_percent: component.ratio,
      layer_order: index + 1
    }));

    const { error: insertError } = await supabase.from("mix_components").insert(componentsPayload);
    setSavingEdit(false);

    if (insertError) {
      toast({
        title: "構成の更新に失敗しました",
        description: insertError.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "ミックスを更新しました"
    });

    setEditForm(null);
    if (session.userId) {
      fetchMixes(session.userId);
    } else {
      router.refresh();
    }
  };

  const handleDelete = async (mixId: number) => {
    if (!window.confirm("このミックスを削除しますか？")) return;
    setDeletingId(mixId);

    await supabase.from("mix_components").delete().eq("mix_id", mixId);
    const { error } = await supabase.from("mixes").delete().eq("id", mixId);
    setDeletingId(null);

    if (error) {
      toast({
        title: "削除に失敗しました",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "ミックスを削除しました"
    });
    setMixes((current) => current.filter((mix) => mix.id !== mixId));
  };

  if (session.loading) {
    return <p className="text-sm text-muted-foreground">認証状態を確認中です...</p>;
  }

  if (!session.userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>サインインしてください</CardTitle>
          <CardDescription>マイミックスを表示・編集するにはサインインが必要です。</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth">サインインページへ</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loadingMixes) {
    return <p className="text-sm text-muted-foreground">ミックスを読み込み中です...</p>;
  }

  if (mixes.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-3 py-10 text-center">
          <p className="text-sm text-muted-foreground">まだミックスが登録されていません。</p>
          <Button asChild size="sm">
            <Link href="/mixes/new">最初のミックスを作成する</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {mixes.map((mix) => {
        const isEditing = editForm?.id === mix.id;
        return (
          <Card key={mix.id}>
            <CardHeader>
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <CardTitle>{mix.title}</CardTitle>
                  <CardDescription>
                    {mix.created_at
                      ? new Date(mix.created_at).toLocaleString("ja-JP", { dateStyle: "medium", timeStyle: "short" })
                      : "作成日時不明"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => (isEditing ? cancelEdit() : startEdit(mix))}>
                    {isEditing ? "編集を閉じる" : "編集"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(mix.id)}
                    disabled={deletingId === mix.id}
                  >
                    {deletingId === mix.id ? "削除中..." : "削除"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {mix.description ? <p className="text-sm text-muted-foreground">{mix.description}</p> : null}
              <div className="space-y-2">
                <p className="text-sm font-medium">構成</p>
                <div className="flex flex-wrap gap-2">
                  {mix.components.map((component) => (
                    <Badge key={`${mix.id}-${component.flavorId}`} variant="outline">
                      {component.brandName ? `${component.brandName} / ` : ""}
                      {component.flavorName} ({component.ratio}%)
                    </Badge>
                  ))}
                </div>
              </div>
              {isEditing ? (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="space-y-2">
                    <Label htmlFor={`edit-title-${mix.id}`}>タイトル</Label>
                    <Input
                      id={`edit-title-${mix.id}`}
                      value={editForm?.title ?? ""}
                      onChange={(event) => editForm && setEditForm({ ...editForm, title: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`edit-description-${mix.id}`}>説明</Label>
                    <Textarea
                      id={`edit-description-${mix.id}`}
                      value={editForm?.description ?? ""}
                      onChange={(event) => editForm && setEditForm({ ...editForm, description: event.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">フレーバー構成（合計 {totalEditRatio}%）</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleAddComponent}
                        disabled={editForm?.components.length === MAX_COMPONENTS}
                      >
                        追加
                      </Button>
                    </div>
                    {editForm?.components.map((component, index) => (
                      <div key={index} className="rounded-md border p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>フレーバー {index + 1}</Label>
                          {editForm.components.length > 1 ? (
                            <Button type="button" size="sm" variant="ghost" onClick={() => handleRemoveComponent(index)}>
                              削除
                            </Button>
                          ) : null}
                        </div>
                        <Select
                          value={component.flavorId}
                          onValueChange={(value) => handleEditComponentChange(index, { flavorId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="フレーバーを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {flavors.map((flavor) => (
                              <SelectItem key={flavor.id} value={String(flavor.id)}>
                                {flavor.brand?.name ? `${flavor.brand.name} / ${flavor.name}` : flavor.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="space-y-2">
                          <Label>比率 {component.ratio}%</Label>
                          <Slider
                            value={[component.ratio]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={(value) => handleEditComponentChange(index, { ratio: value[0] ?? 0 })}
                          />
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      すべてのフレーバーの合計が 100% になるように調整してください。
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={cancelEdit} disabled={savingEdit}>
                      キャンセル
                    </Button>
                    <Button type="button" onClick={handleSaveEdit} disabled={!editFormValid || savingEdit}>
                      {savingEdit ? "保存中..." : "保存"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
