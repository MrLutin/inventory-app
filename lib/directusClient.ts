import AsyncStorage from '@react-native-async-storage/async-storage';
import { DIRECTUS_URL, COLLECTION, ITEM_FIELDS } from '@/constants/directus';
import { InventoryItem, Category, Supplier, Location } from '@/constants/data';

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEY_ACCESS  = '@directus_access_token';
const KEY_REFRESH = '@directus_refresh_token';
const KEY_EXPIRES = '@directus_expires_at';

// ─── In-memory token cache (avoids AsyncStorage on every request) ─────────────

let _access:  string | null = null;
let _refresh: string | null = null;
let _expiresAt = 0;

// ─── Token persistence ────────────────────────────────────────────────────────

export async function loadStoredTokens() {
  const [access, refresh, expiresStr] = await Promise.all([
    AsyncStorage.getItem(KEY_ACCESS),
    AsyncStorage.getItem(KEY_REFRESH),
    AsyncStorage.getItem(KEY_EXPIRES),
  ]);
  _access     = access;
  _refresh    = refresh;
  _expiresAt  = expiresStr ? parseInt(expiresStr, 10) : 0;
}

async function saveTokens(access: string, refresh: string, expiresMs: number) {
  _access    = access;
  _refresh   = refresh;
  _expiresAt = Date.now() + expiresMs;
  await Promise.all([
    AsyncStorage.setItem(KEY_ACCESS,  access),
    AsyncStorage.setItem(KEY_REFRESH, refresh),
    AsyncStorage.setItem(KEY_EXPIRES, String(_expiresAt)),
  ]);
}

export async function clearTokens() {
  _access = _refresh = null;
  _expiresAt = 0;
  await Promise.all([
    AsyncStorage.removeItem(KEY_ACCESS),
    AsyncStorage.removeItem(KEY_REFRESH),
    AsyncStorage.removeItem(KEY_EXPIRES),
  ]);
}

// ─── Token refresh ────────────────────────────────────────────────────────────

async function refreshTokens(): Promise<boolean> {
  if (!_refresh) return false;
  try {
    const res  = await fetch(`${DIRECTUS_URL}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refresh_token: _refresh, mode: 'json' }),
    });
    if (!res.ok) { await clearTokens(); return false; }
    const { data } = await res.json();
    await saveTokens(data.access_token, data.refresh_token, data.expires);
    return true;
  } catch {
    return false;
  }
}

// ─── Get a valid access token (auto-refresh if needed) ────────────────────────

export async function getValidToken(): Promise<string | null> {
  // Refresh if token expires within the next 60 seconds
  if (_access && Date.now() < _expiresAt - 60_000) return _access;
  const ok = await refreshTokens();
  return ok ? _access : null;
}

export function hasSession(): boolean {
  return !!_refresh;
}

// ─── Base fetch wrapper ───────────────────────────────────────────────────────

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (auth) {
    const token = await getValidToken();
    if (!token) throw new Error('NOT_AUTHENTICATED');
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg  = body?.errors?.[0]?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface DirectusUser {
  id:         string;
  first_name: string | null;
  last_name:  string | null;
  email:      string;
  // role is a nested object when the user has permission to read directus_roles (admins),
  // or a plain UUID string when they don't (regular users).
  role: { id: string; name: string } | string | null;
}

export async function directusLogin(email: string, password: string): Promise<{
  user: DirectusUser;
  accessToken: string;
}> {
  // 1. Authenticate
  const authRes = await apiRequest<{ data: { access_token: string; refresh_token: string; expires: number } }>(
    '/auth/login',
    {
      method: 'POST',
      body:   JSON.stringify({ email, password, mode: 'json' }),
    },
    false,
  );

  await saveTokens(authRes.data.access_token, authRes.data.refresh_token, authRes.data.expires);

  // 2. Fetch user info
  const user = await fetchMe();
  return { user, accessToken: authRes.data.access_token };
}

// Step 1: fetch basic profile (always succeeds — role comes back as UUID string).
// Step 2: try to resolve role details via /roles/{id} (may fail if user has no
//         read permission on directus_roles — that's fine, we just keep the UUID).
async function fetchMe(): Promise<DirectusUser> {
  const res = await apiRequest<{ data: DirectusUser }>(
    '/users/me?fields=id,first_name,last_name,email,role',
  );
  const user = res.data;

  if (user.role && typeof user.role === 'string') {
    try {
      const roleRes = await apiRequest<{ data: { id: string; name: string } }>(
        `/roles/${user.role}?fields=id,name`,
      );
      user.role = roleRes.data;
    } catch {
      // No permission on directus_roles — role stays as UUID → treated as 'user'
    }
  }

  return user;
}

export async function apiGetMe(): Promise<DirectusUser> {
  return fetchMe();
}

export async function directusLogout(): Promise<void> {
  if (_refresh) {
    await apiRequest('/auth/logout', {
      method: 'POST',
      body:   JSON.stringify({ refresh_token: _refresh, mode: 'json' }),
    }).catch(() => {});
  }
  await clearTokens();
}

// ─── Field mapping ────────────────────────────────────────────────────────────
//
// Directus (snake_case) ←→ App (camelCase)
//
// If your Directus fields have different names, adjust the mapping here.

// Raw Directus shapes for relations
type DirectusSupplier = { id: number | string; name: string };
type DirectusLocation = { id: number | string; name: string; zone?: string };

type DirectusItem = {
  id:            number | string;
  name:          string;
  sku:           string;
  barcode:       string;
  supplier_code: string | null;
  min_quantity:  number;
  price:         number;
  // Many-to-One → object (or null)
  supplier:      DirectusSupplier | null;
  // Many-to-Many → array of junction rows (id = PK of items_locations)
  locations:     Array<{ id?: number | string; quantity?: number; locations_id: DirectusLocation }>;
  description:   string;
  image:         string | null; // Directus file UUID
  date_updated:  string | null;
};

// ─── Image helper ─────────────────────────────────────────────────────────────

/** Returns the full URL for a Directus file UUID, or null if no image. */
export function getImageUrl(uuid: string | null | undefined): string | null {
  if (!uuid) return null;
  return `${DIRECTUS_URL}/assets/${uuid}`;
}

/** Uploads a local file to Directus and returns the file UUID. */
export async function uploadFile(uri: string, filename: string, mimeType = 'image/jpeg'): Promise<string> {
  const token = await getValidToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  const formData = new FormData();
  formData.append('file', { uri, name: filename, type: mimeType } as any);

  const res = await fetch(`${DIRECTUS_URL}/files`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}` },
    body:    formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.errors?.[0]?.message ?? `HTTP ${res.status}`);
  }

  const { data } = await res.json();
  return data.id as string;
}

// ─── Field mapping ────────────────────────────────────────────────────────────

function fromDirectus(d: DirectusItem): InventoryItem {
  const rawCat = (d as any).category;

  // Supporte 3 cas :
  //   1. Objet M2O  : { id, name, slug }  → préférer slug, sinon name
  //   2. Entier     : 3                   → on n'a pas le nom, fallback 'other'
  //   3. Chaîne     : "electronics"       → utiliser directement
  const category =
    rawCat && typeof rawCat === 'object'
      ? (rawCat.name ?? rawCat.slug ?? 'other')   // nom pour l'affichage
      : (typeof rawCat === 'string' && rawCat.length > 0 ? rawCat : 'other');

  const categoryId =
    rawCat && typeof rawCat === 'object' && rawCat.id != null
      ? String(rawCat.id)
      : null;

  const categoryColor =
    rawCat && typeof rawCat === 'object' && rawCat.color
      ? String(rawCat.color)
      : null;

  return {
    id:           String(d.id),
    name:         d.name          ?? '',
    sku:          d.sku           ?? '',
    barcode:      d.barcode       ?? '',
    supplierCode: d.supplier_code ?? null,
    category,
    categoryId,
    categoryColor,
    // Total quantity = sum of quantities across all locations
    quantity:    (d.locations ?? []).reduce((sum, j) => sum + (j.quantity ?? 0), 0),
    minQuantity: Number(d.min_quantity ?? 0),
    price:       Number(d.price       ?? 0),
    supplier:    d.supplier
      ? { id: String(d.supplier.id), name: d.supplier.name ?? '' }
      : null,
    locations:   (d.locations ?? []).map(j => ({
      junctionId: j.id != null ? String(j.id) : undefined,
      id:         String(j.locations_id.id),
      name:       j.locations_id.name ?? '',
      zone:       j.locations_id.zone,
      quantity:   j.quantity ?? undefined,
    })),
    description: d.description  ?? '',
    image:       d.image        ?? null,
    lastUpdated: d.date_updated
      ? d.date_updated.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  };
}

function toDirectus(item: Partial<InventoryItem>, locationsToDelete: string[] = []): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  if (item.name         !== undefined) d.name          = item.name;
  // sku omis — généré automatiquement par Directus (uuid special)
  if (item.barcode      !== undefined) d.barcode        = item.barcode;
  if (item.supplierCode !== undefined) d.supplier_code  = item.supplierCode ?? null;
  // category → envoyer l'ID entier (clé étrangère M2O), pas le slug
  if (item.categoryId !== undefined) d.category = item.categoryId ? Number(item.categoryId) : null;
  else if (item.category !== undefined) d.category = item.category; // fallback si categoryId absent
  // quantity is computed from locations — never sent directly to Directus
  if (item.minQuantity  !== undefined) d.min_quantity  = item.minQuantity;
  if (item.price        !== undefined) d.price         = item.price;
  if (item.description  !== undefined) d.description   = item.description;
  if (item.image        !== undefined) d.image         = item.image; // UUID or null
  // Many-to-One: send supplier ID (or null to unlink)
  if (item.supplier     !== undefined) d.supplier      = item.supplier ? Number(item.supplier.id) : null;
  // Many-to-Many: use Directus explicit create/update/delete format.
  // - junctionId present  → update existing junction row in place
  // - junctionId absent   → create new junction row
  // This prevents Directus from creating duplicate rows on PATCH.
  if (item.locations !== undefined) {
    const toUpdate = item.locations.filter(l => l.junctionId);
    const toCreate = item.locations.filter(l => !l.junctionId);
    d.locations = {
      update: toUpdate.map(l => ({
        id:           Number(l.junctionId),
        quantity:     l.quantity ?? 0,
      })),
      create: toCreate.map(l => ({
        locations_id: Number(l.id),
        quantity:     l.quantity ?? 0,
      })),
      delete: locationsToDelete.map(Number),
    };
  }
  return d;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export interface DirectusCategory {
  id:    number | string;
  name:  string;
  slug?: string | null;
  color?: string | null;
}

export async function fetchCategories(): Promise<DirectusCategory[]> {
  const res = await apiRequest<{ data: DirectusCategory[] }>(
    '/items/categories?fields=id,name,slug,color&sort=name',
  );
  return res.data;
}

// ─── Inventory CRUD ───────────────────────────────────────────────────────────

export async function fetchItems(): Promise<InventoryItem[]> {
  const res = await apiRequest<{ data: DirectusItem[] }>(
    `/items/${COLLECTION}?fields=${ITEM_FIELDS}&sort=-date_updated&limit=-1`,
  );
  return res.data.map(fromDirectus);
}

export async function createDirectusItem(item: Omit<InventoryItem, 'id' | 'lastUpdated'>): Promise<InventoryItem> {
  const res = await apiRequest<{ data: DirectusItem }>(
    `/items/${COLLECTION}`,
    { method: 'POST', body: JSON.stringify(toDirectus(item)) },
  );
  return fromDirectus(res.data);
}

export async function updateDirectusItem(id: string, item: Partial<InventoryItem>, locationsToDelete: string[] = []): Promise<InventoryItem> {
  const res = await apiRequest<{ data: DirectusItem }>(
    `/items/${COLLECTION}/${id}`,
    { method: 'PATCH', body: JSON.stringify(toDirectus(item, locationsToDelete)) },
  );
  return fromDirectus(res.data);
}

export async function deleteDirectusItem(id: string): Promise<void> {
  await apiRequest<void>(`/items/${COLLECTION}/${id}`, { method: 'DELETE' });
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export interface DirectusSupplierRef {
  id:       number | string;
  name:     string;
  contact?: string | null;
  email?:   string | null;
  phone?:   string | null;
  website?: string | null;
}

export async function fetchSuppliers(): Promise<DirectusSupplierRef[]> {
  const res = await apiRequest<{ data: DirectusSupplierRef[] }>(
    '/items/suppliers?fields=id,name,website&sort=name',
  );
  return res.data;
}

// ─── Locations ────────────────────────────────────────────────────────────────

export interface DirectusLocationRef {
  id:           number | string;
  name:         string;
  zone?:        string | null;
  description?: string | null;
}

export async function fetchLocations(): Promise<DirectusLocationRef[]> {
  const res = await apiRequest<{ data: DirectusLocationRef[] }>(
    '/items/locations?fields=id,name,zone,description&sort=name',
  );
  return res.data;
}

// ─── Suppliers CRUD ───────────────────────────────────────────────────────────

export type SupplierPayload = {
  name:     string;
  website?: string;
  // email et phone sont optionnels — ajouter ces champs dans Directus si nécessaire
  email?:   string;
  phone?:   string;
};

export async function createSupplierDirectus(data: SupplierPayload): Promise<DirectusSupplierRef & { contact?: string; email?: string; phone?: string }> {
  const res = await apiRequest<{ data: any }>(
    '/items/suppliers',
    { method: 'POST', body: JSON.stringify(data) },
  );
  return res.data;
}

export async function updateSupplierDirectus(id: string, data: Partial<SupplierPayload>): Promise<void> {
  await apiRequest<void>(
    `/items/suppliers/${id}`,
    { method: 'PATCH', body: JSON.stringify(data) },
  );
}

export async function deleteSupplierDirectus(id: string): Promise<void> {
  await apiRequest<void>(`/items/suppliers/${id}`, { method: 'DELETE' });
}

// ─── Categories CRUD ─────────────────────────────────────────────────────────

export type CategoryPayload = {
  name:   string;
  slug?:  string;
  color?: string | null;
};

export async function createCategoryDirectus(data: CategoryPayload): Promise<DirectusCategory> {
  const res = await apiRequest<{ data: DirectusCategory }>(
    '/items/categories',
    { method: 'POST', body: JSON.stringify(data) },
  );
  return res.data;
}

export async function updateCategoryDirectus(id: string, data: Partial<CategoryPayload>): Promise<void> {
  await apiRequest<void>(
    `/items/categories/${id}`,
    { method: 'PATCH', body: JSON.stringify(data) },
  );
}

export async function deleteCategoryDirectus(id: string): Promise<void> {
  await apiRequest<void>(`/items/categories/${id}`, { method: 'DELETE' });
}

// ─── Locations CRUD ───────────────────────────────────────────────────────────

export type LocationPayload = {
  name: string;
  zone?: string;
  description?: string;
};

export async function createLocationDirectus(data: LocationPayload): Promise<DirectusLocationRef & { description?: string }> {
  const res = await apiRequest<{ data: any }>(
    '/items/locations',
    { method: 'POST', body: JSON.stringify(data) },
  );
  return res.data;
}

export async function updateLocationDirectus(id: string, data: Partial<LocationPayload>): Promise<void> {
  await apiRequest<void>(
    `/items/locations/${id}`,
    { method: 'PATCH', body: JSON.stringify(data) },
  );
}

export async function deleteLocationDirectus(id: string): Promise<void> {
  await apiRequest<void>(`/items/locations/${id}`, { method: 'DELETE' });
}
