import assert from 'node:assert/strict';
import test from 'node:test';

import { createInviteCode } from '../lib/invite-code.js';

test('createInviteCode uses the approved PST-XXXXX format', () => {
  for (let index = 0; index < 25; index += 1) {
    assert.match(createInviteCode(), /^PST-[A-HJ-NP-Z2-9]{5}$/);
  }
});
