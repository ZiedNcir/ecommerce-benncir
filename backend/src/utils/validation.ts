function validationError(message: string) {
  return Object.assign(new Error(message), { statusCode: 400 });
}

export function requireText(value: unknown, field: string, options: { min?: number; max?: number } = {}): string {
  const result = String(value ?? '').trim();
  const min = options.min ?? 1;
  const max = options.max ?? 10000;
  if (result.length < min) throw validationError(`${field} est obligatoire`);
  if (result.length > max) throw validationError(`${field} est trop long`);
  return result;
}

export function requireEmail(value: unknown, field = 'Email'): string {
  const result = requireText(value, field, { max: 180 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw validationError(`${field} invalide`);
  return result;
}

export function requirePositiveInteger(value: unknown, field: string): number {
  const result = Number(value);
  if (!Number.isInteger(result) || result < 1) throw validationError(`${field} doit être un entier positif`);
  return result;
}
