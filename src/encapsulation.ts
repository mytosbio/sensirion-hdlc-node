const START_BYTE = 0x7e;
const STOP_BYTE = 0x7e;
const ESCAPE_BYTE = 0x7d;

const SPECIAL_BYTES = [0x7e, 0x7d, 0x11, 0x13];

/**
 * Flip the given bit of the provided byte
 * @param byte - Special byte which should be transformed
 * @param bit - Bit number to flip
 * @returns Byte with bit 5 flipped
 */
export const __flipBit = (byte: number, bit = 5): number => (1 << bit) ^ byte;

/**
 * Encode a frame with escape characters
 * @param frame - Unencoded frame of bytes
 * @returns Encoded bytes
 */
export const encode = (frame: number[]): number[] => {
    const escapedBytes = Array<number>().concat(
        ...frame.map(byte =>
            SPECIAL_BYTES.includes(byte)
                ? [ESCAPE_BYTE, __flipBit(byte)]
                : [byte],
        ),
    );
    return [START_BYTE, ...escapedBytes, STOP_BYTE];
};

/**
 * Decode a frame by removing escape characters
 * @param received - Raw received bytes to decode
 * @returns Decoded bytes
 */
export const decode = (received: number[]): number[] => {
    const decoded = [];
    let wasEscaped = false;
    const lastIndex = received.length - 1;
    for (let i = 0; i < received.length; i++) {
        if (received[i] == START_BYTE && i == 0) {
            continue;
        } else if (received[i] == STOP_BYTE && i == lastIndex) {
            break;
        } else if (received[i] == ESCAPE_BYTE) {
            wasEscaped = true;
        } else if (wasEscaped) {
            decoded.push(__flipBit(received[i]));
            wasEscaped = false;
        } else {
            decoded.push(received[i]);
        }
    }
    return decoded;
};

/**
 * Calculate the checksum for an encoded frame
 * @param encoded - Encoded frame to calculate checksum for
 * @returns Calculated checksum
 */
export const calculateChecksum = (encoded: number[]): number[] => {
    return [];
};
