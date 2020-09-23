/**
 * Format bytes for logging
 * @param bytes - Array of bytes
 * @param radix - Base for string formatting
 * @returns Formatted bytes as strings
 */
export const formatBytes = (bytes: number[], radix = 16): string => {
    const prefixes = { 2: "0b", 16: "0x" };
    const prefix = prefixes[radix as keyof typeof prefixes] || "";
    const formatted = bytes.map(byte => `${prefix}${byte.toString(radix)}`);
    return formatted.join(" ");
};
