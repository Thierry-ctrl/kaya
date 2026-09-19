import { useEffect, useSyncExternalStore } from 'react';
import { useStorefront } from './use-storefront';
import {
  type BasketItem, normalizeBasket, addBasketItem, changeBasketQuantity,
} from '../lib/basket';

const BASKET_STORAGE_KEY = 'kaya_foods_basket';
type Snapshot = { items: BasketItem[]; storageError: string | null };
const listeners = new Set<() => void>();
let snapshot: Snapshot = { items: [], storageError: null };
let initialized = false;
let currentCatalog: import('../data/products').Product[] | undefined;

function readStorage(catalog?: import('../data/products').Product[]): Snapshot {
  try {
    const stored = localStorage.getItem(BASKET_STORAGE_KEY);
    if (!stored) return { items: [], storageError: null };
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error('Invalid stored basket');
    const items = catalog ? normalizeBasket(parsed, catalog) : parsed.filter((item): item is BasketItem =>
      !!item && typeof item === 'object' &&
      typeof item.productId === 'string' && typeof item.sizeId === 'string' &&
      Number.isSafeInteger(item.quantity) && item.quantity > 0
    );
    return {
      items,
      storageError: JSON.stringify(items) !== JSON.stringify(parsed)
        ? 'Your saved basket was updated to match the current catalogue and available sizes.'
        : null,
    };
  } catch {
    return { items: [], storageError: 'Your saved basket could not be loaded. You can still create a new basket in this tab.' };
  }
}

function notify() {
  listeners.forEach(listener => listener());
}

function getSnapshot() {
  if (!initialized && typeof window !== 'undefined') {
    initialized = true;
    snapshot = readStorage();
    window.addEventListener('storage', event => {
      if (event.key === BASKET_STORAGE_KEY || event.key === null) {
        snapshot = readStorage(currentCatalog);
        notify();
      }
    });
  }
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function commit(items: BasketItem[], notice: string | null = null) {
  let storageError: string | null = notice;
  try {
    localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(items));
  } catch {
    storageError = 'Browser storage is unavailable. Your basket works in this tab, but may not survive a refresh.';
  }
  snapshot = { items, storageError };
  notify();
}

export function useBasket() {
  const { products } = useStorefront();
  const { items, storageError } = useSyncExternalStore(subscribe, getSnapshot);
  useEffect(() => {
    currentCatalog = products;
    const current = getSnapshot().items;
    const reconciled = normalizeBasket(current, products);
    if (JSON.stringify(current) !== JSON.stringify(reconciled)) {
      commit(reconciled, 'Your saved basket was updated to match the current catalogue and available sizes.');
    }
  }, [products]);
  return {
    items,
    storageError,
    addItem(productId: string, sizeId: string, quantity = 1) {
      commit(addBasketItem(getSnapshot().items, { productId, sizeId, quantity }, products));
    },
    updateQuantity(productId: string, sizeId: string, quantity: number) {
      commit(changeBasketQuantity(getSnapshot().items, productId, sizeId, quantity, products));
    },
    removeItem(productId: string, sizeId: string) {
      commit(getSnapshot().items.filter(item => item.productId !== productId || item.sizeId !== sizeId));
    },
    clearBasket() { commit([]); },
    totalItemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}