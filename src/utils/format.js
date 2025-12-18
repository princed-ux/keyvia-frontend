export const getCurrencySymbol = (code) => {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'NGN': '₦',
    'CAD': 'C$',
    'AUD': 'A$',
  };
  return symbols[code] || code; // Returns code (e.g., 'GHS') if symbol not found
};

export const formatPrice = (price) => {
  if (!price) return "0";
  return Number(price).toLocaleString();
};