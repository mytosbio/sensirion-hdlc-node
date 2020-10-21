import { Observable, OperatorFunction, Subscriber, TimeoutError } from "rxjs";

import { scan } from "rxjs/operators";

/**
 * Safely clear a timeout
 * @param timeout - Node timeout identifer
 */
const clearTimeoutSafe = (timeout: null | NodeJS.Timeout): void =>
    timeout ? clearTimeout(timeout) : undefined;

/**
 * Create an operator function to collect array values.
 * This operator function will emit the array for every new element
 */
export const arrayScan = <T>(): OperatorFunction<T, T[]> =>
    scan<T, T[]>((acc, curr) => [...acc, curr], []);

/**
 * Operator to throw error if long delay between emissions
 * @param allowedDelay - Allowed time between each message
 */
export const timeoutBetween = <T>(
    allowedDelay: number,
): OperatorFunction<T, T> => (source: Observable<T>): Observable<T> => {
    let timeout: NodeJS.Timeout;
    const destination = new Observable((subscriber: Subscriber<T>) => {
        const subscription = source.subscribe({
            /**
             * Handle next value in source observable
             * @param value - Value to pass to subscriber
             */
            next(value: T): void {
                subscriber.next(value);
                clearTimeoutSafe(timeout);
                timeout = setTimeout(
                    () => subscriber.error(new TimeoutError()),
                    allowedDelay,
                );
            },
            /**
             * Handle error in source observable
             * @param error - Error object to pass to subscriber
             */
            error(error: Error): void {
                clearTimeoutSafe(timeout);
                subscriber.error(error);
            },
            /**
             * Handle complete from source
             */
            complete(): void {
                clearTimeoutSafe(timeout);
                subscriber.complete();
            },
        });
        return {
            /**
             * Unsubscribe from source when destination subscriber unsubscribes
             */
            unsubscribe(): void {
                subscription.unsubscribe();
            },
        };
    });
    return destination;
};
