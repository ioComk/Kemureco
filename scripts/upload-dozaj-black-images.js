const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const BUCKET = process.env.SUPABASE_BUCKET || 'flavor-images';
const SOURCE_DIR = process.env.SOURCE_DIR || '/tmp/dozaj-black/webp-q75';
const BRAND_NAME = process.env.BRAND_NAME || 'DOZAJ BLACK';
const STORAGE_PREFIX = process.env.STORAGE_PREFIX || `flavors/${BRAND_NAME}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const normalizeName = (value) =>
  value
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const listWebpFiles = (dir) => {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((file) => file.toLowerCase().endsWith('.webp'))
    .map((file) => path.join(dir, file));
};

const isAlreadyExistsError = (error) => {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  return error.statusCode === 409 || message.includes('already exists');
};

const main = async () => {
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id')
    .eq('name', BRAND_NAME)
    .single();

  if (brandError) {
    throw brandError;
  }

  const { data: flavors, error: flavorError } = await supabase
    .from('flavors')
    .select('id,name,image_path')
    .eq('brand_id', brand.id);

  if (flavorError) {
    throw flavorError;
  }

  const flavorMap = new Map();
  flavors.forEach((flavor) => {
    flavorMap.set(normalizeName(flavor.name), flavor);
  });

  const files = listWebpFiles(SOURCE_DIR);
  if (!files.length) {
    console.log(`No .webp files found in ${SOURCE_DIR}`);
    return;
  }

  let uploaded = 0;
  let updated = 0;
  const skipped = [];
  const existing = [];
  const unmatched = [];

  for (const filePath of files) {
    const baseName = path.basename(filePath, '.webp');
    const normalized = normalizeName(baseName);
    const flavor = flavorMap.get(normalized);

    if (!flavor) {
      unmatched.push(baseName);
      continue;
    }

    const storagePath = `${STORAGE_PREFIX}/${baseName}.webp`;
    const fileBuffer = fs.readFileSync(filePath);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (uploadError && !isAlreadyExistsError(uploadError)) {
      throw uploadError;
    }

    if (!uploadError) {
      uploaded += 1;
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from('flavors')
      .update({ image_path: storagePath })
      .eq('id', flavor.id)
      .select('id');

    if (updateError) {
      throw updateError;
    }

    if (updatedRows && updatedRows.length) {
      updated += 1;
    } else {
      skipped.push(baseName);
    }
  }

  console.log(
    JSON.stringify(
      {
        uploaded,
        updated,
        skipped: skipped.length,
        existing: existing.length,
        unmatched: unmatched.length,
      },
      null,
      2,
    ),
  );

  if (unmatched.length) {
    console.log('Unmatched files:', unmatched.join(', '));
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
