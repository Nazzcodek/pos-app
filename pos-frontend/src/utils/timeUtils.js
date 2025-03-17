/**
 * Returns current time in ISO format matching server's UTC+1 timezone
 * This ensures timestamp compatibility with the server
 */
export const current_time_iso = () => {
  const now = new Date();
  return now.toISOString();
};

/**
 * Formats a timestamp for display in UTC+1 (Africa/Lagos) timezone
 */
export const formatLocalTime = (isoString) => {
  const date = new Date(isoString);
  // Format as local time, which will be interpreted as UTC+1 by the server
  return date.toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};
