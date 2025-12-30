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
  process.env.CATEGORY_URL || 'https://www.adalyatobacco.com/tr/adalya';
const BRAND_NAME = 'Adalya';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

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

const decodeHtml = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const extractItems = (html) => {
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
      let tag = decodeHtml(tagMatch[1].trim()).toLowerCase();
      if (tag === '6 different flavours') {
        tag = 'mix';
      }
      tags.push(tag);
    }
    const deduped = Array.from(new Set(tags));
    items.push({ name, tags: deduped });
  }

  return items;
};

const main = async () => {
  const html = await fetchHtml(CATEGORY_URL);
  const items = extractItems(html);
  if (!items.length) {
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
  const toInsert = items
    .filter((item) => !existingNames.has(item.name))
    .map((item) => ({
      brand_id: brand.id,
      name: item.name,
      tags: item.tags,
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
