# デジタル朝礼ボード

整備工場向けのローカル保存型ホワイトボードPWAです。

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

iPhone / iPadのWeb Pushは、iOS / iPadOS 16.4以降でホーム画面に追加したWebアプリが対象です。今回のv0.9では通知許可と端末内テスト通知のみ対応し、案件更新のPush配信はまだ行いません。

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

## メモ

- データはブラウザの `localStorage` に保存されます。
- スマホから見る場合も、アクセスしているブラウザごとに保存データは別になります。
- 作業者を非表示にしても、その作業者の案件は削除されません。
- Service Workerによって基本画面をキャッシュしますが、初回表示には通信が必要です。
