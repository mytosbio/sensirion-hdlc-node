import { ChecksumInvalid } from "./errors";

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
 * Calculate the checksum for an encoded frame
 * @param encoded - Encoded frame to calculate checksum for
 * @returns Calculated checksum
 */
export const __calculateChecksum = (encoded: number[]): number => {
    const sum = encoded.reduce((sum: number, byte: number) => sum + byte, 0);
    const leastSignificantByte = sum & 0xff;
    return leastSignificantByte ^ 0xff;
};

/**
 * Encode a frame with escape characters
 * @param frame - Unencoded frame of bytes
 * @returns Encoded bytes
 */
export const encodeFrame = (frame: number[]): number[] => {
    const checksum = __calculateChecksum(frame);
    const data = [...frame, checksum];
    const escapedBytes = Array<number>().concat(
        ...data.map(byte =>
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
export const decodeFrame = (received: number[]): number[] => {
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
    const data = decoded.slice(0, -1);
    const checksum = decoded[data.length];
    if (checksum !== __calculateChecksum(data)) {
        throw new ChecksumInvalid("Checksum invalid when decoding message");
    }
    return decoded;
};
