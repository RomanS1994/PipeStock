import test from 'node:test';
import assert from 'node:assert/strict';

import { hasActiveCompanyMembership } from '../auth/membership-policy.js';

test('detects an active company membership', () => {
  assert.equal(hasActiveCompanyMembership({
    memberships: [{ status: 'ACTIVE', deletedAt: null, company: { id: 'company-1' } }],
  }), true);
});

test('ignores inactive, deleted, or company-less memberships', () => {
  assert.equal(hasActiveCompanyMembership({ memberships: [
    { status: 'INACTIVE', deletedAt: null, company: { id: 'company-1' } },
    { status: 'ACTIVE', deletedAt: new Date(), company: { id: 'company-2' } },
    { status: 'ACTIVE', deletedAt: null, company: null },
  ] }), false);
});

test('returns false when memberships are missing', () => {
  assert.equal(hasActiveCompanyMembership({}), false);
  assert.equal(hasActiveCompanyMembership(null), false);
});
