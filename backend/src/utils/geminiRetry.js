/**
 * Gemini API retry utility with exponential backoff
 * Handles rate limiting (429 errors) and other transient errors
 */

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract retry delay from error response
 */
function getRetryDelay(error) {
  try {
    if (error.errorDetails) {
      for (const detail of error.errorDetails) {
        if (detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo' && detail.retryDelay) {
          // Parse retry delay (format: "51s" -> 51000ms)
          const delayStr = detail.retryDelay;
          const seconds = parseInt(delayStr.replace('s', ''));
          return seconds * 1000;
        }
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return null;
}

/**
 * Execute a Gemini API call with retry logic
 * @param {Function} apiCall - Async function that makes the API call
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 60000)
 * @param {number} options.backoffMultiplier - Backoff multiplier (default: 2)
 * @returns {Promise<any>} - Result of the API call
 */
export async function withRetry(apiCall, options = {}) {
  const {
    maxRetries = 4,
    initialDelay = 2000,
    maxDelay = 60000,
    backoffMultiplier = 2,
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      // Check if it's a rate limit error (429)
      const isRateLimit = error.status === 429 || 
                         error.message?.includes('429') ||
                         error.message?.includes('quota') ||
                         error.message?.includes('rate limit') ||
                         error.message?.includes('Resource exhausted');

      // Check if it's a retryable error
      const isRetryable = isRateLimit || 
                         (error.status >= 500 && error.status < 600) ||
                         error.message?.includes('timeout') ||
                         error.message?.includes('fetch');

      // Don't retry on last attempt or non-retryable errors
      if (attempt >= maxRetries || !isRetryable) {
        throw error;
      }

      // Get retry delay from error response if available
      let retryDelay = getRetryDelay(error);
      
      // If it's a rate limit, increase the delay significantly
      if (isRateLimit && !retryDelay) {
        retryDelay = delay * 1.5; // More aggressive delay for rate limits
      } else if (!retryDelay) {
        retryDelay = delay;
      }

      // Add jitter to avoid thundering herd
      retryDelay = retryDelay + Math.random() * 2000;

      // Cap the delay at maxDelay
      retryDelay = Math.min(retryDelay, maxDelay);

      console.warn(
        `⚠️ Gemini API error (attempt ${attempt + 1}/${maxRetries}): ${error.message || error.statusText || 'Unknown error'}. ` +
        `Retrying in ${Math.round(retryDelay / 1000)}s...`
      );

      await sleep(retryDelay);

      // Exponential backoff for next attempt
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}


