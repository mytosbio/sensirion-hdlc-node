import { EventEmitter } from "events";
import { ReplaySubject, Subject } from "rxjs";

import {
    createBytesSubject,
    storeBytes,
    collectResponses,
} from "./port-utilities";
import { NoResponseTimeout } from "./errors";

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
    });
});
