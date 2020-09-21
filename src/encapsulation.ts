/**
 * Encode a frame with escape characters
 * @param frame - Unencoded frame of bytes
 * @returns Encoded bytes
 */
export const encode = (frame: Buffer): Buffer => {
    return Buffer.from("");
};

/**
 * Decode a frame by removing escape characters
 * @param transmitted - Raw transmitted bytes to decode
 * @returns Decoded bytes
 */
export const decode = (transmitted: Buffer): Buffer => {
    return Buffer.from("");
};

/**
 * Calculate the checksum for an encoded frame
 * @param encoded - Encoded frame to calculate checksum for
 * @returns Calculated checksum
 */
export const calculateChecksum = (encoded: Buffer): Buffer => {
    return Buffer.from("");
};
