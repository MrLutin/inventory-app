// ─── Directus Configuration ──────────────────────────────────────────────────
//
// Change DIRECTUS_URL to your server address.
// Change COLLECTION to the name of your Directus items collection.
//
// Expected Directus collection fields (create these in your Directus admin):
//   id            — Primary key (auto-generated)
//   name          — Text
//   sku           — Text
//   barcode       — Text
//   category      — Text (electronics | clothing | food | furniture | tools | other)
//   quantity      — Integer
//   min_quantity  — Integer
//   price         — Decimal / Float
//   location      — Text
//   description   — Text (Long text)
//   supplier      — Text
//   image_emoji   — Text
//   date_updated  — DateTime (auto-managed by Directus)
//
// ─────────────────────────────────────────────────────────────────────────────

export const DIRECTUS_URL  = 'http://51.222.107.160:8055';
export const COLLECTION    = 'items';

// Fields to request from Directus (comma-separated)
export const ITEM_FIELDS   = 'id,name,sku,barcode,category,quantity,min_quantity,price,location,description,supplier,image_emoji,date_updated';
