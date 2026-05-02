import AsyncStorage from '@react-native-async-storage/async-storage';
import { DIRECTUS_URL, COLLECTION, ITEM_FIELDS } from '@/constants/directus';
import { InventoryItem, Category } from '@/constants/data';

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
  id: string;
  first_name: string;
  last_name:  string;
  email:      string;
  role: {
    id:   string;
    name: string;
  };
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
  const meRes = await apiRequest<{ data: DirectusUser }>(
    '/users/me?fields=id,first_name,last_name,email,role.id,role.name',
  );

  return { user: meRes.data, accessToken: authRes.data.access_token };
}

export async function apiGetMe(): Promise<DirectusUser> {
  const res = await apiRequest<{ data: DirectusUser }>(
    '/users/me?fields=id,first_name,last_name,email,role.id,role.name',
  );
  return res.data;
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

type DirectusItem = {
  id:           number | string;
  name:         string;
  sku:          string;
  barcode:      string;
  category:     Category;
  quantity:     number;
  min_quantity: number;
  price:        number;
  location:     string;
  description:  string;
  supplier:     string;
  image_emoji:  string;
  date_updated: string | null;
};

function fromDirectus(d: DirectusItem): InventoryItem {
  return {
    id:          String(d.id),
    name:        d.name         ?? '',
    sku:         d.sku          ?? '',
    barcode:     d.barcode      ?? '',
    category:    d.category     ?? 'other',
    quantity:    Number(d.quantity    ?? 0),
    minQuantity: Number(d.min_quantity ?? 0),
    price:       Number(d.price       ?? 0),
    location:    d.location     ?? '',
    description: d.description  ?? '',
    supplier:    d.supplier     ?? '',
    imageEmoji:  d.image_emoji  ?? '📦',
    lastUpdated: d.date_updated
      ? d.date_updated.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  };
}

function toDirectus(item: Partial<InventoryItem>): Partial<DirectusItem> {
  const d: Partial<DirectusItem> = {};
  if (item.name         !== undefined) d.name         = item.name;
  if (item.sku          !== undefined) d.sku          = item.sku;
  if (item.barcode      !== undefined) d.barcode      = item.barcode;
  if (item.category     !== undefined) d.category     = item.category;
  if (item.quantity     !== undefined) d.quantity     = item.quantity;
  if (item.minQuantity  !== undefined) d.min_quantity = item.minQuantity;
  if (item.price        !== undefined) d.price        = item.price;
  if (item.location     !== undefined) d.location     = item.location;
  if (item.description  !== undefined) d.description  = item.description;
  if (item.supplier     !== undefined) d.supplier     = item.supplier;
  if (item.imageEmoji   !== undefined) d.image_emoji  = item.imageEmoji;
  return d;
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

export async function updateDirectusItem(id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
  const res = await apiRequest<{ data: DirectusItem }>(
    `/items/${COLLECTION}/${id}`,
    { method: 'PATCH', body: JSON.stringify(toDirectus(item)) },
  );
  return fromDirectus(res.data);
}

export async function deleteDirectusItem(id: string): Promise<void> {
  await apiRequest<void>(`/items/${COLLECTION}/${id}`, { method: 'DELETE' });
}
