/**
 * Load a number from environment variables
 * @param name - Name of environment variable
 * @param defaultValue - Default value of number
 */
const loadNumber = (name: string, defaultValue: number): number =>
    name in process.env ? Number(process.env[name]) : defaultValue;

// Global constants
export const MILLISECONDS_PER_MINUTE = 1000 * 60;

// Configurable constants
export const BASE_TIMEOUT = loadNumber("SENSIRION_BASE_TIMEOUT", 400);
export const MAX_SENSOR_ERRORS = loadNumber("SENSIRION_MAX_SENSOR_ERRORS", 5);
export const RESEND_DELAY_MS = loadNumber("SENSIRION_RESEND_DELAY_MS", 600);

// Encapsulation constants
export const TERMINAL_BYTE = 0x7e;
export const ESCAPE_BYTE = 0x7d;
export const SPECIAL_BYTES = [0x7e, 0x7d, 0x11, 0x13];

// Connection constants
export const NO_ERROR_STATE = 0x00;
export const RESEND_COMMAND_ID = 0xf2;
