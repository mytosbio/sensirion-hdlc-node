import { Port } from "./port";
import { Connection, RetryConnection } from "./connection";
import { RequestFrameData } from "./message-frame";
import {
    ChecksumInvalid,
    CommandIdMismatch,
    NoResponseTimeout,
    PortBusy,
    SlaveAddressMismatch,
    SlaveStateError,
} from "./errors";
import { runAllTimersRecursive } from "./testing-utilities";
import { NO_ERROR_STATE, RESEND_COMMAND_ID } from "./constants";

describe("RetryConnection", () => {
    let connection: Connection;
    const mockTransceive = jest.fn();
    const mockPort: Port = {
        open: jest.fn(),
        close: jest.fn(),
        transceive: mockTransceive,
    };
    beforeEach(() => {
        jest.useFakeTimers();
        connection = new RetryConnection(mockPort);
        Object.values(mockPort).forEach(fn => fn.mockReset());
    });
    describe(".transceive()", () => {
        const slaveAddress = 0x01;
        const commandId = 0x02;
        const requestData: RequestFrameData = {
            slaveAddress,
            commandId,
            commandData: [],
        };
        const requestTimeout = 100;
        test("should send frame to port", async () => {
            mockTransceive.mockResolvedValue([
                slaveAddress,
                commandId,
                NO_ERROR_STATE,
                0x00,
            ]);
            const responseData = await connection.transceive(
                requestData,
                requestTimeout,
            );
            expect(responseData.commandId).toEqual(commandId);
            expect(responseData.slaveState).toEqual(NO_ERROR_STATE);
            expect(responseData.commandData).toEqual([]);
        });
        test("should fail when different slave address returned", async () => {
            mockTransceive.mockResolvedValue([
                slaveAddress ^ 0b1,
                commandId,
                NO_ERROR_STATE,
                0x00,
            ]);
            const promise = connection.transceive(requestData, requestTimeout);
            await runAllTimersRecursive(3);
            await expect(promise).rejects.toBeInstanceOf(SlaveAddressMismatch);
        });
        test("should fail when different command id returned", async () => {
            mockTransceive.mockResolvedValue([
                slaveAddress,
                commandId ^ 0b1,
                NO_ERROR_STATE,
                0x00,
            ]);
            const promise = connection.transceive(requestData, requestTimeout);
            await runAllTimersRecursive(3);
            await expect(promise).rejects.toBeInstanceOf(CommandIdMismatch);
        });
        test("should resend special command after checksum error", async () => {
            mockTransceive.mockRejectedValueOnce(new ChecksumInvalid(""));
            mockTransceive.mockResolvedValueOnce([
                slaveAddress,
                commandId,
                NO_ERROR_STATE,
                0x00,
            ]);
            const promise = connection.transceive(requestData, requestTimeout);
            await runAllTimersRecursive(2);
            await expect(promise).resolves.toEqual(
                expect.objectContaining({
                    slaveAddress,
                    commandId,
                }),
            );
            expect(mockTransceive).toHaveBeenNthCalledWith(
                1,
                [slaveAddress, commandId, 0x00],
                requestTimeout,
            );
            expect(mockTransceive).toHaveBeenNthCalledWith(
                2,
                [slaveAddress, RESEND_COMMAND_ID, 0x00],
                requestTimeout,
            );
        });
        test("should succeed after multiple port errors", async () => {
            mockTransceive.mockRejectedValueOnce(new PortBusy(""));
            mockTransceive.mockRejectedValueOnce(new NoResponseTimeout(""));
            mockTransceive.mockResolvedValueOnce([
                slaveAddress,
                commandId,
                NO_ERROR_STATE,
                0x00,
            ]);
            const promise = connection.transceive(requestData, requestTimeout);
            await runAllTimersRecursive(3);
            await expect(promise).resolves.toEqual(
                expect.objectContaining({
                    slaveAddress,
                    commandId,
                }),
            );
            expect(mockTransceive).toHaveBeenCalledTimes(3);
        });
        test("should try again after getting sensor busy error", async () => {
            mockTransceive.mockRejectedValueOnce(new SlaveStateError(0x20));
            mockTransceive.mockResolvedValueOnce([
                slaveAddress,
                commandId,
                NO_ERROR_STATE,
                0x00,
            ]);
            const promise = connection.transceive(requestData, requestTimeout);
            await runAllTimersRecursive(2);
            await expect(promise).resolves.toEqual(
                expect.objectContaining({
                    slaveAddress,
                    commandId,
                }),
            );
            expect(mockTransceive).toHaveBeenCalledTimes(2);
        });
        test("should fail with no response timeout when after multi fail", async () => {
            mockTransceive.mockRejectedValue(new NoResponseTimeout("timeout"));
            const promise = connection.transceive(requestData, requestTimeout);
            await runAllTimersRecursive();
            await expect(promise).rejects.toBeInstanceOf(NoResponseTimeout);
            expect(mockTransceive).toHaveBeenCalledTimes(3);
        });
    });
});
