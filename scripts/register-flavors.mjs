#!/usr/bin/env node
// ============================================================
// register-flavors.mjs — フレーバー一括登録スクリプト
//
// Usage:
//   node scripts/register-flavors.mjs --url <URL> --brand <BRAND> [options]
//   node scripts/register-flavors.mjs --json <FILE> --brand <BRAND> [options]
//
// Options:
//   --url <URL>          対象ページのURL
//   --brand <BRAND>      ブランド名（例: SEBERO, DARKSIDE）
//   --dry-run            実行内容を表示のみ（DB/Storage変更なし）
//   --skip-images        画像処理をスキップ（DBのみ）
//   --skip-db            DB操作をスキップ（画像のみ）
//   --output <DIR>       画像出力ディレクトリ（デフォルト: tmp/<brand>）
//   --migration          SQLマイグレーションファイルを生成
//   --json <FILE>        事前抽出済みJSONから読み込み
//   --quality <N>        WebP品質 0-100（デフォルト: 85）
//   --help               ヘルプ表示
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import { createClient } from '@supabase/supabase-js';

// ---- .env.local 読み込み ----
const loadEnv = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};

loadEnv(path.resolve(process.cwd(), '.env.local'));

// ---- ヘルプ ----
const showHelp = () => {
  console.log(`
フレーバー一括登録スクリプト

Usage:
  node scripts/register-flavors.mjs --url <URL> --brand <BRAND> [options]
  node scripts/register-flavors.mjs --json <FILE> --brand <BRAND> [options]

Options:
  --url <URL>        対象ページのURL
  --brand <BRAND>    ブランド名（例: SEBERO, DARKSIDE）
  --dry-run          実行内容を表示のみ（DB/Storage変更なし）
  --skip-images      画像処理をスキップ（DBのみ）
  --skip-db          DB操作をスキップ（画像のみ）
  --output <DIR>     画像出力ディレクトリ（デフォルト: tmp/<brand>）
  --migration        SQLマイグレーションファイルを生成
  --json <FILE>      事前抽出済みJSONファイルから読み込み
  --quality <N>      WebP品質 0-100（デフォルト: 85）
  --help             このヘルプを表示

JSON入力フォーマット:
  [
    { "name": "Flavor Name", "imageUrl": "https://...", "tags": ["tag1"] },
    ...
  ]

対応サイト:
  - aslaj.com        ASLAJ 商品カテゴリページ
  - newemoshisha.com  NEWEMO SHISHA コレクション
  - adalyatobacco.com Adalya 公式サイト
  - その他            汎用パーサー（精度は低め）
`);
  process.exit(0);
};

// ---- CLI引数パース ----
const parseArgs = () => {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
  }

  const opts = {
    url: null,
    brand: null,
    dryRun: false,
    skipImages: false,
    skipDb: false,
    outputDir: null,
    migration: false,
    json: null,
    quality: 85,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        opts.url = args[++i];
        break;
      case '--brand':
        opts.brand = args[++i];
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--skip-images':
        opts.skipImages = true;
        break;
      case '--skip-db':
        opts.skipDb = true;
        break;
      case '--output':
        opts.outputDir = args[++i];
        break;
      case '--migration':
        opts.migration = true;
        break;
      case '--json':
        opts.json = args[++i];
        break;
      case '--quality':
        opts.quality = parseInt(args[++i], 10);
        break;
      default:
        console.error(`不明なオプション: ${args[i]}`);
        process.exit(1);
    }
  }

  if (!opts.brand) {
    console.error('エラー: --brand は必須です');
    process.exit(1);
  }
  if (!opts.url && !opts.json) {
    console.error('エラー: --url または --json のいずれかが必須です');
    process.exit(1);
  }
  if (!opts.outputDir) {
    opts.outputDir = path.resolve('tmp', opts.brand.toLowerCase());
  }

  return opts;
};

// ---- HTTP取得 ----
const fetchUrl = (url) =>
  new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(
      url,
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
      (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          const redirect = res.headers.location.startsWith('/')
            ? new URL(res.headers.location, url).href
            : res.headers.location;
          return resolve(fetchUrl(redirect));
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      },
    );
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('タイムアウト')));
  });

const fetchBinary = (url) =>
  new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(
      url,
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
      (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          const redirect = res.headers.location.startsWith('/')
            ? new URL(res.headers.location, url).href
            : res.headers.location;
          return resolve(fetchBinary(redirect));
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      },
    );
    req.on('error', reject);
    req.setTimeout(60000, () => req.destroy(new Error('タイムアウト')));
  });

// ---- HTMLデコード ----
const decodeHtml = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 10)),
    );

// ============================================================
// サイト別パーサー
// ============================================================
const parsers = {
  // ASLAJ (aslaj.com) — 商品カテゴリページ
  aslaj(html, brandName) {
    const pattern =
      /<img src="([^"]+)"[^>]*>\s*<\/span>\s*<p class="itemName">\s*([^<]+)\s*<\/p>/gs;
    const items = [];
    const seen = new Set();
    let match;
    while ((match = pattern.exec(html))) {
      const imgUrl = match[1];
      let name = decodeHtml(match[2])
        .replace(new RegExp(`\\s*-\\s*${brandName}.*$`, 'i'), '')
        .split('(')[0]
        .trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      items.push({ name, imageUrl: imgUrl });
    }
    return items;
  },

  // NEWEMO SHISHA (newemoshisha.com) — Shopifyコレクション
  newemo(html) {
    const pattern =
      /<div class="grid-item grid-product [^>]*>.*?data-src="([^"]+)".*?class="grid-product__title">\s*([^<]+)\s*<\/div>/gs;
    const items = [];
    const seen = new Set();
    let match;
    while ((match = pattern.exec(html))) {
      let imgUrl = match[1];
      if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
      imgUrl = imgUrl.replace('{width}x', '800x');
      let name = decodeHtml(match[2])
        .replace(/\s*\d+g$/, '')
        .trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      items.push({ name, imageUrl: imgUrl });
    }
    return items;
  },

  // Adalya公式 (adalyatobacco.com)
  adalya(html) {
    const cardPattern = /<a class="col-lg-3[\s\S]*?<\/a>/g;
    const backPattern = /<img class="back" src="([^"]+)"/;
    const namePattern = /<h5 class="font-size-20[^>]*>([^<]+)<\/h5>/;
    const tagPattern = /<div class="flavor-button"[^>]*>([^<]+)<\/div>/g;
    const cards = html.match(cardPattern) || [];
    const items = [];
    for (const card of cards) {
      const nameMatch = card.match(namePattern);
      const backMatch = card.match(backPattern);
      if (!nameMatch || !backMatch) continue;
      const name = decodeHtml(nameMatch[1].trim());
      const tags = [];
      let tagMatch;
      while ((tagMatch = tagPattern.exec(card))) {
        tags.push(decodeHtml(tagMatch[1].trim()).toLowerCase());
      }
      items.push({ name, imageUrl: backMatch[1], tags: [...new Set(tags)] });
    }
    return items;
  },

  // 汎用パーサー（img + テキストの組み合わせを抽出）
  generic(html) {
    const patterns = [
      /<img[^>]+src="([^"]+)"[^>]*>[\s\S]*?<(?:h[2-6]|p|span|div)[^>]*>\s*([^<]{2,60})\s*<\//g,
      /data-src="([^"]+)"[\s\S]*?class="[^"]*title[^"]*">\s*([^<]{2,60})\s*<\//g,
    ];
    const items = [];
    const seen = new Set();
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html))) {
        let imgUrl = match[1];
        if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
        const name = decodeHtml(match[2]).trim();
        if (!name || seen.has(name)) continue;
        if (!/\.(jpg|jpeg|png|webp|gif)/i.test(imgUrl)) continue;
        seen.add(name);
        items.push({ name, imageUrl: imgUrl });
      }
      if (items.length > 0) break;
    }
    return items;
  },
};

const detectSite = (url) => {
  if (url.includes('aslaj.com')) return 'aslaj';
  if (url.includes('newemoshisha.com')) return 'newemo';
  if (url.includes('adalyatobacco.com')) return 'adalya';
  return 'generic';
};

// ============================================================
// タグ推定
// ============================================================
const TAG_MAP = [
  // フルーツ
  ['green apple', 'green apple'],
  ['apple', 'apple'],
  ['banana', 'banana'],
  ['cherry', 'cherry'],
  ['grapefruit', 'grapefruit'],
  ['grape', 'grape'],
  ['guava', 'guava'],
  ['kiwi', 'kiwi'],
  ['lemon', 'lemon'],
  ['lime', 'lime'],
  ['lychee', 'lychee'],
  ['mango', 'mango'],
  ['watermelon', 'watermelon'],
  ['melon', 'melon'],
  ['orange', 'orange'],
  ['papaya', 'papaya'],
  ['passion', 'passion fruit'],
  ['peach', 'peach'],
  ['pear', 'pear'],
  ['pineapple', 'pineapple'],
  ['plum', 'plum'],
  ['pomegranate', 'pomegranate'],
  ['apricot', 'apricot'],
  ['coconut', 'coconut'],
  ['fig', 'fig'],
  ['dragonfruit', 'dragonfruit'],
  ['cranberry', 'cranberry'],
  // ベリー
  ['blueberry', 'blueberry'],
  ['raspberry', 'raspberry'],
  ['strawberry', 'strawberry'],
  ['blackberry', 'blackberry'],
  ['bilberry', 'bilberry'],
  ['barberry', 'barberry'],
  ['currant', 'currant'],
  ['berry', 'berry'],
  // ミント・クール
  ['menthol', 'menthol'],
  ['supermint', 'mint'],
  ['mint', 'mint'],
  ['ice', 'ice'],
  ['arctic', 'cool'],
  ['freeze', 'cool'],
  ['cool', 'cool'],
  // ハーブ・スパイス
  ['basil', 'basil'],
  ['cinnamon', 'cinnamon'],
  ['thyme', 'thyme'],
  ['ginger', 'ginger'],
  ['cardamom', 'cardamom'],
  ['anise', 'anise'],
  ['clove', 'clove'],
  ['eucalyptus', 'eucalyptus'],
  ['herbal', 'herbal'],
  ['spice', 'spice'],
  // デザート
  ['vanilla', 'vanilla'],
  ['chocolate', 'chocolate'],
  ['cream', 'cream'],
  ['caramel', 'caramel'],
  ['cookie', 'cookie'],
  ['cake', 'cake'],
  ['waffle', 'waffle'],
  ['honey', 'honey'],
  ['bubblegum', 'bubblegum'],
  ['candy', 'candy'],
  ['marshmallow', 'marshmallow'],
  ['pudding', 'pudding'],
  // ドリンク
  ['cola', 'cola'],
  ['coffee', 'coffee'],
  ['tea', 'tea'],
  ['milk', 'milk'],
  ['soda', 'soda'],
  ['mojito', 'mojito'],
  ['wine', 'wine'],
  ['cocktail', 'cocktail'],
  // フローラル
  ['rose', 'rose'],
  ['jasmine', 'jasmine'],
  ['lavender', 'lavender'],
  ['floral', 'floral'],
  // その他
  ['tobacco', 'tobacco'],
  ['forest', 'forest'],
  ['wood', 'wood'],
  ['nut', 'nut'],
  ['almond', 'almond'],
  ['pistachio', 'pistachio'],
  ['corn', 'corn'],
  ['cucumber', 'cucumber'],
  ['tomato', 'tomato'],
  // カテゴリ
  ['tropical', 'tropical'],
  ['citrus', 'citrus'],
  ['dessert', 'dessert'],
  ['savory', 'savory'],
];

// 部分一致の誤判定を防ぐための除外ルール
const TAG_EXCLUSIONS = {
  grape: ['grapefruit'],
  apple: ['pineapple'],
  mint: ['supermint'],
  melon: ['watermelon'],
  berry: [
    'blueberry',
    'raspberry',
    'strawberry',
    'blackberry',
    'bilberry',
    'barberry',
    'cranberry',
  ],
};

const inferTags = (name) => {
  const lower = name.toLowerCase();
  const tags = [];
  for (const [keyword, tag] of TAG_MAP) {
    const exclusions = TAG_EXCLUSIONS[keyword];
    if (exclusions && exclusions.some((ex) => lower.includes(ex))) continue;
    if (lower.includes(keyword)) {
      tags.push(tag);
    }
  }
  return [...new Set(tags)];
};

// ============================================================
// WebP変換
// ============================================================
let sharp;

const ensureSharp = async () => {
  if (sharp) return;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error(
      'sharp が見つかりません。インストールしてください:\n  npm install -D sharp',
    );
    process.exit(1);
  }
};

const convertToWebp = async (inputBuffer, quality = 85) => {
  await ensureSharp();
  return sharp(inputBuffer).webp({ quality, effort: 6 }).toBuffer();
};

// ============================================================
// SQLマイグレーション生成
// ============================================================
const generateMigration = (brandName, items) => {
  const now = new Date();
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  const timestamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('');
  const slug = brandName.toLowerCase().replace(/\s+/g, '_');
  const filename = `${timestamp}_${slug}_flavors_seed.sql`;

  const escape = (s) => s.replace(/'/g, "''");

  const valuesBlock = items
    .map((item) => {
      const tags = (item.tags || inferTags(item.name)).map(escape);
      const tagsStr = `{${tags.join(',')}}`;
      const imagePath = `flavors/${brandName}/${item.name}.webp`;
      return `    ('${escape(brandName)}', '${escape(item.name)}', '${tagsStr}', '${escape(imagePath)}')`;
    })
    .join(',\n');

  const sql = `-- ${brandName} フレーバー登録
-- 自動生成: ${now.toISOString()}

insert into public.brands (name, jp_available)
values ('${escape(brandName)}', true)
on conflict (name) do update set jp_available = excluded.jp_available;

insert into public.flavors (brand_id, name, tags, image_path, created_by)
select b.id, f.name, f.tags::text[], f.image_path, null
from (
  values
${valuesBlock}
) as f(brand_name, name, tags, image_path)
join public.brands b on b.name = f.brand_name
where not exists (
  select 1
  from public.flavors existing
  where existing.brand_id = b.id
    and existing.name = f.name
);

update public.flavors as f
set tags = v.tags::text[],
    image_path = v.image_path,
    created_by = null
from (
  values
${valuesBlock}
) as v(brand_name, name, tags, image_path)
join public.brands b on b.name = v.brand_name
where f.brand_id = b.id
  and f.name = v.name;
`;

  return { filename, sql };
};

// ============================================================
// メイン処理
// ============================================================
const main = async () => {
  const opts = parseArgs();

  console.log(`\nフレーバー登録: ${opts.brand}`);
  console.log(`モード: ${opts.dryRun ? 'ドライラン' : '本番'}`);

  // ---- 1. データ取得 ----
  let items;
  if (opts.json) {
    console.log(`\nJSONファイルから読み込み: ${opts.json}`);
    const raw = fs.readFileSync(opts.json, 'utf8');
    items = JSON.parse(raw);
  } else {
    const siteType = detectSite(opts.url);
    console.log(`\nURL取得: ${opts.url}`);
    console.log(`サイト種別: ${siteType}`);

    const html = await fetchUrl(opts.url);
    const parser = parsers[siteType];
    items = parser(html, opts.brand);
  }

  if (!items.length) {
    console.error('\nフレーバーが見つかりませんでした');
    process.exit(1);
  }

  // タグ推定（まだ付いていない場合）
  for (const item of items) {
    if (!item.tags || !item.tags.length) {
      item.tags = inferTags(item.name);
    }
  }

  console.log(`\n抽出結果: ${items.length} フレーバー`);
  console.log('---');
  for (const item of items) {
    const tagsStr = item.tags.length ? ` [${item.tags.join(', ')}]` : '';
    console.log(`  ${item.name}${tagsStr}`);
  }
  console.log('---');

  // ---- 2. 画像ダウンロード & WebP変換 ----
  if (!opts.skipImages) {
    await ensureSharp();
    fs.mkdirSync(opts.outputDir, { recursive: true });

    console.log(`\n画像処理: ${opts.outputDir}`);
    let downloaded = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of items) {
      if (!item.imageUrl) {
        skipped++;
        continue;
      }

      const webpPath = path.join(opts.outputDir, `${item.name}.webp`);
      if (fs.existsSync(webpPath)) {
        skipped++;
        continue;
      }

      if (opts.dryRun) {
        console.log(`  [DRY] ${item.name}.webp <- ${item.imageUrl}`);
        downloaded++;
        continue;
      }

      try {
        const imgBuffer = await fetchBinary(item.imageUrl);
        const webpBuffer = await convertToWebp(imgBuffer, opts.quality);
        fs.writeFileSync(webpPath, webpBuffer);
        downloaded++;
        console.log(
          `  OK ${item.name}.webp (${(webpBuffer.length / 1024).toFixed(1)}KB)`,
        );
      } catch (err) {
        console.error(`  NG ${item.name}: ${err.message}`);
        failed++;
      }
    }

    console.log(
      `画像完了: ${downloaded} ダウンロード, ${skipped} スキップ, ${failed} 失敗`,
    );
  }

  // ---- 3. DB操作 ----
  if (!opts.skipDb && !opts.dryRun) {
    const SUPABASE_URL =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error(
        '\nSUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です',
      );
      process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    console.log('\nDB登録...');

    // ブランド upsert
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .upsert(
        { name: opts.brand, jp_available: true },
        { onConflict: 'name' },
      )
      .select('id')
      .single();

    if (brandError) throw brandError;
    console.log(`  ブランド: ${opts.brand} (id: ${brand.id})`);

    // 既存フレーバー取得
    const { data: existing, error: existingError } = await supabase
      .from('flavors')
      .select('id,name,image_path')
      .eq('brand_id', brand.id);

    if (existingError) throw existingError;
    const existingMap = new Map(existing.map((f) => [f.name, f]));

    // 新規挿入
    const toInsert = items
      .filter((item) => !existingMap.has(item.name))
      .map((item) => ({
        brand_id: brand.id,
        name: item.name,
        tags: item.tags,
        image_path: `flavors/${opts.brand}/${item.name}.webp`,
        created_by: null,
      }));

    if (toInsert.length) {
      const { error: insertError } = await supabase
        .from('flavors')
        .insert(toInsert);
      if (insertError) throw insertError;
      console.log(`  新規登録: ${toInsert.length} フレーバー`);
    } else {
      console.log('  新規フレーバーなし');
    }

    // 既存更新（タグ・画像パス）
    let updated = 0;
    for (const item of items) {
      const ex = existingMap.get(item.name);
      if (!ex) continue;
      const imagePath = `flavors/${opts.brand}/${item.name}.webp`;
      const { error: updateError } = await supabase
        .from('flavors')
        .update({ tags: item.tags, image_path: imagePath, created_by: null })
        .eq('id', ex.id);
      if (updateError) throw updateError;
      updated++;
    }
    if (updated) {
      console.log(`  更新: ${updated} フレーバー`);
    }

    // ---- 4. Storageアップロード ----
    if (!opts.skipImages) {
      console.log('\nStorageアップロード...');
      const BUCKET = 'flavor-images';
      let uploadCount = 0;
      let uploadSkipped = 0;

      for (const item of items) {
        const localPath = path.join(opts.outputDir, `${item.name}.webp`);
        if (!fs.existsSync(localPath)) {
          uploadSkipped++;
          continue;
        }

        const storagePath = `flavors/${opts.brand}/${item.name}.webp`;
        const fileBuffer = fs.readFileSync(localPath);

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, fileBuffer, {
            contentType: 'image/webp',
            upsert: true,
          });

        if (uploadError) {
          console.error(`  NG ${storagePath}: ${uploadError.message}`);
        } else {
          uploadCount++;
        }
      }

      console.log(
        `Storage完了: ${uploadCount} アップロード, ${uploadSkipped} スキップ`,
      );
    }
  }

  // ---- 5. マイグレーション生成 ----
  if (opts.migration || opts.dryRun) {
    const { filename, sql } = generateMigration(opts.brand, items);
    const migrationDir = path.resolve('supabase', 'migrations');
    const migrationPath = path.join(migrationDir, filename);

    if (opts.dryRun) {
      console.log(`\nマイグレーション (プレビュー):\n`);
      console.log(sql);
    } else {
      fs.mkdirSync(migrationDir, { recursive: true });
      fs.writeFileSync(migrationPath, sql);
      console.log(`\nマイグレーション生成: ${migrationPath}`);
    }
  }

  // ---- 結果JSON出力（パイプライン用） ----
  if (process.env.OUTPUT_JSON) {
    const output = items.map((item) => ({
      name: item.name,
      tags: item.tags,
      imagePath: `flavors/${opts.brand}/${item.name}.webp`,
    }));
    fs.writeFileSync(process.env.OUTPUT_JSON, JSON.stringify(output, null, 2));
  }

  console.log('\n完了');
};

main().catch((error) => {
  console.error('\nエラー:', error.message || error);
  process.exit(1);
});
