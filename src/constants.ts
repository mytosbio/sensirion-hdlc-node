/**
 * Load a number from environment variables
 * @param name - Name of environment variable
 * @param defaultValue - Default value of number
 * @param env - Node process environment
 */
export const loadNumber = (
    name: string,
    defaultValue: number,
    env = process.env,
): number => (name in env ? Number(env[name]) : defaultValue);

// Global constants
export const MILLISECONDS_PER_MINUTE = 1000 * 60;

/**
 * Interbyte timeout in milliseconds
 * The interbyte time defines the time between two bytes in the same frame.
 * After reception of a frame byte, the receiver waits for the next frame byte.
 * This time is limited by the interbyte timeout.
 */
export const INTERBYTE_TIMEOUT = 200;

/**
 * Minimum timeout between MOSI frame transfer and reception of MISO frame
 * In non real time systems the slave response time should never be less than
 * 200ms due to possible side delays.
 */
export const MIN_RESPONSE_TIMEOUT = 200;

/**
 * Maximum number of allowed consecutive errors
 */
export const MAX_SENSOR_ERRORS = loadNumber("SENSIRION_MAX_SENSOR_ERRORS", 3);

/**
 * Delay before resending a command in milliseconds
 */
export const RESEND_DELAY = loadNumber("SENSIRION_RESEND_DELAY", 100);

// Encapsulation constants
export const TERMINAL_BYTE = 0x7e;
export const ESCAPE_BYTE = 0x7d;
export const SPECIAL_BYTES = [0x7e, 0x7d, 0x11, 0x13];

// Connection constants
export const NO_ERROR_STATE = 0x00;
export const RESEND_COMMAND_ID = 0xf2;
