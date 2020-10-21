import { EventEmitter } from "events";

import pino from "pino";
import { OperatorFunction, ReplaySubject, Subject } from "rxjs";
import { scan, first, timeout, catchError, tap } from "rxjs/operators";
import { INTERBYTE_TIMEOUT, MIN_RESPONSE_TIMEOUT } from "./constants";

import { NoResponseTimeout } from "./errors";
import { formatBytes } from "./format-utilities";
import { arrayScan, timeoutBetween } from "./observable-utilities";

// Create pino logger for port utilities
const logger = pino({ name: "flow-meter:port-utilities" });

/**
 * Get the timeout for a given command
 * @param responseTimeMax - Command defined max response time
 * @param minResponseTimeout - Non real time system min response timeout
 * @returns Slave response timeout
 */
const getSlaveResponseTimeout = (
    responseTimeMax: number,
    minResponseTimeout = MIN_RESPONSE_TIMEOUT,
): number => Math.max(2 * responseTimeMax, minResponseTimeout);

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
const timeoutErrorHandler = (startTimestamp: number) => (error: Error): [] => {
    const duration = Date.now() - startTimestamp;
    logger.info("timeout during response collection %s", error.message);
    const errorMessage = `Response not complete after ${duration}ms`;
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
 * @param responseTimeMax - Timeout after which an error is thrown
 * @returns Array including all bytes received
 */
export const collectResponses = (
    bytesReplaySubject: ReplaySubject<number>,
    terminalByte: number,
    responseTimeMax: number,
): Promise<number[]> => {
    const startTimestamp = Date.now();
    const slaveResponseTimeout = getSlaveResponseTimeout(responseTimeMax);
    const responseObservable = bytesReplaySubject.pipe(
        timeout(slaveResponseTimeout),
        timeoutBetween(INTERBYTE_TIMEOUT),
        catchError(timeoutErrorHandler(startTimestamp)),
        arrayScan<number>(),
        tap(bytes => logger.debug("bytes %s", formatBytes(bytes))),
        first(responseComplete(terminalByte)),
        tap(bytes => logger.debug("response %s", formatBytes(bytes))),
    );
    return responseObservable.toPromise();
};
