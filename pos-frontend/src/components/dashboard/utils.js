// utils/formatters.js

/**
 * Formats a number as Nigerian Naira currency
 * @param {number} value - The number to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  return `₦${parseFloat(value).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Formats a date string to a readable format
 * @param {string} dateString - The date string to format
 * @param {string} locale - The locale to use (default: 'en-NG')
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, locale = "en-NG") => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return dateString;
  }
};
