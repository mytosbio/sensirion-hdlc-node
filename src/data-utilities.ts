/**
 * Parse bytes which represent an unsigned integer
 * @param bytes - Array of bytes encoding an unsigned integer
 */
export const parseUnsignedIntegerBytes = (bytes: number[]): number =>
    bytes.length <= 6
        ? Buffer.from(bytes).readUIntBE(0, bytes.length)
        : Number(Buffer.from(bytes).readBigUInt64BE());

/**
 * Parse bytes which represent an signed integer
 * @param bytes - Array of bytes encoding an signed integer
 */
export const parseSignedIntegerBytes = (bytes: number[]): number =>
    bytes.length <= 6
        ? Buffer.from(bytes).readIntBE(0, bytes.length)
        : Number(Buffer.from(bytes).readBigInt64BE());
