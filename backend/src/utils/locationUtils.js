/**
 * Location utilities for automatic location detection and city name normalization
 */

/**
 * Normalize city name (capitalize first letter, trim whitespace)
 * @param {string} cityName - City name
 * @returns {string} Normalized city name
 */
export function normalizeCityName(cityName) {
  if (!cityName || typeof cityName !== 'string') {
    return null;
  }
  
  return cityName.trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Extract city name from location string
 * Handles formats like "City, State", "City, State, Country", "City"
 * @param {string} location - Location string
 * @returns {string} City name
 */
export function extractCityName(location) {
  if (!location || typeof location !== 'string') {
    return null;
  }

  // If it contains commas, take the first part (city name)
  if (location.includes(',')) {
    return normalizeCityName(location.split(',')[0]);
  }

  return normalizeCityName(location);
}

/**
 * Validate city name
 * @param {string} cityName - City name to validate
 * @returns {boolean} True if valid
 */
export function isValidCityName(cityName) {
  if (!cityName || typeof cityName !== 'string') {
    return false;
  }
  
  // Basic validation: at least 2 characters, only letters, spaces, and common punctuation
  const cityNameRegex = /^[a-zA-Z\s\-'\.]{2,}$/;
  return cityNameRegex.test(cityName.trim());
}

