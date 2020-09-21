const START_BYTE = 0x7e;
const STOP_BYTE = 0x7e;
const ESCAPE_BYTE = 0x7d;

const SPECIAL_BYTES = [0x7e, 0x7d, 0x11, 0x13];

/**
 * Escape a special byte by adding escape bit flipping bit 5
 * @param byte - Special byte which should be transformed
 * @returns Byte with bit 5 flipped
 */
export const __escapeByte = (byte: number): number => 0b100000 ^ byte;

/**
 * Encode a frame with escape characters
 * @param frame - Unencoded frame of bytes
 * @returns Encoded bytes
 */
export const encode = (frame: number[]): number[] => {
    const escapedBytes = Array<number>().concat(
        ...frame.map(byte =>
            SPECIAL_BYTES.includes(byte)
                ? [ESCAPE_BYTE, __escapeByte(byte)]
                : [byte],
        ),
    );
    return [START_BYTE, ...escapedBytes, STOP_BYTE];
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
