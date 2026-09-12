import test from 'node:test';
import assert from 'node:assert/strict';

import {
  hasActiveCompanyMembership,
  hasActiveCompanyMembershipInTx,
  lockUserForMembershipChange,
} from '../auth/membership-policy.js';

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

test('checks active memberships inside a transaction and can exclude the target membership', async () => {
  let where;
  const tx = {
    companyMembership: {
      findFirst: async args => {
        where = args.where;
        return { id: 'membership-2' };
      },
    },
  };

  assert.equal(await hasActiveCompanyMembershipInTx(tx, 'user-1', 'membership-1'), true);
  assert.deepEqual(where, {
    userId: 'user-1',
    status: 'ACTIVE',
    deletedAt: null,
    id: { not: 'membership-1' },
  });
});

test('returns false when no active membership exists in the transaction', async () => {
  const tx = {
    companyMembership: {
      findFirst: async () => null,
    },
  };

  assert.equal(await hasActiveCompanyMembershipInTx(tx, 'user-1'), false);
});

test('locks the user row before a membership transition', async () => {
  let called = false;
  const tx = {
    $queryRaw: async () => {
      called = true;
      return [{ id: 'user-1' }];
    },
  };

  assert.equal(await lockUserForMembershipChange(tx, 'user-1'), true);
  assert.equal(called, true);
});
