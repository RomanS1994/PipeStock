import { randomInt } from 'node:crypto';

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INVITE_LENGTH = 5;

export function createInviteCode() {
  let value = '';
  for (let index = 0; index < INVITE_LENGTH; index += 1) {
    value += INVITE_ALPHABET[randomInt(0, INVITE_ALPHABET.length)];
  }
  return `PST-${value}`;
}
