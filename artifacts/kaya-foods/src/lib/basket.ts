import type { Product, ProductSize } from "../data/products";

export type BasketItem = {
  productId: string;
  sizeId: string;
  quantity: number;
};

export type PopulatedBasketItem = BasketItem & {
  product: Product;
  size: ProductSize;
  lineTotal: number;
};

export const MAX_QUANTITY = 99;

export function normalizeBasket(value: unknown, catalog: Product[]): BasketItem[] {
  if (!Array.isArray(value)) return [];
  const result: BasketItem[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') continue;
    const { productId, sizeId, quantity } = candidate;
    const product = catalog.find(p => p.id === productId && p.availability === 'available');
    if (!product?.sizes.some(s => s.id === sizeId)) continue;
    if (!Number.isSafeInteger(quantity) || quantity < 1) continue;
    const existing = result.find(i => i.productId === productId && i.sizeId === sizeId);
    if (existing) existing.quantity = Math.min(MAX_QUANTITY, existing.quantity + quantity);
    else result.push({ productId, sizeId, quantity: Math.min(MAX_QUANTITY, quantity) });
  }
  return result;
}

export function addBasketItem(items: BasketItem[], item: BasketItem, catalog: Product[]): BasketItem[] {
  return normalizeBasket([...items, item], catalog);
}

export function changeBasketQuantity(items: BasketItem[], productId: string, sizeId: string, quantity: number, catalog: Product[]): BasketItem[] {
  if (!Number.isSafeInteger(quantity)) return normalizeBasket(items, catalog);
  return normalizeBasket(items.map(item =>
    item.productId === productId && item.sizeId === sizeId ? { ...item, quantity } : item
  ), catalog);
}

export function populateBasketItems(items: BasketItem[], catalog: Product[]): PopulatedBasketItem[] {
  return normalizeBasket(items, catalog).map(item => {
    const product = catalog.find(p => p.id === item.productId)!;
    const size = product.sizes.find(s => s.id === item.sizeId)!;
    
    return {
      ...item,
      product,
      size,
      lineTotal: size.price * item.quantity
    };
  });
}

export function calculateBasketTotal(items: PopulatedBasketItem[]): number {
  return items.reduce((total, item) => total + item.lineTotal, 0);
}

export function formatRWF(amount: number): string {
  return new Intl.NumberFormat('en-RW', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' RWF';
}

export function generateOrderSummary(items: PopulatedBasketItem[], total: number, deliveryFee = ''): string {
  let text = `Hello Kaya Foods,\n\nI would like to request the following order:\n\n`;
  
  items.forEach(item => {
    text += `- ${item.quantity}x ${item.product.name} (${item.size.label}) : ${formatRWF(item.lineTotal)}\n`;
  });
  
  text += `\nSubtotal: ${formatRWF(total)}\n`;
  text += `Delivery: ${deliveryFee || 'Delivery fee confirmed on WhatsApp (not included in subtotal)'}\n\n`;
  text += `This is an order request, not a confirmed order. Please confirm availability, delivery options, and payment.`;
  
  return text;
}

export function isValidWhatsAppNumber(phone: string): boolean {
  return /^[1-9]\d{7,14}$/.test(phone);
}

export function generateWhatsAppLink(summary: string, phone: string): string {
  if (!isValidWhatsAppNumber(phone)) throw new Error('WhatsApp ordering is awaiting setup.');
  const encodedText = encodeURIComponent(summary);
  return `https://wa.me/${phone}?text=${encodedText}`;
}
