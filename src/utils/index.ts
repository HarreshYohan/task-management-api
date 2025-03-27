/**
 * Validate UUID format
 * @param id string to validate
 * @returns boolean indicating if string is a valid UUID
 */
export const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Format date to ISO string
 * @param date Date object or string
 * @returns ISO formatted date string
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString();
};

/**
 * Generate TTL timestamp for DynamoDB
 * @param ttlInSeconds TTL in seconds
 * @returns Unix timestamp for the expiration time
 */
export const generateTTL = (ttlInSeconds: number): number => {
  return Math.floor(Date.now() / 1000) + ttlInSeconds;
};

/**
 * Extract file key from S3 URL
 * @param url S3 URL
 * @returns File key
 */
export const extractFileKeyFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    return pathSegments[pathSegments.length - 1] || null;
  } catch (error) {
    return null;
  }
};
