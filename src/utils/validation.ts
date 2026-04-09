export const normalizePhone = (value: string) => value.replace(/\D/g, '');

export const isValidPhone10 = (value: string) => /^\d{10}$/.test(normalizePhone(value));

export const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(value || '').trim());

