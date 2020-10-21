import { EventEmitter } from "events";
import { ReplaySubject, Subject } from "rxjs";

import {
    createBytesSubject,
    storeBytes,
    collectResponses,
} from "./port-utilities";
import { NoResponseTimeout } from "./errors";
import { sleep } from "./async-utilities";
import { INTERBYTE_TIMEOUT, MIN_RESPONSE_TIMEOUT } from "./constants";

describe("PortUtilities", () => {
    describe("createBytesSubject()", () => {
        test("should emit individual bytes", async () => {
            const eventEmitter = new EventEmitter();
            const bytesSubject = createBytesSubject(eventEmitter);
            const subscriber = jest.fn();
            bytesSubject.subscribe(subscriber);
            eventEmitter.emit("data", Buffer.from([0x1, 0x2]));
            eventEmitter.emit("data", Buffer.from([0x3, 0x4]));
            await new Promise(resolve => process.nextTick(resolve));
            expect(subscriber).nthCalledWith(1, 0x1);
            expect(subscriber).nthCalledWith(2, 0x2);
            expect(subscriber).nthCalledWith(3, 0x3);
            expect(subscriber).nthCalledWith(4, 0x4);
        });
    });
    describe("storeBytes()", () => {
        const mockObserver = jest.fn();
        let subject: Subject<number>;
        beforeEach(() => {
            subject = new Subject<number>();
            mockObserver.mockReset();
        });
        test("should not replay bytes sent before", async () => {
            subject.next(0xaa);
            const replaySubject = storeBytes(subject);
            replaySubject.subscribe(mockObserver);
            expect(mockObserver).toBeCalledTimes(0);
        });
        test("should replay bytes sent after store", async () => {
            const replaySubject = storeBytes(subject);
            subject.next(0xab);
            replaySubject.subscribe(mockObserver);
            expect(mockObserver).toBeCalledTimes(1);
            expect(mockObserver).toBeCalledWith(0xab);
        });
        test("should replay bytes sent after store and after subscribe", async () => {
            const replaySubject = storeBytes(subject);
            subject.next(0xab);
            replaySubject.subscribe(mockObserver);
            subject.next(0xac);
            expect(mockObserver).toBeCalledTimes(2);
            expect(mockObserver).toHaveBeenNthCalledWith(1, 0xab);
            expect(mockObserver).toHaveBeenNthCalledWith(2, 0xac);
        });
    });
    describe("collectResponses()", () => {
        const terminal = 0xaa;
        let replaySubject: ReplaySubject<number>;
        beforeEach(() => {
            replaySubject = new ReplaySubject<number>();
        });
        test("should timeout if nothing received", async () => {
            const promise = collectResponses(replaySubject, terminal, 100);
            await expect(promise).rejects.toBeInstanceOf(NoResponseTimeout);
        });
        test("should timeout if only start byte", async () => {
            const promise = collectResponses(replaySubject, terminal, 100);
            replaySubject.next(terminal);
            await expect(promise).rejects.toBeInstanceOf(NoResponseTimeout);
        });
        test("should timeout if long delay between start and end", async () => {
            const promise = collectResponses(replaySubject, terminal, 100);
            promise.catch(() => null);
            replaySubject.next(terminal);
            await sleep(INTERBYTE_TIMEOUT + 10);
            replaySubject.next(terminal);
            await expect(promise).rejects.toBeInstanceOf(NoResponseTimeout);
        });
        test("should return array including all bytes received after collection", async () => {
            const promise = collectResponses(replaySubject, terminal, 100);
            replaySubject.next(terminal);
            replaySubject.next(0xab);
            replaySubject.next(terminal);
            await expect(promise).resolves.toEqual([terminal, 0xab, terminal]);
        });
        test("should return array including all bytes received before collection", async () => {
            replaySubject.next(terminal);
            replaySubject.next(0xcd);
            replaySubject.next(terminal);
            const promise = collectResponses(replaySubject, terminal, 100);
            await expect(promise).resolves.toEqual([terminal, 0xcd, terminal]);
        });
        test("should return array when delay between byte transmission", async () => {
            const promise = collectResponses(replaySubject, terminal, 100);
            await sleep(MIN_RESPONSE_TIMEOUT - 10);
            replaySubject.next(terminal);
            await sleep(INTERBYTE_TIMEOUT - 10);
            replaySubject.next(0xab);
            await sleep(INTERBYTE_TIMEOUT - 10);
            replaySubject.next(0xcd);
            await sleep(INTERBYTE_TIMEOUT - 10);
            replaySubject.next(terminal);
            await expect(promise).resolves.toEqual([
                terminal,
                0xab,
                0xcd,
                terminal,
            ]);
        });
    });
});
