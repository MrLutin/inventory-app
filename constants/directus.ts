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

export const DIRECTUS_URL  = 'https://directus.mrlutin.ovh';
export const COLLECTION    = 'items';

// Fields to request from Directus (comma-separated)
// supplier  → Many-to-One  : supplier.id, supplier.name
// locations → Many-to-Many : junction alias `locations`, related key `locations_id`
export const ITEM_FIELDS   = 'id,name,sku,barcode,supplier_code,category.id,category.name,category.slug,category.color,min_quantity,price,description,image,date_updated,supplier.id,supplier.name,locations.id,locations.quantity,locations.locations_id.id,locations.locations_id.name,locations.locations_id.zone';
