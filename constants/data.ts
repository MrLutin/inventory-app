export type Category = string; // slug dynamique récupéré depuis la collection Directus `categories`
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Supplier {
  id: string;
  name: string;
}

export interface Location {
  junctionId?: string; // ID de la ligne items_locations (nécessaire pour les mises à jour)
  id: string;
  name: string;
  zone?: string;
  quantity?: number; // quantité stockée à cet emplacement (champ de la table de jonction)
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  supplierCode: string | null; // Référence produit du fournisseur
  category: Category;          // nom pour l'affichage (ex: "Électronique")
  categoryId: string | null;   // ID Directus pour les requêtes M2O
  categoryColor: string | null; // couleur hex Directus (ex: "#FFC23B")
  quantity: number;
  minQuantity: number;
  price: number;
  locations: Location[];     // Many-to-Many
  supplier: Supplier | null; // Many-to-One
  description: string;
  lastUpdated: string;
  image: string | null; // Directus file UUID
}

export function getStockStatus(item: InventoryItem): StockStatus {
  if (item.quantity === 0) return 'out_of_stock';
  if (item.quantity <= item.minQuantity) return 'low_stock';
  return 'in_stock';
}

export const STOCK_LABELS: Record<StockStatus, string> = {
  in_stock: 'En stock',
  low_stock: 'Stock faible',
  out_of_stock: 'Rupture',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  electronics: 'Électronique',
  clothing: 'Vêtements',
  food: 'Alimentation',
  furniture: 'Mobilier',
  tools: 'Outils',
  other: 'Autre',
};

export const MOCK_ITEMS: InventoryItem[] = [
  {
    id: '1',
    name: 'MacBook Pro 14"',
    sku: 'APPL-MBP-14-001',
    barcode: '0194253387558',
    category: 'electronics',
    categoryId: null,
    categoryColor: null,
    supplierCode: null,
    quantity: 12,
    minQuantity: 5,
    price: 2499.99,
    locations: [{ id: '1', name: 'Étagère A-01', zone: 'Zone A' }],
    description: 'MacBook Pro 14 pouces, puce M3 Pro, 18 Go RAM, 512 Go SSD. Idéal pour les développeurs et créatifs.',
    supplier: { id: '1', name: 'Apple France' },
    lastUpdated: '2026-04-24',
    image: null,
  },
  {
    id: '2',
    name: 'Clavier Mécanique Keychron K2',
    sku: 'KEYC-K2-BLK-001',
    barcode: '6970060380028',
    category: 'electronics',
    categoryId: null,
    categoryColor: null,
    supplierCode: null,
    quantity: 3,
    minQuantity: 5,
    price: 109.99,
    locations: [{ id: '3', name: 'Étagère A-03', zone: 'Zone A' }],
    description: 'Clavier mécanique compact 75%, switches Brown, rétroéclairage RGB, compatible Mac/Windows.',
    supplier: { id: '2', name: 'Keychron' },
    lastUpdated: '2026-04-22',
    image: null,
  },
  {
    id: '3',
    name: 'Chaise de bureau ErgoFlex',
    sku: 'FURN-CHR-EF-001',
    barcode: '3700891302156',
    category: 'furniture',
    categoryId: null,
    categoryColor: null,
    supplierCode: null,
    quantity: 0,
    minQuantity: 2,
    price: 349.00,
    locations: [{ id: '4', name: 'Entrepôt B-12', zone: 'Zone B' }],
    description: 'Chaise ergonomique avec soutien lombaire réglable, accoudoirs 4D, assise en maille respirante.',
    supplier: { id: '3', name: 'ErgoFlex Pro' },
    lastUpdated: '2026-04-20',
    image: null,
  },
];
