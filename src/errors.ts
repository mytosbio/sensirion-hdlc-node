/**
 * Incorrect data length
 */
export class IncorrectDataLength extends Error {}

/**
 * Checksum invalid error
 */
export class ChecksumInvalid extends Error {}

/**
 *
 */
export class NoResponseTimeout extends Error {}

/**
 *
 */
export class PortBusy extends Error {}

/**
 *
 */
class ComparisonError<T> extends Error {
    /**
     *
     * @param message - Message
     * @param expected - Expected
     * @param actual - Actual
     */
    constructor(message: string, expected: T, actual: T) {
        super(`${message} - ${expected} does not match ${actual}`);
    }
}

/**
 *
 */
export class SlaveAddressMismatch extends ComparisonError<number> {
    /**
     *
     * @param expectedAddress - Expected address
     * @param responseAddress - Response address
     */
    constructor(expectedAddress: number, responseAddress: number) {
        super("Slave address mismatch", expectedAddress, responseAddress);
    }
}

/**
 *
 */
export class CommandIdMismatch extends ComparisonError<number> {
    /**
     *
     * @param expectedCommand - Expected command
     * @param responseCommand - Response command
     */
    constructor(expectedCommand: number, responseCommand: number) {
        super("Command id mismatch", expectedCommand, responseCommand);
    }
}

const ERROR_CODES = {
    0x00: "no error",
    0x01: "wrong data size",
    0x02: "unknown command",
    0x03: "no access rights for command",
    0x04: "invalid parameter",
    0x05: "wrong checksum",
    0x20: "sensor busy",
    0x21: "no ack from sensor",
    0x22: "i2c crc false",
    0x23: "sensor timeout",
    0x24: "no measurement started",
};

/**
 *
 */
export class SlaveStateError extends Error {
    /**
     * Create a new slave state error
     * @param errorState - State of error from sensor
     */
    constructor(errorState: number) {
        const errorCodesKey = errorState as keyof typeof ERROR_CODES;
        const message = ERROR_CODES[errorCodesKey] || "unknown error";
        super(message);
    }
}
