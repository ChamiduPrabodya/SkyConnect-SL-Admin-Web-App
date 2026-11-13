import test from 'node:test';
import assert from 'node:assert/strict';
import { submittedCabins, submittedPrice } from '../src/flightRouteDetails.js';

test('submitted local fares retain their currency and zero values without leaking unselected cabins', () => {
  const cabins = submittedCabins({ cabin: 'Economy', currency: 'GBP', priceCurrency: 'USD',
    price: { economyLocal: 0, economy: 445, businessLocal: 950, business: 1200, firstLocal: 0 },
    seats: { economy: 0, business: 24, first: 0 } });
  assert.deepEqual(cabins, [{ key: 'economy', label: 'Economy', price: 0, seats: 0, currency: 'GBP' }]);
  assert.equal(submittedPrice(cabins[0].price, cabins[0].currency), 'GBP 0.00');
});

test('older base-currency fares are not mislabeled as local prices and missing values stay unknown', () => {
  const cabins = submittedCabins({ cabin: 'Economy / Business', currency: 'GBP', priceCurrency: 'USD',
    price: { economy: 445, businessLocal: 950 }, seats: { economy: 150, business: 24 } });
  assert.equal(submittedPrice(cabins[0].price, cabins[0].currency), 'USD 445.00');
  assert.equal(submittedPrice(cabins[1].price, cabins[1].currency), 'GBP 950.00');
  assert.equal(submittedPrice(undefined, 'GBP'), 'Not provided');
  assert.equal(submittedPrice('invalid', 'GBP'), 'Not provided');
  assert.deepEqual(submittedCabins({}), []);
});
