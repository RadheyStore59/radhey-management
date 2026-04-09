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

const fillTemplate = (template: string, vars: Record<string, string>) =>
  template
    .replace(/\{\{customerName\}\}/g, vars.customerName || '')
    .replace(/\{\{orderId\}\}/g, vars.orderId || '')
    .replace(/\{\{productName\}\}/g, vars.productName || '')
    .replace(/\{\{phase\}\}/g, vars.phase || '')
    .replace(/\{\{phaseMessage\}\}/g, vars.phaseMessage || '')
    .replace(/\{\{phone\}\}/g, vars.phone || '');

const getPhaseMessage = (phase?: string) => {
  const value = (phase || '').toLowerCase().trim();
  if (value === 'order taken') return 'Your order has been received successfully.';
  if (value === 'in process') return 'Your order is currently in process.';
  if (value === 'order ready') return 'Great news! Your order is ready.';
  if (value === 'dispatched') return 'Your order has been dispatched.';
  if (value === 'delivered') return 'Your order has been delivered successfully.';
  return 'Your order status has been updated.';
};

const ensureSalesPhaseDynamic = (message: string, phase?: string) => {
  const finalPhase = phase || 'Order Taken';
  const phaseMessage = getPhaseMessage(finalPhase);
  const hasPhaseInfo =
    message.includes('{{phase}}') ||
    message.includes('{{phaseMessage}}');

  if (hasPhaseInfo) return message;

  return `${message}\n${phaseMessage}`;
};

const formatSalesMessageLayout = (message: string) => {
  let formatted = message.replace(/\r\n/g, '\n').trim();

  // If user saved a one-line template, make it readable in WhatsApp.
  if (!formatted.includes('\n')) {
    formatted = formatted
      .replace(/\s+Product:/i, '\nProduct:')
      .replace(/\s+Thank you for choosing/i, '\n\nThank you for choosing');
  }

  return formatted.replace(/Radhey Management/gi, 'Radhey Personlized Gifts');
};

const cleanSalesMessage = (message: string, phase?: string) => {
  let cleaned = message;
  const phaseMessage = getPhaseMessage(phase || 'Order Taken');

  // Remove explicit "Status: ..." text even if user template has it.
  cleaned = cleaned.replace(/\s*Status:\s*[^\n]+/gi, '');

  // Remove duplicate phase sentence (keep first occurrence).
  const escaped = phaseMessage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const phaseRegex = new RegExp(escaped, 'gi');
  let seen = false;
  cleaned = cleaned.replace(phaseRegex, (match) => {
    if (seen) return '';
    seen = true;
    return match;
  });

  // Normalize extra spaces/newlines created by cleanup.
  cleaned = cleaned
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/  +/g, ' ')
    .trim();

  return cleaned;
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
  });
  if (module === 'sales') {
    message = ensureSalesPhaseDynamic(message, phase);
    message = formatSalesMessageLayout(message);
    message = cleanSalesMessage(message, phase);
  }

  const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
  return true;
};

