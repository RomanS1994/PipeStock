import { sendJson } from './http.js';

export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

export function sendHttpError(response, error) {
  const statusCode = Number(error?.statusCode) || 500;
  const message = statusCode >= 500 ? 'Internal server error' : error?.message || 'Request failed';

  if (statusCode >= 500) {
    console.error(error);
  }

  sendJson(response, statusCode, { error: message });
}
