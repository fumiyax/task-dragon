# task - 子ども向けタスク管理アプリ

## 概要
小学3年生向けのタスク管理Webアプリ。朝・昼・夜のタスクをチェックし、継続することでドラゴンの卵が孵化するゲーム性を持たせたアプリ。

## 機能
- 朝・昼・夜のタスクチェック
- 毎日の達成状況を記録
- 7日間継続でドラゴンの卵が孵化
- 複数種類のドラゴンコレクション
- ローカルストレージでデータ保存

## 開発ルール

### バージョン管理
- メインファイル（index.html, app.js, style.css）を修正するたびにバージョン番号を1つ上げること
- 現在のバージョン: 2.0.0

### デプロイ
- Vercel にデプロイ
- リポジトリ: https://github.com/fumiyax/task-dragon
- デプロイURL: （デプロイ後に記載）

### バックアップ
- メインファイルを修正する前にバックアップを取ること
- 保存先: `backup/`
- 命名規則: `{ファイル名}_ver{番号}_{変更内容の短い説明}.{拡張子}`

## 技術スタック
- HTML5
- CSS3
- Vanilla JavaScript
- Vercel Serverless Functions
- Neon DB (PostgreSQL)
- @vercel/postgres

## データベース
- Neon DB を使用
- テーブル: tasks, current_egg, dragons
- 環境変数はVercelの環境変数に設定

## よくあるトラブル

### VercelからGitHubリポジトリが見えない

**原因**: VercelのGitHub App設定でリポジトリへのアクセス権限が許可されていない

**解決策**:
1. https://github.com/settings/installations を開く
2. 「Vercel」を探して「Configure」をクリック
3. Repository access で:
   - 「All repositories」を選択、または
   - 「Only select repositories」→「Select repositories」で該当リポジトリを追加
4. 「Save」をクリック

これでVercelのImport Project画面からリポジトリが見えるようになる
