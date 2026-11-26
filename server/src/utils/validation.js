import { badRequest } from './httpError.js';

// Small helpers shared by services to read and validate request input.

export function trimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function toPositiveInt(value, fallback) {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

// Throws a 400 with per-field messages when any field failed validation.
export function assertValid(errors) {
  if (Object.keys(errors).length) throw badRequest('Validation failed', errors);
}
