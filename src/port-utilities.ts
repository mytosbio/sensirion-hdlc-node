import { EventEmitter } from "events";

import pino from "pino";
import { OperatorFunction, ReplaySubject, Subject } from "rxjs";
import { scan, first, timeout, catchError, tap } from "rxjs/operators";

import { NoResponseTimeout } from "./errors";

// Create pino logger which is disabled in testing
const logger = pino({ enabled: process.env.NODE_ENV !== "test" });

/**
 * Format bytes for logging
 * @param bytes - Array of bytes
 * @param radix - Base for string formatting
 * @returns Formatted bytes as strings
 */
const formatBytes = (bytes: number[], radix = 16): string => {
    const prefixes = { 2: "0b", 16: "0x" };
    const prefix = prefixes[radix as keyof typeof prefixes] || "";
    const formatted = bytes.map(byte => `${prefix}${byte.toString(radix)}`);
    return formatted.join(" ");
};
/**
 * Create an operator function to collect array values.
 * This operator function will emit the array for every new element
 */
const arrayScan = <T>(): OperatorFunction<T, T[]> =>
    scan<T, T[]>((acc, curr) => [...acc, curr], []);

/**
 * Create a predicate function to check if the response is complete
 * @param terminalByte - Byte which signifies the start or stop
 */
const responseComplete = (terminalByte: number) => (bytes: number[]): boolean =>
    bytes.length > 1 && bytes[bytes.length - 1] === terminalByte;

/**
 * Create an error handler for a response timeout
 * @param responseTimeout - Timeout in milliseconds after which request fails
 */
const timeoutErrorHandler = (responseTimeout: number) => (error: Error) => {
    logger.info("timeout during response collection %s", error.message);
    const errorMessage = `Response not complete after ${responseTimeout}`;
    throw new NoResponseTimeout(errorMessage);
};

/**
 * Create a subject from an even emitter
 * @param eventEmitter - Event emitter to register to events from
 * @param eventName - Name of event to listen for buffer data from
 * @returns Subject which can be subscribed to for events
 */
export const createBytesSubject = (
    eventEmitter: EventEmitter,
    eventName = "data",
): Subject<number> => {
    const subject = new Subject<number>();
    eventEmitter.on(eventName, (chunk: Buffer) => {
        if (chunk) {
            chunk.forEach((byte: number) => subject.next(byte));
        }
    });
    return subject;
};

/**
 * Create a replay subject to store bytes from a source
 * @param bytesSubject - Subject which emits bytes
 * @returns Bytes subject which stores all messages
 */
export const storeBytes = (
    bytesSubject: Subject<number>,
): ReplaySubject<number> => {
    const bytesReplaySubject = new ReplaySubject<number>();
    bytesSubject.subscribe(bytesReplaySubject);
    return bytesReplaySubject;
};

/**
 * Collect responses and return an array or bytes
 * @param bytesReplaySubject - Subject of bytes received
 * @param terminalByte - Byte which signifies the start or end
 * @param timeoutMilliseconds - Timeout after which an error is thrown
 * @returns Array including all bytes received
 */
export const collectResponses = (
    bytesReplaySubject: ReplaySubject<number>,
    terminalByte: number,
    responseTimeout: number,
): Promise<number[]> => {
    const responseObservable = bytesReplaySubject.pipe(
        arrayScan<number>(),
        tap(bytes => logger.debug("bytes %s", formatBytes(bytes))),
        first(responseComplete(terminalByte)),
        tap(bytes => logger.info("response %s", formatBytes(bytes))),
        timeout(responseTimeout),
        catchError(timeoutErrorHandler(responseTimeout)),
    );
    return responseObservable.toPromise();
};
