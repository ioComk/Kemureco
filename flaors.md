## シーシャフレーバーブランド一覧（主要流通品）

- 2023-10 時点の公知情報をベースにした主要ブランド一覧です。各国の法規制や供給停止により流通状況は変動します。
- ライン分岐が多いブランド（例: Noir / Gold / Black 等）は、`brand` と別に `line` カラムを持つと管理しやすいです。

| ブランド | 原産・主流流通エリア | 備考 / 代表ライン |
| --- | --- | --- |
| Al Fakher | UAE / 中東〜世界 | Classic, Gold, Fusion, Crafted Batch |
| Nakhla | エジプト / 中東 | Classic, Mizo, 2 Apples 系で有名 |
| Mazaya | ヨルダン / 中東・欧州 | Classic, Iced Line |
| Al Waha | ヨルダン / 中東・欧州 | Classic, Elite Edition |
| Buta | レバノン / 中東 | Classic, Fusion Line |
| Afzal | インド / アジア・中東 | Pan 系ラインが多い |
| Abu Hilalain (Double Apple) | エジプト / 中東 | Double Apple で知られる老舗 |
| Sultan | 中東 | Classic |
| Al Rayan | 中東 | Classic |
| Malaki | エジプト / 中東 | Classic, Gold |
| Adalya | トルコ / 欧州 | Classic, Ice, Black (ダークリーフ) |
| Serbetli | トルコ / 欧州 | Classic, Ice, Hard (強め) |
| Balli | トルコ / 欧州 | Classic, Aroma |
| Nara | トルコ周辺 | Classic |
| Starbuzz | 米国 / 世界 | Classic, Bold, Vintage, Serpent, Noir |
| Fumari | 米国 / 世界 | Blonde Leaf, Dark (限定) |
| Tangiers | 米国 | Noir, Birquq, Burley, F-Line (カフェイン) |
| Social Smoke | 米国 / 世界 | Classic |
| Azure | 米国 | Gold (ブロンド), Black (ダークリーフ) |
| Trifecta | 米国 | Blonde, Dark |
| Ugly | 米国 | Classic |
| Eternal Smoke | 米国 | Classic, Mix シリーズ多数 |
| Alchemist | 米国 | Original, Stout (バーボンキュア) |
| Haze | 米国 | Classic（供給不安定） |
| Fantasia | 米国 | Classic |
| Hookafina | 米国 | Classic, Blak |
| Pure Tobacco | 米国 | Classic |
| Darkside | ロシア | Core, Medium, Rare, Shot Line |
| Must Have | ロシア | Medium Dark Leaf |
| Spectrum | ロシア | Classic, Hard |
| Sebero | ロシア | Medium |
| Daily Hookah | ロシア | Medium |
| BlackBurn | ロシア | Dark Leaf |
| Burn | ロシア | Dark Leaf |
| Brusko | ロシア | Medium, Strong |
| Chabacco | ロシア | Classic, Strong |
| Duft | ロシア | Medium / Dark |
| WTO | ロシア | Dark Leaf |
| MattPear Flavours | ロシア | Medium |
| Chaos | ドイツ | Classic |
| True Passion | ドイツ | Classic, Luxury |
| 7Days | ドイツ | Classic |
| Holster | ドイツ | Classic, Juice Line |
| O’s (O’s Tabak) | ドイツ | O’s, Hookain とのコラボ系も流通 |
| 187 Strassenbande | ドイツ | Classic |
| Nameless | ドイツ | Classic, Black |
| Hookain | ドイツ | Lime, Litlip, White Caek 等のシリーズ名 |
| Maridan | ドイツ | Classic |
| Olla | イタリア | Classic |
| Kismet | ドイツ | Black (ダーク系) |
| Adalya Black（独流通） | ドイツ | ダークリーフ版 Adalya |
| 404 Blend | ポーランド | Dark Leaf |
| Must Have (EU 流通) | 欧州 | ロシア発の EU 版 |
| Spectrum (EU 流通) | 欧州 | ロシア発の EU 版 |
| True Cloudz | 欧州 | Steam stones/ゼロニコ品も展開 |
| Zomo | ブラジル / 南米・欧州 | Classic, Strong, Black |
| Amazon | ブラジル | Classic |
| Shaman | ブラジル | Dark Leaf |
| Amy Gold | ドイツ / 欧州 | Classic |
| Oila | ドイツ | Classic |
| 420 (Four-Twenty) | 南米 | Dark Leaf（地域限定） |
| TradiFakher / Khalil Maamoon | 中東 | 伝統系ブレンド・限定流通 |
| Local/ショップ PB (例: Meduse, Oblako PB) | 各国 | 店舗・ブランドコラボのプライベートブレンド |

### 補足
- 国ごとに税制・成分規制が異なり、同一ブランドでも配合や名称が変わる場合があります。
- ロシア・東欧系ブランドは制裁や物流で供給が大きく変動し、EU 向けに別工場版が存在することがあります。
- データベース化する場合は `brand`, `line`, `origin_country`, `nicotine_strength`, `cut_type`, `status(active/discontinued)` などを持たせると棚卸しが容易です。
