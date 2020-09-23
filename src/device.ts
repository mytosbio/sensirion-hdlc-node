import { Connection } from "./connection";
import { RequestFrameData } from "./message-frame";

/**
 * Device represents a Sensirion sensor
 */
export class Device {
    private connection: Connection;
    private slaveAddress: number;
    /**
     * Create a new device which uses a connection
     * @param connection - Connection use to communicate
     * @param slaveAddress - Address of device
     */
    constructor(connection: Connection, slaveAddress = 0x00) {
        this.connection = connection;
        this.slaveAddress = slaveAddress;
    }
    /**
     * Get the name of the product
     */
    async getProductName(): Promise<string> {
        const requestData: RequestFrameData = {
            slaveAddress: this.slaveAddress,
            commandId: 0xd0,
            commandData: [0x01],
        };
        const responseTimeout = 100;
        const { commandData } = await this.connection.transceive(
            requestData,
            responseTimeout,
        );
        return Buffer.from(commandData).toString("ascii");
    }
}
