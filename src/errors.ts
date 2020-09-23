/**
 * Incorrect data length
 */
export class IncorrectDataLength extends Error {
    name = "IncorrectDataLength";
}

/**
 * Checksum invalid error
 */
export class ChecksumInvalid extends Error {
    name = "ChecksumInvalid";
}

/**
 *
 */
export class NoResponseTimeout extends Error {
    name = "NoResponseTimeout";
}

/**
 *
 */
export class PortBusy extends Error {
    name = "PortBusy";
}

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
    name = "SlaveAddressMismatch";
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
    name = "CommandIdMismatch";
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

type ErrorCode = keyof typeof ERROR_CODES;

/**
 * Get message for a given slave error code
 * @param errorCode - Numeric error code
 */
const getSlaveStateErrorMessage = (errorCode: ErrorCode): string =>
    ERROR_CODES[errorCode] || "unknown error";

/**
 *
 */
export class SlaveStateError extends Error {
    name = "SlaveStateError";
    /**
     * Create a new slave state error
     * @param errorCode - State of error from sensor
     */
    constructor(errorCode: number) {
        super(getSlaveStateErrorMessage(errorCode as ErrorCode));
    }
}
