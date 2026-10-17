const SYMBOLS = {
  KSh: 'KSh',
  USD: '$',
  EUR: '\u20AC',
  GBP: '\u00A3',
  NGN: '\u20A6',
  ZAR: 'R',
  INR: '\u20B9',
  JPY: '\u00A5',
}

export const SUPPORTED_CURRENCIES = Object.keys(SYMBOLS)

export function currencySymbol(currency = 'KSh') {
  return SYMBOLS[currency] || currency
}

/**
 * Formats a raw number or string with commas (e.g., 2000 -> "2,000", 1000000 -> "1,000,000").
 * Great for input fields so users see commas as they type.
 */
export function formatThousands(input) {
  if (input === null || input === undefined || input === '') return ''
  const str = String(input).replace(/,/g, '')
  if (str === '') return ''
  const [int, dec] = str.split('.')
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return dec !== undefined ? `${withCommas}.${dec}` : withCommas
}

/**
 * Format a number as currency without decimals.
 * e.g. 42500 -> "KSh 42,500", 1000000 -> "KSh 1,000,000"
 */
export function formatCurrency(amount, currency = 'KSh') {
  const n = Number(amount) || 0
  const rounded = Math.round(n)
  const withCommas = rounded.toLocaleString('en-US')
  return `${currencySymbol(currency)} ${withCommas}`
}

/**
 * Format with sign, useful for history rows.
 * e.g. 2000 -> "+KSh 2,000"
 */
export function formatSignedCurrency(amount, currency = 'KSh') {
  const n = Number(amount) || 0
  const sign = n >= 0 ? '+' : '-'
  return `${sign}${formatCurrency(Math.abs(n), currency)}`
}

/**
 * Parse a user-entered amount string.
 * Accepts "42500", "42,500", "42500.50".
 */
export function parseAmount(input) {
  if (input == null) return NaN
  const cleaned = String(input).replace(/[,\s]/g, '')
  if (cleaned === '') return NaN
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : NaN
}
