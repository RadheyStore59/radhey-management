import { LocalStorageDB } from './localStorage';

export const normalizeWhatsAppPhone = (raw: string, countryCode = '91') => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith(countryCode) && digits.length >= countryCode.length + 10) {
    return digits;
  }

  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  return `${countryCode}${last10}`;
};

const DEFAULT_BRAND = 'Radhey Personlized Gifts';

const fillTemplate = (template: string, vars: Record<string, string>) =>
  template
    .replace(/\{\{customerName\}\}/g, vars.customerName || '')
    .replace(/\{\{orderId\}\}/g, vars.orderId || '')
    .replace(/\{\{productName\}\}/g, vars.productName || '')
    .replace(/\{\{phase\}\}/g, vars.phase || '')
    .replace(/\{\{phaseMessage\}\}/g, vars.phaseMessage || '')
    .replace(/\{\{phone\}\}/g, vars.phone || '')
    .replace(/\{\{brand\}\}/g, vars.brand || DEFAULT_BRAND);

const getPhaseMessage = (phase?: string) => {
  const value = (phase || '').toLowerCase().trim();
  if (value === 'order taken') return 'Your order has been received successfully.';
  if (value === 'in process') return 'Your order is currently in process.';
  if (value === 'order ready') return 'Great news! Your order is ready.';
  if (value === 'dispatched') return 'Your order has been dispatched.';
  if (value === 'delivered') return 'Your order has been delivered successfully.';
  return 'Your order status has been updated.';
};

/** Every standardized phase sentence we inject — used to strip duplicates / old template text */
const ALL_PHASE_SENTENCES = [
  'Your order has been delivered successfully.',
  'Your order has been received successfully.',
  'Your order is currently in process.',
  'Great news! Your order is ready.',
  'Your order has been dispatched.',
  'Your order status has been updated.',
];

/** Only append auto line if the raw template did not already use placeholders (after fill, {{…}} is gone). */
const ensureSalesPhaseDynamic = (rawTemplate: string, message: string, phase?: string) => {
  const hasPlaceholder =
    rawTemplate.includes('{{phase}}') || rawTemplate.includes('{{phaseMessage}}');
  if (hasPlaceholder) return message;

  const phaseMessage = getPhaseMessage(phase || 'Order Taken');
  return `${message}\n${phaseMessage}`;
};

/** Turn cramped one-line sales text into WhatsApp-friendly paragraphs. */
const formatSalesMessageLayout = (message: string) => {
  let formatted = message.replace(/\r\n/g, '\n').trim();
  formatted = formatted.replace(/Radhey Management/gi, DEFAULT_BRAND);

  // Templates often use "product:" — always show proper "Product:" in the message
  formatted = formatted.replace(/(^|[\n,])\s*product(\s*:)/gi, '$1Product$2');

  // Greeting → Product (comma then Product:)
  formatted = formatted.replace(/,\s*(Product\s*:)/gi, ',\n\n$1');

  // Product line → phase sentence (longer phrases first so regex matches correctly)
  const phaseAlternation = [...ALL_PHASE_SENTENCES]
    .sort((a, b) => b.length - a.length)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const beforePhase = new RegExp(`(Product\\s*:\\s*[^\\n]+?)\\s+(${phaseAlternation})`, 'gi');
  formatted = formatted.replace(beforePhase, '$1\n\n$2');

  // Phase / last sentence → brand line
  const brandEsc = DEFAULT_BRAND.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  formatted = formatted.replace(
    new RegExp(`([.!?])\\s+(${brandEsc})`, 'gi'),
    '$1\n\n$2'
  );

  // Product name on its own line (reads clearer in WhatsApp)
  formatted = formatted.replace(/\bProduct\s*:\s*([^\n]+)/gi, (_full, name: string) => {
    const n = String(name).trim();
    return n ? `Product:\n${n}` : 'Product:';
  });

  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  if (!formatted.includes('\n')) {
    formatted = formatted
      .replace(/\s+Product:/i, '\n\nProduct:')
      .replace(/\s+Thank you for choosing/i, '\n\nThank you for choosing');
  }

  return formatted.trim();
};

/** When template already uses {{phaseMessage}}, only light cleanup so layout stays customized. */
const cleanSalesMessage = (message: string, phase: string | undefined, rawTemplate: string) => {
  let cleaned = message.replace(/\r\n/g, '\n');

  cleaned = cleaned.replace(/\s*Status:\s*[^\n]+/gi, '');
  cleaned = cleaned.replace(/Radhey Management/gi, DEFAULT_BRAND);

  const usesPhasePlaceholder =
    rawTemplate.includes('{{phaseMessage}}') || rawTemplate.includes('{{phase}}');

  if (usesPhasePlaceholder) {
    return cleaned
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/  +/g, ' ')
      .trim();
  }

  // Legacy templates without phase placeholders: one phase line, no duplicates
  const phaseMessage = getPhaseMessage(phase || 'Order Taken');
  for (const sentence of ALL_PHASE_SENTENCES) {
    const escaped = sentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(escaped, 'gi'), '');
  }

  cleaned = cleaned
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/  +/g, ' ')
    .trim();

  const thankYouRe = /(\nThank you for choosing)/i;
  if (thankYouRe.test(cleaned)) {
    cleaned = cleaned.replace(thankYouRe, `\n${phaseMessage}$1`);
  } else {
    cleaned = `${cleaned}\n${phaseMessage}`;
  }

  return cleaned.trim();
};

export const openWhatsAppWithTemplate = ({
  module,
  customerName,
  phone,
  orderId = '',
  productName = '',
  phase = '',
}: {
  module: 'leads' | 'sales';
  customerName: string;
  phone: string;
  orderId?: string;
  productName?: string;
  phase?: string;
}) => {
  const templates = LocalStorageDB.getWhatsAppTemplates();
  const template = module === 'sales' ? templates.sales : templates.leads;
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone) return false;

  const normalizedOrderId =
    orderId && orderId.toUpperCase() !== 'NA' ? orderId : (productName || '');

  const phaseMessage = module === 'sales' ? getPhaseMessage(phase) : '';
  let message = fillTemplate(template, {
    customerName: customerName || '',
    orderId: normalizedOrderId,
    productName,
    phase,
    phaseMessage,
    phone: normalizedPhone,
    brand: DEFAULT_BRAND,
  });
  if (module === 'sales') {
    message = ensureSalesPhaseDynamic(template, message, phase);
    message = formatSalesMessageLayout(message);
    message = cleanSalesMessage(message, phase, template);
    message = formatSalesMessageLayout(message);
  }

  const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
  return true;
};

