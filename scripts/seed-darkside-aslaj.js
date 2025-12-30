const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const CATEGORY_URL =
  process.env.CATEGORY_URL || 'https://www.aslaj.com/view/category/ct112';
const BRAND_NAME = 'DARKSIDE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const mapping = [
  ['mint', 'mint'],
  ['supermint', 'mint'],
  ['blueberry', 'blueberry'],
  ['raspberry', 'raspberry'],
  ['berry', 'berry'],
  ['cherry', 'cherry'],
  ['banana', 'banana'],
  ['grape', 'grape'],
  ['grapefruit', 'grapefruit'],
  ['lemon', 'lemon'],
  ['pineapple', 'pineapple'],
  ['orange', 'orange'],
  ['cola', 'cola'],
  ['cream', 'cream'],
  ['milk', 'milk'],
  ['honey', 'honey'],
  ['ice', 'ice'],
  ['passion', 'passion'],
  ['forest', 'forest'],
];

const fetchHtml = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });

const extractNames = (html) => {
  const pattern = /<img src="([^"]+)"[^>]*>\s*<\/span>\s*<p class="itemName">\s*([^<]+)\s*<\/p>/gs;
  const names = [];
  let match;
  while ((match = pattern.exec(html))) {
    const raw = match[2]
      .replace(/\s*-\s*DARKSIDE.*$/i, '')
      .split('(')[0]
      .trim();
    if (raw) {
      names.push(raw);
    }
  }
  return Array.from(new Set(names));
};

const buildTags = (name) => {
  const lower = name.toLowerCase();
  const tags = [];
  for (const [key, tag] of mapping) {
    if (key === 'grape' && lower.includes('grapefruit')) {
      continue;
    }
    if (lower.includes(key)) {
      tags.push(tag);
    }
  }
  return Array.from(new Set(tags));
};

const main = async () => {
  const html = await fetchHtml(CATEGORY_URL);
  const names = extractNames(html);
  if (!names.length) {
    console.log('No items found.');
    return;
  }

  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .upsert({ name: BRAND_NAME, jp_available: true }, { onConflict: 'name' })
    .select('id')
    .single();

  if (brandError) {
    throw brandError;
  }

  const { data: existing, error: existingError } = await supabase
    .from('flavors')
    .select('name')
    .eq('brand_id', brand.id);

  if (existingError) {
    throw existingError;
  }

  const existingNames = new Set(existing.map((row) => row.name));
  const toInsert = names
    .filter((name) => !existingNames.has(name))
    .map((name) => ({
      brand_id: brand.id,
      name,
      tags: buildTags(name),
    }));

  if (!toInsert.length) {
    console.log('No new flavors to insert.');
    return;
  }

  const { error: insertError } = await supabase
    .from('flavors')
    .insert(toInsert);

  if (insertError) {
    throw insertError;
  }

  console.log(`Inserted ${toInsert.length} flavors for ${BRAND_NAME}.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
