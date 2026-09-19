import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeBasket, populateBasketItems, calculateBasketTotal, addBasketItem,
  changeBasketQuantity, generateOrderSummary, generateWhatsAppLink, isValidWhatsAppNumber,
} from './basket';
import type { Product } from '../data/products';

const catalog: Product[] = [
  {
    id: 'jam', name: 'Jam & fruit', category: 'Jam', shortDescription: 'Sample',
    imageUrl: '', altText: '', availability: 'available', isSample: true, published: true, version: 1,
    sizes: [{ id: 'small', label: '250g', price: 3500 }, { id: 'large', label: '500g', price: 6000 }],
  },
  {
    id: 'juice', name: 'Juice', category: 'Juices', shortDescription: 'Sample',
    imageUrl: '', altText: '', availability: 'available', isSample: true, published: true, version: 1,
    sizes: [{ id: 'bottle', label: '500ml', price: 2500 }],
  },
  {
    id: 'chilli', name: 'Chilli', category: 'Chilli', shortDescription: 'Sample',
    imageUrl: '', altText: '', availability: 'coming_soon', isSample: true, published: true, version: 1,
    sizes: [{ id: 'jar', label: '100g', price: 2000 }],
  },
  {
    id: 'tomato', name: 'Tomato', category: 'Tomato Paste', shortDescription: 'Sample',
    imageUrl: '', altText: '', availability: 'unavailable', isSample: true, published: true, version: 1,
    sizes: [{ id: 'jar', label: '200g', price: 1500 }],
  },
];

test('size selection yields separate lines, selected quantities merge only matching sizes', () => {
  let basket = addBasketItem([], { productId: 'jam', sizeId: 'small', quantity: 2 }, catalog);
  basket = addBasketItem(basket, { productId: 'jam', sizeId: 'large', quantity: 1 }, catalog);
  basket = addBasketItem(basket, { productId: 'jam', sizeId: 'small', quantity: 1 }, catalog);
  const populated = populateBasketItems(basket, catalog);
  assert.equal(populated.length, 2);
  assert.deepEqual(populated.map(item => item.lineTotal), [10500, 6000]);
  assert.equal(calculateBasketTotal(populated), 16500);
});

test('quantity increase, decrease, removal and empty total', () => {
  let basket = addBasketItem([], { productId: 'jam', sizeId: 'small', quantity: 1 }, catalog);
  basket = changeBasketQuantity(basket, 'jam', 'small', 4, catalog);
  assert.equal(calculateBasketTotal(populateBasketItems(basket, catalog)), 14000);
  basket = changeBasketQuantity(basket, 'jam', 'small', 2, catalog);
  assert.equal(basket[0].quantity, 2);
  basket = changeBasketQuantity(basket, 'jam', 'small', 0, catalog);
  assert.deepEqual(basket, []);
  assert.equal(calculateBasketTotal(populateBasketItems(basket, catalog)), 0);
});

test('storage JSON round trip preserves selections without trusting stale prices', () => {
  const original = [{ productId: 'jam', sizeId: 'large', quantity: 2 }];
  const restored = normalizeBasket(JSON.parse(JSON.stringify(original)), catalog);
  assert.deepEqual(restored, original);
  assert.equal(populateBasketItems(restored, catalog)[0].lineTotal, 12000);
});

test('unavailable, obsolete and invalid stored entries cannot be ordered', () => {
  const invalid = [
    null, 'not-an-item', { productId: 'gone', sizeId: 'x', quantity: 1 },
    { productId: 'jam', sizeId: 'gone', quantity: 1 },
    { productId: 'chilli', sizeId: 'jar', quantity: 1 },
    { productId: 'tomato', sizeId: 'jar', quantity: 1 },
    { productId: 'jam', sizeId: 'small', quantity: -1 },
    { productId: 'jam', sizeId: 'small', quantity: 1.5 },
    { productId: 'jam', sizeId: 'small', quantity: '2' },
  ];
  assert.deepEqual(normalizeBasket(invalid, catalog), []);
  assert.deepEqual(normalizeBasket({}, catalog), []);
  assert.equal(normalizeBasket([{ productId: 'jam', sizeId: 'small', quantity: 1000 }], catalog)[0].quantity, 99);
});

test('a product changed to coming soon is removed from saved baskets and cannot be added', () => {
  const updatedCatalog: Product[] = catalog.map(product =>
    product.id === 'juice' ? { ...product, availability: 'coming_soon' } : product,
  );
  const jam = { productId: 'jam', sizeId: 'large', quantity: 2 };
  const juice = { productId: 'juice', sizeId: 'bottle', quantity: 1 };
  assert.deepEqual(normalizeBasket([jam, juice], updatedCatalog), [jam]);
  assert.deepEqual(addBasketItem([jam], juice, updatedCatalog), [jam]);
  assert.equal(calculateBasketTotal(populateBasketItems([jam, juice], updatedCatalog)), 12000);
});

test('WhatsApp summary contains names, sizes, quantities, totals, delivery exclusion and request caveat', () => {
  const items = populateBasketItems([
    { productId: 'jam', sizeId: 'small', quantity: 2 },
    { productId: 'juice', sizeId: 'bottle', quantity: 1 },
  ], catalog);
  const summary = generateOrderSummary(items, calculateBasketTotal(items));
  assert.match(summary, /2x Jam & fruit \(250g\)/);
  assert.match(summary, /7,000 RWF/);
  assert.match(summary, /1x Juice \(500ml\)/);
  assert.match(summary, /Subtotal: 9,500 RWF/);
  assert.match(summary, /Delivery:/);
  assert.match(summary, /not a confirmed order/);
  const link = generateWhatsAppLink(summary, '250700000000');
  assert.equal(new URL(link).searchParams.get('text'), summary);
  assert.ok(link.includes('%26'));
  assert.ok(link.includes('%0A'));
});

test('missing or malformed number never produces an order link', () => {
  for (const number of ['', ' ', 'abc', '00012345', '+250 700 000 000']) {
    assert.equal(isValidWhatsAppNumber(number), false);
    assert.throws(() => generateWhatsAppLink('Sample request', number));
  }
});