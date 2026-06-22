# デジタル朝礼ボード

整備工場向けのローカル保存型ホワイトボードアプリです。

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

## メモ

- データはブラウザの `localStorage` に保存されます。
- スマホから見る場合も、アクセスしているブラウザごとに保存データは別になります。
- 作業者を非表示にしても、その作業者の案件は削除されません。
