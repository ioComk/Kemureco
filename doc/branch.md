# 🪴 Kemureco ブランチ運用方針

## 1. 基本方針
Kemureco は少人数・短期サイクルでの開発を前提とし、  
**Trunk-Based Development（main中心）** を採用する。  
すべての機能開発は短命ブランチで行い、レビュー後に `main` へ統合する。

---

## 2. ブランチ構成

| ブランチ名 | 用途 | 備考 |
|:--|:--|:--|
| **main** | 本番デプロイ対象。常にデプロイ可能な安定状態を保つ。 | Cloudflare Pages と接続 |
| **feat/*** | 新機能開発ブランチ。短命・小粒な単位で切る。 | 例：`feat/mixes-create` |
| **fix/*** | バグ修正ブランチ。 | 例：`fix/pwa-manifest` |
| **chore/*** | CI設定・依存更新・リファクタリングなど。 | 例：`chore/ci-pages` |
| **release/*** | リリース前の調整・凍結用ブランチ。 | 例：`release/0.2.0` |
| **hotfix/*** | 本番障害対応。タグ後すぐ `main` へマージ。 | 例：`hotfix/0.2.1` |

---

## 3. 運用ルール

- **Pull Request 必須**  
  - `feat/*`, `fix/*`, `chore/*` は必ず PR 経由で `main` へマージ。  
  - 1人レビュー＋CI成功を条件にマージ。
- **短命ブランチ**  
  - 原則 1～3日でマージ。ドラフトPRを早期作成しCIを回す。
- **タグ運用**  
  - リリース確定時に `vX.Y.Z` 形式でタグ付与。  
  - 例：`v0.2.0` → Pages本番反映。

---

## 4. コミット規約

**Conventional Commits** を採用。

| タイプ | 説明 | 例 |
|:--|:--|:--|
| `feat` | 新機能追加 | `feat(mixes): add ratio validation` |
| `fix` | バグ修正 | `fix(pwa): correct manifest scope` |
| `chore` | 雑務・設定変更 | `chore(ci): add pages deploy` |
| `docs` | ドキュメント | `docs(readme): update setup guide` |
| `refactor` | 機能変更なしの整理 | `refactor(ui): simplify card component` |

---

## 5. 典型的な開発フロー

```bash
# 1. 新機能を開発
git checkout -b feat/mixes-create
# 2. 実装 → コミット → プッシュ
git push -u origin feat/mixes-create
# 3. PRを作成しレビュー後にmainへマージ
# 4. 必要ならリリースブランチ作成
git checkout -b release/0.2.0
git push -u origin release/0.2.0
# 5. タグ付け
git checkout main && git pull
git tag v0.2.0 && git push origin v0.2.0
