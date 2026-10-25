# 🐉 ドラゴンタスク

小学生向けのタスク管理アプリ。朝・昼・夜のタスクをこなして、ドラゴンの卵を孵化させよう！

## 機能

- **朝・昼・夜のタスク管理**: 毎日3つのタスクをチェック
- **ドラゴンの卵**: 7日間で18回以上タスクをこなすと孵化
- **8種類のドラゴン**: ランダムに孵化するドラゴンをコレクション
- **Neon DB**: PostgreSQLでデータを永続化

## セットアップ

### 1. Neon DBの準備

1. [Neon Console](https://console.neon.tech) にアクセス
2. 新しいプロジェクトを作成
3. 接続文字列をコピー

### 2. データベースのセットアップ

Neon Consoleの「SQL Editor」で`schema.sql`の内容を実行してテーブルを作成します。

### 3. Vercelの環境変数設定

Vercelダッシュボードで以下の環境変数を設定：

- `DATABASE_URL`: Neon DBの接続文字列

※ Neon Dashboardの「Connection Details」からコピーできます

### 4. デプロイ

```bash
npm install
git add .
git commit -m "Add Neon DB integration"
git push
```

Vercelが自動的にデプロイします。

## ローカル開発

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.local.example .env.local
# .env.localを編集してNeon DBの接続情報を入力

# 開発サーバー起動
npm run dev
```

## 技術スタック

- **フロントエンド**: HTML, CSS, Vanilla JavaScript
- **バックエンド**: Vercel Serverless Functions
- **データベース**: Neon (PostgreSQL)
- **SDK**: @neondatabase/serverless
- **デプロイ**: Vercel

## ゲームルール

- 7日間で18回以上（21回中）タスクをチェックすると、ドラゴンの卵が孵化
- 8種類のドラゴンがランダムに孵化
- 次々とドラゴンをコレクションしよう！
