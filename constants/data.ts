export type Category = 'electronics' | 'clothing' | 'food' | 'furniture' | 'tools' | 'other';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: Category;
  quantity: number;
  minQuantity: number;
  price: number;
  location: string;
  description: string;
  supplier: string;
  lastUpdated: string;
  imageEmoji: string;
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
    quantity: 12,
    minQuantity: 5,
    price: 2499.99,
    location: 'Étagère A-01',
    description: 'MacBook Pro 14 pouces, puce M3 Pro, 18 Go RAM, 512 Go SSD. Idéal pour les développeurs et créatifs.',
    supplier: 'Apple France',
    lastUpdated: '2026-04-24',
    imageEmoji: '💻',
  },
  {
    id: '2',
    name: 'Clavier Mécanique Keychron K2',
    sku: 'KEYC-K2-BLK-001',
    barcode: '6970060380028',
    category: 'electronics',
    quantity: 3,
    minQuantity: 5,
    price: 109.99,
    location: 'Étagère A-03',
    description: 'Clavier mécanique compact 75%, switches Brown, rétroéclairage RGB, compatible Mac/Windows.',
    supplier: 'Keychron',
    lastUpdated: '2026-04-22',
    imageEmoji: '⌨️',
  },
  {
    id: '3',
    name: 'Chaise de bureau ErgoFlex',
    sku: 'FURN-CHR-EF-001',
    barcode: '3700891302156',
    category: 'furniture',
    quantity: 0,
    minQuantity: 2,
    price: 349.00,
    location: 'Entrepôt B-12',
    description: 'Chaise ergonomique avec soutien lombaire réglable, accoudoirs 4D, assise en maille respirante.',
    supplier: 'ErgoFlex Pro',
    lastUpdated: '2026-04-20',
    imageEmoji: '🪑',
  },
  {
    id: '4',
    name: 'T-Shirt Premium Col Rond',
    sku: 'CLT-TSH-BLK-L',
    barcode: '3614272648012',
    category: 'clothing',
    quantity: 45,
    minQuantity: 10,
    price: 29.99,
    location: 'Étagère C-05',
    description: 'T-shirt 100% coton bio, coupe unisexe, disponible en taille L. Certifié GOTS.',
    supplier: 'EcoWear',
    lastUpdated: '2026-04-25',
    imageEmoji: '👕',
  },
  {
    id: '5',
    name: 'Perceuse Bosch GSB 18V',
    sku: 'BSCH-GSB18-001',
    barcode: '3165140869393',
    category: 'tools',
    quantity: 7,
    minQuantity: 3,
    price: 189.00,
    location: 'Étagère D-02',
    description: 'Perceuse-visseuse à percussion 18V sans fil, couple max 60Nm, livrée avec 2 batteries et chargeur.',
    supplier: 'Bosch Pro',
    lastUpdated: '2026-04-23',
    imageEmoji: '🔧',
  },
  {
    id: '6',
    name: 'Café Éthiopien Bio 1kg',
    sku: 'FOOD-CAF-ETH-1K',
    barcode: '3760280060123',
    category: 'food',
    quantity: 2,
    minQuantity: 10,
    price: 24.90,
    location: 'Réserve F-01',
    description: 'Café arabica d\'origine Éthiopie, torréfaction artisanale, notes de fruits rouges et de chocolat. DLC: 2026-10.',
    supplier: 'Terres de Café',
    lastUpdated: '2026-04-21',
    imageEmoji: '☕',
  },
  {
    id: '7',
    name: 'Moniteur LG UltraWide 34"',
    sku: 'LG-UM-34-001',
    barcode: '8806098759927',
    category: 'electronics',
    quantity: 5,
    minQuantity: 2,
    price: 599.99,
    location: 'Étagère A-02',
    description: 'Écran UltraWide 34 pouces, résolution 3440×1440, 144Hz, dalle IPS, compatible USB-C.',
    supplier: 'LG Electronics',
    lastUpdated: '2026-04-26',
    imageEmoji: '🖥️',
  },
  {
    id: '8',
    name: 'Bureau Standing Desk Pro',
    sku: 'FURN-DK-SDP-001',
    barcode: '7350065321084',
    category: 'furniture',
    quantity: 4,
    minQuantity: 2,
    price: 699.00,
    location: 'Entrepôt B-08',
    description: 'Bureau réglable en hauteur électrique, plateau 160×80 cm, mémoire 3 positions, cadre en acier.',
    supplier: 'FlexiDesk',
    lastUpdated: '2026-04-18',
    imageEmoji: '🪵',
  },
];
