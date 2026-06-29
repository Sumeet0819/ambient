import { Platform } from 'react-native';

export function formatCurrency(amount: number, currencyCode: string = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    // Fallback if Intl fails
    const symbol = currencyCode === 'INR' ? '₹' : currencyCode === 'USD' ? '$' : currencyCode;
    return `${symbol}${amount.toFixed(2)}`;
  }
}

export function getCurrencySymbol(currencyCode: string = 'USD') {
  try {
    const parts = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
    }).formatToParts(0);
    const currencyPart = parts.find(part => part.type === 'currency');
    return currencyPart ? currencyPart.value : currencyCode;
  } catch (e) {
    return currencyCode === 'INR' ? '₹' : currencyCode === 'USD' ? '$' : currencyCode;
  }
}
