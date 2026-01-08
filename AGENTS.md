# AGENTS.md — Kemureco

## 目的
Kemureco は、シーシャ利用者向けにフレーバー・ミックス・セッション記録・レコメンドを提供する Web プラットフォーム。

---

## 絶対ルール（最優先）
- 出力・コメントは日本語
- 破壊的変更は禁止
- 冪等性のあるロジックを維持する
- 不明点は仮定せず質問する
- 実装後は http://localhost:3000 で HTTP 200 を確認する

---

## 開発フロー
- 新機能・新トピックは **必ず main からブランチを切る**
- main にマージ後、ブランチは削除する
- 仕様変更時は `doc/specification.md` を更新する

---

## 設計・参照ルール
- フロントエンド設計は `doc/SKILL.md` に従う
- UI 実装は shadcn/ui を優先利用
- 認可・制限は Supabase RLS を前提とする

---

## 技術前提（固定）
- Frontend: Next.js 14 (App Router) + TypeScript
- Backend: Supabase (Auth / RLS / Edge Functions)
- デプロイ: Cloudflare Pages
