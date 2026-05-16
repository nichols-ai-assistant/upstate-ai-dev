#!/usr/bin/env node
/**
 * export-landscape.js
 * Reads landscape.db and writes _data/landscape.json for the Upstate AI Jekyll site.
 * Run: node /Users/admin/src/fi-landscape/export-landscape.js
 */

const path = require('path');
const fs = require('fs');

// Resolve better-sqlite3 — prefer local, fall back to global install
let Database;
try {
  Database = require('better-sqlite3');
} catch (_) {
  Database = require('/opt/homebrew/lib/node_modules/better-sqlite3');
}

const DB_PATH = path.resolve(__dirname, 'landscape.db');
const LOGOS_DIR = path.resolve(__dirname, 'logos');
const OUT_PATH = path.resolve(__dirname, '../upstate-ai-dev/_data/landscape.json');

const db = new Database(DB_PATH, { readonly: true });

// ----- Helpers -----

function hasLogo(vendorId) {
  const file = path.join(LOGOS_DIR, `${vendorId}.png`);
  return fs.existsSync(file);
}

function logoUrl(vendorId) {
  return hasLogo(vendorId) ? `/fi-landscape-logos/${vendorId}.png` : null;
}

// ----- Fetch all T1 categories -----
const t1Rows = db.prepare(`
  SELECT category_id, code, name, description
  FROM categories
  WHERE tier = 1
  ORDER BY code
`).all();

// ----- Fetch all T2 categories with their parent T1 -----
const t2Rows = db.prepare(`
  SELECT t2.category_id, t2.code, t2.name, t2.parent_id,
         t2.description, t2.ai_opportunities,
         t1.code AS t1_code
  FROM categories t2
  JOIN categories t1 ON t2.parent_id = t1.category_id
  WHERE t2.tier = 2
  ORDER BY t2.code
`).all();

// ----- For each T2, fetch vendors + their products in that T2 -----
// A vendor appears once per T2 (de-duped). The primary product drives
// the badge (pervasiveness_tier); all products linked to this T2 are included.

const productsByT2Stmt = db.prepare(`
  SELECT
    v.vendor_id,
    v.name,
    v.homepage_url,
    v.hq_city,
    v.hq_state,
    v.founded_year,
    v.status AS vendor_status,
    v.acquirer_name,
    p.product_id,
    p.product_name,
    p.description,
    p.fi_segment,
    p.pervasiveness_tier,
    p.status AS product_status,
    pc.is_primary
  FROM product_categories pc
  JOIN categories c ON pc.category_id = c.category_id
  JOIN products p   ON pc.product_id  = p.product_id
  JOIN vendors  v   ON p.vendor_id    = v.vendor_id
  WHERE c.category_id = ?
  ORDER BY pc.is_primary DESC, p.pervasiveness_tier DESC
`);

// Pre-fetch integration_ids per product (product-to-product links only)
const integrationMap = new Map();
for (const row of db.prepare(`
  SELECT product_id, integrates_with_product_id
  FROM product_integrations
  WHERE integrates_with_product_id IS NOT NULL
`).all()) {
  if (!integrationMap.has(row.product_id)) integrationMap.set(row.product_id, []);
  integrationMap.get(row.product_id).push(row.integrates_with_product_id);
}

// Pre-fetch competitor_ids per product
const competitorMap = new Map();
for (const row of db.prepare(`
  SELECT product_id, competing_product_id
  FROM product_competitors
`).all()) {
  if (!competitorMap.has(row.product_id)) competitorMap.set(row.product_id, []);
  competitorMap.get(row.product_id).push(row.competing_product_id);
}

// ----- Build the nested structure -----

// Group T2s by T1 parent code
const t2ByT1 = {};
for (const t2 of t2Rows) {
  if (!t2ByT1[t2.t1_code]) t2ByT1[t2.t1_code] = [];
  t2ByT1[t2.t1_code].push(t2);
}

let totalVendorCount = 0;
let totalProductCount = 0;
const seenVendors = new Set();

const categories = t1Rows.map(t1 => {
  const subcategories = (t2ByT1[t1.code] || []).map(t2 => {
    const rows = productsByT2Stmt.all(t2.category_id);

    // De-dupe vendors; keep all products for vendors appearing in this T2
    const vendorMap = new Map();
    for (const row of rows) {
      if (!vendorMap.has(row.vendor_id)) {
        vendorMap.set(row.vendor_id, {
          vendor_id: row.vendor_id,
          name: row.name,
          homepage_url: row.homepage_url || null,
          logo_url: logoUrl(row.vendor_id),
          status: row.vendor_status,
          acquirer_name: row.acquirer_name || null,
          hq_city: row.hq_city || null,
          hq_state: row.hq_state || null,
          founded_year: row.founded_year || null,
          products: []
        });
      }
      vendorMap.get(row.vendor_id).products.push({
        product_id: row.product_id,
        product_name: row.product_name,
        description: row.description || null,
        pervasiveness_tier: row.pervasiveness_tier,
        fi_segment: row.fi_segment,
        status: row.product_status,
        is_primary: row.is_primary === 1,
        competitor_ids: competitorMap.get(row.product_id) || [],
        integration_ids: integrationMap.get(row.product_id) || []
      });
    }

    const vendors = Array.from(vendorMap.values());

    // Track global counts
    for (const v of vendors) {
      if (!seenVendors.has(v.vendor_id)) {
        seenVendors.add(v.vendor_id);
        totalVendorCount++;
      }
      totalProductCount += v.products.length;
    }

    return {
      code: t2.code,
      name: t2.name,
      description: t2.description || null,
      ai_opportunities: t2.ai_opportunities || null,
      vendors
    };
  });

  return {
    code: t1.code,
    name: t1.name,
    description: t1.description || null,
    subcategories
  };
});

// Actual DB totals for meta (more accurate than our traversal count since
// a vendor can appear in multiple T2s — the JSON vendor_count reflects
// unique vendors across the whole DB, product_count is total product-category links)
const dbVendorCount = db.prepare('SELECT COUNT(*) AS n FROM vendors').get().n;
const dbProductCount = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;

const output = {
  categories,
  meta: {
    vendor_count: dbVendorCount,
    product_count: dbProductCount,
    generated_at: new Date().toISOString()
  }
};

fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), 'utf8');

console.log(`Written: ${OUT_PATH}`);
console.log(`  T1 categories : ${categories.length}`);
console.log(`  T2 subcategories: ${categories.reduce((s, c) => s + c.subcategories.length, 0)}`);
console.log(`  Unique vendors (across T2s): ${seenVendors.size}`);
console.log(`  DB vendor count: ${dbVendorCount}`);
console.log(`  DB product count: ${dbProductCount}`);

// Warn about T2s with 0 vendors
const emptyT2s = [];
for (const cat of categories) {
  for (const sub of cat.subcategories) {
    if (sub.vendors.length === 0) {
      emptyT2s.push(`${sub.code} - ${sub.name}`);
    }
  }
}
if (emptyT2s.length) {
  console.warn(`\nWARN: ${emptyT2s.length} T2 subcategories with 0 vendors:`);
  emptyT2s.forEach(s => console.warn(`  ${s}`));
} else {
  console.log('\nAll T2 subcategories have at least 1 vendor.');
}
