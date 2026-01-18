# 🌿 Kemureco 機能仕様書（Functional Specification）

2025/11/10 初版. @Rui Watanabe

## 1. プロジェクト概要

| 項目 | 内容 |
|:--|:--|
| **プロジェクト名** | Kemureco（けむれこ） |
| **目的** | シーシャ利用者がフレーバーの記録・管理・共有・おすすめを受けられるプラットフォームを提供する |
| **スローガン** | 「けむりを、記す。すすめる。」 |
| **開発体制** | 個人開発（将来的にOSS化・拡張予定） |
| **主要技術** | Next.js 14 (App Router) / TypeScript / shadcn/ui / Supabase / Cloudflare Pages / Edge Functions |

---

## 2. システム構成（概要）

- **Frontend**：Cloudflare Pages 上の Next.js + shadcn/ui  
- **Backend**：Supabase (PostgREST + Auth + RLS + Edge Functions)  
- **デプロイ環境**：Cloudflare Pages（フロント）＋ Supabase（DB・API・ストレージ）  
- **オプション拡張**：Cloudflare Workers (BFF/キャッシュ層)、Cloudflare R2 (画像)

---

## 3. ユースケース定義

| No | ユースケース | 主体 | 概要 |
|:--:|:--|:--|:--|
| 1 | フレーバーを閲覧する | 一般ユーザー | 登録済みブランド・フレーバーの一覧を参照 |
| 2 | ミックスを作成する | ログインユーザー | 所有フレーバーから比率を指定してミックスを登録 |
| 3 | 吸った記録を残す | ログインユーザー | 日付・場所・満足度・メモを添えて記録を保存 |
| 4 | おすすめミックスを受け取る | ログインユーザー | 季節・嗜好履歴・人気傾向に基づきAIが提案 |
| 5 | フレーバーをお気に入り登録 | ログインユーザー | よく使うフレーバーをブックマーク |
| 6 | プロフィール設定 | ログインユーザー | 好み・経験レベル・デバイスなどを保存 |
| 7 | ゲスト閲覧 | 未ログインユーザー | 公開ミックス・ランキングを閲覧 |

---

## 4. 機能要件一覧

### 4.1 認証系

| ID | 機能 | 概要 |
|:--|:--|:--|
| AUTH-01 | メール/Googleログイン | Supabase Authを利用 |
| AUTH-02 | 年齢確認 | プロフィール登録時に生年月日入力。20歳未満は投稿不可（RLS制御） |
| AUTH-03 | ログアウト | ローカルセッション削除 |

### 4.2 フレーバー管理

| ID | 機能 | 概要 |
|:--|:--|:--|
| FLV-01 | フレーバー一覧 | Supabaseの`flavors`テーブル参照。ブランド・タグ・人気順でソート |
| FLV-02 | フレーバー検索 | 部分一致・タグ検索 |
| FLV-03 | フレーバー詳細 | タグ・説明・レビュー統計を表示 |
| FLV-04 | フレーバー登録（管理者） | 新ブランドやフレーバーを登録（限定RLS） |

### 4.3 ミックス作成・管理

| ID | 機能 | 概要 |
|:--|:--|:--|
| MIX-01 | ミックス作成 | フレーバーを最大3種選択し、比率合計=100%で保存 |
| MIX-02 | ミックス編集 | タイトル・説明・比率を再編集 |
| MIX-03 | ミックス削除 | 所有者のみ削除可能（RLS制御） |
| MIX-04 | ミックス一覧 | 自分のミックスを一覧表示 |
| MIX-05 | ミックス共有 | 公開設定されたミックスをURL共有（Supabase Row-Level Policy） |

### 4.4 セッション（吸った記録）

| ID | 機能 | 概要 |
|:--|:--|:--|
| SES-01 | 記録登録 | ミックス・日付・満足度・場所を登録 |
| SES-02 | 記録一覧 | カレンダー/タイムラインで過去履歴を閲覧 |
| SES-03 | 集計 | フレーバー使用頻度・満足度平均などを集計 |

### 4.5 レコメンド機能

| ID | 機能 | 概要 |
|:--|:--|:--|
| REC-01 | 季節ベース | 気温・季節タグに基づくおすすめ |
| REC-02 | 嗜好ベース | ユーザー履歴（好き・満足度高）に類似するミックスを提示 |
| REC-03 | 人気トレンド | 全体集計からトップミックスを表示 |
| REC-04 | Edge Function実装 | Supabase Edge Function `recommend` 経由で実行（JSON返却） |

### 4.6 UI・UX

| ID | 機能 | 概要 |
|:--|:--|:--|
| UI-01 | shadcn/ui | Button, Dialog, Toast, Table, Select, Slider 等を活用 |
| UI-02 | テーマ | ライト／ダーク切替（Tailwind classベース） |
| UI-03 | Toast通知 | 成功・失敗・警告時の即時フィードバック |
| UI-04 | レスポンシブ | スマホ優先（幅400px以上想定） |
| UI-05 | 認証ページ | ランディングと同一トーンのログイン/サインアップ画面を提供 |

---

## 5. 非機能要件

| 項目 | 内容 |
|:--|:--|
| **パフォーマンス** | ページ初期ロード < 2.5s (Cloudflare CDN キャッシュ利用) |
| **セキュリティ** | Supabase Auth + Row-Level Security。Edge Functionsで署名付き操作 |
| **運用コスト** | Cloudflare Pages無料枠 + Supabase Freeプラン（1GB DB・10GB転送以内） |
| **拡張性** | 将来：Cloudflare WorkersでAIレコメンドAPI / R2画像ストレージ対応 |
| **可観測性** | Cloudflare Analytics + Supabase Logsでアクセス・エラー監視 |
| **多言語化** | 日本語→英語対応をi18nで段階導入予定 |

---

## 6. データモデル（概要）

```mermaid
erDiagram
  USERS {
    uuid id PK
    text email
    text display_name
  }
  BRANDS {
    bigint id PK
    text name
    bool jp_available
  }
  FLAVORS {
    bigint id PK
    bigint brand_id FK
    text name
    text[] tags
  }
  MIXES {
    bigint id PK
    uuid user_id FK
    text title
    text description
  }
  MIX_COMPONENTS {
    bigint mix_id FK
    bigint flavor_id FK
    int ratio_percent
  }
  SESSIONS {
    bigint id PK
    uuid user_id FK
    timestamptz started_at
    text location_text
  }

  USERS ||--o{ MIXES : owns
  MIXES ||--o{ MIX_COMPONENTS : contains
  BRANDS ||--o{ FLAVORS : includes
  USERS ||--o{ SESSIONS : logs
