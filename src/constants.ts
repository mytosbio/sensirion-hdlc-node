// Port constants
export const BASE_RESPONSE_TIMEOUT = 100;

// Encapsulation constants
export const TERMINAL_BYTE = 0x7e;
export const ESCAPE_BYTE = 0x7d;
export const SPECIAL_BYTES = [0x7e, 0x7d, 0x11, 0x13];

// Connection constants
export const NO_ERROR_STATE = 0x00;
export const RESEND_COMMAND_ID = 0xf2;
export const RESEND_DELAY_MS = 100;
export const MAX_ERRORS = 2;
