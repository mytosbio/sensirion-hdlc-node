import { Device } from "./device";

describe("Device", () => {
    let device: Device;
    const slaveAddress = 0x12;
    const mockTransceive = jest.fn();
    const mockConnection = { transceive: mockTransceive };
    beforeEach(() => {
        device = new Device(mockConnection, slaveAddress);
    });
    describe(".getProductName()", () => {
        test("should decode product name from device", async () => {
            const commandData = Buffer.from("name", "ascii").valueOf();
            mockTransceive.mockResolvedValue({ commandData });
            const productName = await device.getProductName();
            expect(productName).toEqual("name");
        });
    });
});
