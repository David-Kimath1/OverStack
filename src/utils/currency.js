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

export function formatCurrency(amount, currency = 'KSh') {
  const n = Number(amount) || 0
  const rounded = Math.round(n)
  const withCommas = rounded.toLocaleString('en-US')
  return `${currencySymbol(currency)} ${withCommas}`
}

export function formatSignedCurrency(amount, currency = 'KSh') {
  const n = Number(amount) || 0
  const sign = n >= 0 ? '+' : '-'
  return `${sign}${formatCurrency(Math.abs(n), currency)}`
}

export function parseAmount(input) {
  if (input == null) return NaN
  const cleaned = String(input).replace(/[,\s]/g, '')
  if (cleaned === '') return NaN
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : NaN
}
