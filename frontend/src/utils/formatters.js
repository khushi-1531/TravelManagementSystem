/**
 * Formatting helpers for TravelSphere
 */

export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Contact for price';
  }
  const num = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(num);
};

export const formatDuration = (days, nights) => {
  if (!days && !nights) return 'Flexible';
  if (days && nights) return `${days} Days / ${nights} Nights`;
  if (days) return `${days} Days`;
  return `${nights} Nights`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
};
