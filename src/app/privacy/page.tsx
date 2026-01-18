import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "Kemureco のプライバシーポリシー"
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Privacy</p>
        <h1 className="text-3xl font-semibold text-foreground">プライバシーポリシー</h1>
        <p className="text-sm text-muted-foreground">本ポリシーはKemurecoの個人情報の取扱いを定めます。</p>
      </header>

      <Card className="border-transparent bg-muted/30 shadow-sm">
        <CardContent className="space-y-6 p-6 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. 取得する情報</h2>
            <p>
              本サービスは、アカウント作成に必要なメールアドレス、利用時の記録データ（フレーバー・ミックス・セッション情報）などを取得します。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. 利用目的</h2>
            <p>
              取得した情報は、認証、記録の保存、レコメンド機能の提供、サービス改善のために利用します。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">3. 第三者提供</h2>
            <p>
              法令に基づく場合を除き、本人の同意なく第三者に提供しません。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. 保管期間</h2>
            <p>
              取得した情報は、本サービスの提供に必要な期間に限り保管します。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">5. 開示・訂正・削除</h2>
            <p>
              利用者からの開示・訂正・削除の要望については、別途ご案内する窓口で受け付けます。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">6. ポリシーの変更</h2>
            <p>
              本ポリシーは必要に応じて改定します。改定後に本サービスを利用した場合、改定内容に同意したものとみなされます。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">7. お問い合わせ</h2>
            <p>お問い合わせ窓口は別途ご案内します。</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
