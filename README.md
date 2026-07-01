# デジタル朝礼ボード

整備工場向けのデジタルホワイトボードPWAです。現在のバージョンは`v1.0-dev`です。

## v1.0-devの保存方式

`v1.0-1`ではRepository層とSupabase Auth接続の土台を追加しています。

- `local`モード: ログイン不要。従来どおりlocalStorageへ保存
- `supabase`モード: メール/パスワードログインを確認可能
- 案件・作業者・テンプレの保存先は、どちらのモードでもまだlocalStorage
- Realtime、写真Storage、Push通知のクラウド配信は未実装

Supabaseモードでは、画面上部に「データはまだこの端末に保存されます」と表示されます。

## PCで開く

`index.html` をブラウザで開くと使えます。

## スマホで確認する

スマホとPCを同じWi-Fiに接続してから、PC側で簡易サーバーを起動します。

### VS Code Live Serverを使う場合

1. VS Codeでこのフォルダを開く
2. 拡張機能「Live Server」を入れる
3. `index.html` を右クリックして `Open with Live Server`
4. 表示されたURLの `127.0.0.1` または `localhost` をPCのIPアドレスに置き換える

例:

```text
http://192.168.1.23:5500/index.html
```

### Pythonを使う場合

このフォルダで以下を実行します。

```powershell
python -m http.server 8000
```

PCのIPアドレスを確認します。

```powershell
ipconfig
```

`IPv4 アドレス` を確認し、スマホのブラウザで開きます。

```text
http://PCのIPアドレス:8000
```

例:

```text
http://192.168.1.23:8000
```

## ホーム画面に追加する

PWAのインストールと通知にはHTTPSが必要です。本番のNetlify URLで開いてください。

### iPhone / iPad

1. SafariでNetlify URLを開く
2. 共有ボタンを押す
3. 「ホーム画面に追加」を選ぶ
4. 追加された「朝礼ボード」アイコンから起動する

iPhone / iPadのWeb Pushは、iOS / iPadOS 16.4以降でホーム画面に追加したWebアプリが対象です。v1.0-devでは通知許可と端末内テスト通知のみ対応し、案件更新のPush配信はまだ行いません。

### Android

1. ChromeでNetlify URLを開く
2. ブラウザメニューから「ホーム画面に追加」または「アプリをインストール」を選ぶ
3. 追加されたアイコンから起動する

## 通知設定

画面上部の「通知設定」から、現在の通知許可状態を確認できます。「通知を許可する」を押した後、「テスト通知」でこの端末へのローカル通知を確認できます。

ブラウザで通知をブロックした場合は、OSまたはブラウザのサイト設定から許可を変更してください。

## 今後の構成

- Supabase Authで利用者を識別
- Supabase Postgres / Realtimeで案件を端末間同期
- Supabase Storageへ案件写真を保存
- Edge FunctionからWeb Pushを配信
- 通知本文には顧客名やフルナンバーなどの個人情報を載せない

## Supabaseプロジェクト設定

1. Supabase Dashboardでプロジェクトを作成
2. SQL Editorを開く
3. [`supabase/schema.sql`](./supabase/schema.sql)の内容を実行
4. Authenticationの公開サインアップを無効化
5. Authentication > Usersから利用者を作成
6. Project SettingsでProject URLとPublishable Keyを確認

SQLは`workers`、`jobs`、`work_templates`を作成し、未認証の`anon`アクセスを拒否します。v1.0では認証済み利用者が同じ権限を持つ1工場構成です。

Secret Keyおよび旧`service_role` keyは、`runtime-config.js`、Netlify、ブラウザコードへ設定しないでください。

## local / Supabaseモード切替

ローカル開発では[`runtime-config.js`](./runtime-config.js)を使用します。初期状態は次のlocalモードです。

```js
window.RUNTIME_CONFIG = Object.freeze({
  BOARD_DATA_MODE: "local",
  SUPABASE_URL: "",
  SUPABASE_PUBLISHABLE_KEY: "",
});
```

Supabase接続を確認する場合のみ`BOARD_DATA_MODE`を`supabase`へ変更し、Project URLとPublishable Keyを設定します。プロジェクト固有値をコミットしないよう注意してください。

## Netlify環境変数

NetlifyのSite configuration > Environment variablesへ以下を設定します。スコープにはBuildsを含めてください。

```text
BOARD_DATA_MODE=supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
```

[`netlify.toml`](./netlify.toml)のビルド処理が、公開可能な値だけを`runtime-config.js`へ出力します。Secret Keyを指定するとビルドを停止します。

## v1.0の今後の実装

1. SupabaseRepositoryへ作業者・案件・テンプレのCRUDを追加
2. 事務所PCのlocalStorageデータを一度だけ移行
3. Realtimeで他端末の更新を再取得
4. オフライン時は最終取得データを閲覧専用表示
5. 複数端末で担当者・ステータス・並び順を検証

## メモ

- v1.0-dev時点の案件データはブラウザの `localStorage` に保存されます。
- スマホから見る場合も、アクセスしているブラウザごとに保存データは別になります。
- 作業者を非表示にしても、その作業者の案件は削除されません。
- Service Workerによって基本画面をキャッシュしますが、初回表示には通信が必要です。
