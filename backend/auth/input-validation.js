import { HttpError } from '../lib/errors.js';

export const AUTH_LIMITS = Object.freeze({
  name: 120,
  companyName: 120,
  email: 254,
  passwordMin: 8,
  passwordMax: 128,
  phone: 32,
  joinCode: 9,
});

export function assertAuthEmail(email) {
  const value = String(email || '');
  if (value.length > AUTH_LIMITS.email || !/^\S+@\S+\.\S+$/.test(value)) {
    throw new HttpError(400, 'Enter a valid email address');
  }
}

export function assertAuthPassword(password) {
  const length = String(password || '').length;
  if (length < AUTH_LIMITS.passwordMin) {
    throw new HttpError(400, `Password must contain at least ${AUTH_LIMITS.passwordMin} characters`);
  }
  if (length > AUTH_LIMITS.passwordMax) {
    throw new HttpError(400, `Password must contain at most ${AUTH_LIMITS.passwordMax} characters`);
  }
}

export function assertPersonName(name) {
  const value = String(name || '').trim();
  if (!value) throw new HttpError(400, 'Name is required');
  if (value.length > AUTH_LIMITS.name) throw new HttpError(400, 'Name is too long');
}

export function assertCompanyName(companyName) {
  const value = String(companyName || '').trim();
  if (!value) throw new HttpError(400, 'Company name is required');
  if (value.length > AUTH_LIMITS.companyName) throw new HttpError(400, 'Company name is too long');
}

export function assertPhone(phone) {
  if (String(phone || '').length > AUTH_LIMITS.phone) {
    throw new HttpError(400, 'Phone number is too long');
  }
}

export function assertJoinCode(joinCode) {
  const value = String(joinCode || '').trim().toUpperCase();
  if (!/^PST-[A-HJ-NP-Z2-9]{5}$/.test(value)) {
    throw new HttpError(400, 'Enter a valid company code');
  }
}
