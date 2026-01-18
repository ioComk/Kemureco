import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "利用規約",
  description: "Kemureco の利用規約"
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Terms</p>
        <h1 className="text-3xl font-semibold text-foreground">利用規約</h1>
        <p className="text-sm text-muted-foreground">本規約はKemurecoの利用条件を定めるものです。</p>
      </header>

      <Card className="border-transparent bg-muted/30 shadow-sm">
        <CardContent className="space-y-6 p-6 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. 適用</h2>
            <p>
              本規約は、Kemureco（以下「本サービス」）の利用に関する条件を定めます。利用者は本規約に同意のうえ本サービスを利用します。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. アカウント</h2>
            <p>
              利用者は正確な情報で登録し、自己の責任でアカウントを管理します。第三者による不正利用が疑われる場合は速やかに連絡してください。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">3. 禁止事項</h2>
            <p>
              法令違反、公序良俗に反する行為、第三者の権利侵害、または本サービスの運営を妨げる行為を禁止します。違反が確認された場合、利用停止等の措置を行うことがあります。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. サービス提供</h2>
            <p>
              本サービスは予告なく内容の変更・停止・終了を行う場合があります。これにより生じた損害について、運営者は責任を負いません。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">5. 免責</h2>
            <p>
              本サービスの利用により生じた損害について、運営者は故意または重大な過失がある場合を除き責任を負いません。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">6. 規約の変更</h2>
            <p>
              運営者は必要に応じて本規約を改定します。改定後に本サービスを利用した場合、利用者は改定内容に同意したものとみなされます。
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">7. お問い合わせ</h2>
            <p>
              お問い合わせ窓口は別途ご案内します。
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
