import { from, Subject } from "rxjs";
import { timeoutBetween } from "./observable-utilities";

const nextFn = jest.fn();
const errorFn = jest.fn();
const completeFn = jest.fn();

describe("ObservableUtilities", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });
    afterEach(() => {
        jest.resetAllMocks();
    });
    describe("timeoutBetween()", () => {
        test("should not timeout for single item observable", () => {
            const source = from([0]);
            const destination = source.pipe(timeoutBetween(0));
            destination.subscribe(nextFn, errorFn, completeFn);
            expect(nextFn).toHaveBeenCalledTimes(1);
            expect(nextFn).toHaveBeenCalledWith(0);
            expect(errorFn).not.toHaveBeenCalled();
            expect(completeFn).toHaveBeenCalled();
        });
        test("should not timeout when delay between values is less than max", () => {
            const source = new Subject<number>();
            const destination = source.pipe(timeoutBetween(100));
            destination.subscribe(nextFn, errorFn, completeFn);
            source.next(0);
            expect(nextFn).toHaveBeenLastCalledWith(0);
            expect(errorFn).not.toHaveBeenCalled();
            jest.advanceTimersByTime(99);
            source.next(1);
            expect(nextFn).toHaveBeenLastCalledWith(1);
            expect(errorFn).not.toHaveBeenCalled();
            source.complete();
            expect(errorFn).not.toHaveBeenCalled();
            expect(completeFn).toHaveBeenCalled();
        });
        test("should timeout when delay between values is longer than max", () => {
            const source = new Subject<number>();
            const destination = source.pipe(timeoutBetween(100));
            destination.subscribe(nextFn, errorFn, completeFn);
            source.next(0);
            expect(nextFn).toHaveBeenLastCalledWith(0);
            expect(errorFn).not.toHaveBeenCalled();
            jest.advanceTimersByTime(101);
            expect(errorFn).toHaveBeenCalled();
        });
        test("should not share new values after timeout", () => {
            const source = new Subject<number>();
            const destination = source.pipe(timeoutBetween(100));
            destination.subscribe(nextFn, errorFn, completeFn);
            source.next(0);
            expect(nextFn).toHaveBeenLastCalledWith(0);
            expect(errorFn).not.toHaveBeenCalled();
            jest.advanceTimersByTime(101);
            source.next(1);
            expect(nextFn).toHaveBeenCalledTimes(1);
            expect(nextFn).not.toHaveBeenLastCalledWith(1);
            expect(errorFn).toHaveBeenCalled();
        });
        test("should not timeout when lots of values sent", () => {
            const source = new Subject<number>();
            const destination = source.pipe(timeoutBetween(100));
            destination.subscribe(nextFn, errorFn, completeFn);
            for (let i = 0; i < 10; i++) {
                source.next(i);
                jest.advanceTimersByTime(99);
                expect(nextFn).toHaveBeenLastCalledWith(i);
                expect(errorFn).not.toHaveBeenCalled();
            }
            source.complete();
            expect(errorFn).not.toHaveBeenCalled();
            expect(completeFn).toHaveBeenCalled();
        });
    });
});
