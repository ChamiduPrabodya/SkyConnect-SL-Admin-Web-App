import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPartnerSubmission } from '../src/partnerApplication.js';

test('registration ISO dates and Firestore timestamps show the same Sri Lankan request time', () => {
  const date = new Date('2026-11-11T10:00:00.000Z');
  const expected = { dateTime: date.toISOString(), date: '11 Nov 2026', time: '3:30 pm' };
  for (const createdAt of [date.toISOString(), date, date.getTime(), { toDate: () => date },
    { seconds: date.getTime() / 1000, nanoseconds: 0 }, { _seconds: date.getTime() / 1000, _nanoseconds: 0 }]) {
    assert.deepEqual(formatPartnerSubmission({ createdAt }), expected);
  }
  assert.equal(formatPartnerSubmission({ createdAt: '2026-11-11T20:00:00Z' }).date, '12 Nov 2026');
});

test('an explicit submission date takes priority and malformed legacy values fall back to registration time', () => {
  const createdAt = '2026-11-11T10:00:00Z';
  assert.equal(formatPartnerSubmission({ submittedAt: '2026-11-10', createdAt }).date, '10 Nov 2026');
  for (const submittedAt of ['invalid', {}, { toDate() { throw new Error('Malformed timestamp'); } }]) {
    assert.equal(formatPartnerSubmission({ submittedAt, createdAt }).date, '11 Nov 2026');
  }
});

test('missing application dates stay unknown and never use last updated time or the current date', () => {
  for (const createdAt of [undefined, null, '', false, 'invalid', {}, { seconds: NaN }, { toDate: () => new Date(NaN) }]) {
    assert.equal(formatPartnerSubmission({ createdAt, updatedAt: '2026-11-12' }), null);
  }
});
