import NodeSerialPort, { BaseBinding } from "serialport";

import MockBinding from "@serialport/binding-mock";

import { encodeFrame, decodeFrame, TERMINAL_BYTE } from "./encapsulation";

import { SerialPort } from "./port";
import { NoResponseTimeout, PortBusy } from "./errors";

NodeSerialPort.Binding = (MockBinding as any) as BaseBinding;

const mockEncodeFrame = encodeFrame as jest.Mock<number[], [number[]]>;
const mockDecodeFrame = decodeFrame as jest.Mock<number[], [number[]]>;

jest.mock("./encapsulation");

const PORT_PATH = "/dev/abc";

describe("SerialPort", () => {
    let port: SerialPort;
    beforeEach(() => {
        port = new SerialPort(PORT_PATH, 9600);
    });
    describe(".open()", () => {
        test("should work when mock binding", async () => {
            MockBinding.createPort(PORT_PATH, {});
            await expect(port.open()).resolves.toEqual(undefined);
        });
        test("should not work when no mock binding", async () => {
            await expect(port.open()).rejects.toBeInstanceOf(Error);
        });
    });
    describe(".transceive()", () => {
        let mockBinding: MockBinding;
        const sendData = [0x01, 0x02];
        const emitData = [TERMINAL_BYTE, TERMINAL_BYTE];
        beforeEach(async () => {
            MockBinding.createPort(PORT_PATH, { record: true });
            mockBinding = port.port.binding as any;
            mockEncodeFrame.mockReturnValue(sendData);
            mockDecodeFrame.mockReturnValue([]);
            await port.open();
        });
        afterEach(async () => {
            try {
                await port.close();
            } catch (error) {
                console.debug(error);
            }
        });
        test("should send basic data", async () => {
            const promise = port.transceive(sendData, 100);
            mockBinding.emitData(emitData);
            await expect(promise).resolves.toEqual([]);
            expect(mockEncodeFrame).toBeCalledWith(sendData);
            expect(mockDecodeFrame).toBeCalledWith(emitData);
        });
        test("should timeout if no response", async () => {
            const promise = port.transceive(sendData, 100);
            await expect(promise).rejects.toBeInstanceOf(NoResponseTimeout);
        });
        test("should fail on second send", async () => {
            const p1 = port.transceive(sendData, 100);
            const p2 = port.transceive(sendData, 100);
            mockBinding.emitData(emitData);
            await expect(p1).resolves.toEqual([]);
            await expect(p2).rejects.toBeInstanceOf(PortBusy);
        });
    });
});
