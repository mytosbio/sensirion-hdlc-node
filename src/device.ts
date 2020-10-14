import pino from "pino";
import { sleep } from "./async-utilities";

import { Connection } from "./connection";
import { MILLISECONDS_PER_MINUTE } from "./constants";
import { parseSignedIntegerBytes } from "./data-utilities";
import { formatBytes } from "./format-utilities";
import { RequestFrameData } from "./message-frame";

const logger = pino({ name: "flow-meter:device" });

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
     * Make a device request and parse response
     * @param commandId - Command id
     * @param commandData - Command data
     * @param responseTimeout - Response timeout
     * @returns Parsed command data
     */
    protected async makeRequest(
        commandId: number,
        commandData: number[],
        responseTimeout: number,
    ): Promise<number[]> {
        const slaveAddress = this.slaveAddress;
        const requestData: RequestFrameData = {
            slaveAddress,
            commandId,
            commandData,
        };
        const responseData = await this.connection.transceive(
            requestData,
            responseTimeout,
        );
        return responseData.commandData;
    }
    /**
     * Get the name of the product
     */
    async getProductName(): Promise<string> {
        const commandData = await this.makeRequest(0xd0, [0x01], 100);
        return Buffer.from(commandData).toString("ascii");
    }
}

/**
 * SF06 Flow Meter
 */
export class FlowMeter extends Device {
    /**
     * Device specific scale factor
     */
    scaleFactor = 500;
    /**
     * Get sensor part name
     */
    async getSensorPartName(): Promise<string> {
        const commandData = await this.makeRequest(0x50, [], 3);
        return Buffer.from(commandData).toString("ascii");
    }
    /**
     * Set the totalizer status to enabled or disabled
     * @param status - Boolean status of totalizer
     */
    async setTotalizatorStatus(status: boolean): Promise<void> {
        const commandData = [status ? 0x1 : 0x0];
        await this.makeRequest(0x37, commandData, 1);
    }
    /**
     * Reset the internal totalizer sum
     */
    async resetTotalizator(): Promise<void> {
        await this.makeRequest(0x39, [], 1);
    }
    /**
     * Start continuous measurements at the given interval
     * @param interval - Interval between measurements
     */
    async startContinuousMeasurement(interval: number): Promise<void> {
        const buffer = Buffer.alloc(2);
        buffer.writeUIntBE(interval, 0, 2);
        const commandData = [...buffer, 0x36, 0x08];
        await this.makeRequest(0x33, commandData, 1);
    }
    /**
     * Stop continuous measurements
     */
    async stopContinuousMeasurement(): Promise<void> {
        await this.makeRequest(0x34, [], 1);
    }
    /**
     * Get value of totalizer
     */
    async getLastMeasurement(): Promise<number> {
        const commandData = await this.makeRequest(0x35, [], 1);
        logger.debug("last measurement data %s", formatBytes(commandData));
        const lastMeasurement = parseSignedIntegerBytes(commandData);
        logger.info("last measurement = %s", lastMeasurement);
        return lastMeasurement;
    }
    /**
     * Get value of totalizer
     */
    async getTotalizatorValue(): Promise<number> {
        const commandData = await this.makeRequest(0x38, [], 1);
        logger.debug("totalizer value data %s", formatBytes(commandData));
        const totalizerValue = parseSignedIntegerBytes(commandData);
        logger.info("totalizer value = %s", totalizerValue);
        return totalizerValue;
    }
    /**
     * Initialize the flow meter and set sensor type
     */
    async init(): Promise<void> {
        logger.info("device reset");
        await this.makeRequest(0xd3, [], 250);
        logger.info("wait for device reboot");
        await sleep(100);
        logger.info("set sensor type");
        await this.makeRequest(0x24, [0x03], 25);
        logger.info("get scale factor and unit");
        const mlPerMin = 8 * 256 + 4 * 16 + 5;
        logger.info("target scale factor %s", mlPerMin.toString(16));
        const scaleFactorUnit = await this.makeRequest(0x53, [0, 0], 1);
        logger.info("scale factor %s", formatBytes(scaleFactorUnit));
    }
    /**
     * Start recording volume flow
     * @param interval - Interval in milliseconds between measurements
     */
    async startRecordingVolume(interval = 20): Promise<void> {
        logger.debug("set totalizator status");
        await this.setTotalizatorStatus(true);
        logger.debug("reset totalizator");
        await this.resetTotalizator();
        logger.debug("start continuous measurement");
        await this.startContinuousMeasurement(interval);
        logger.info("started recording volume");
    }
    /**
     * Get current flow rate
     */
    async getCurrentFlowRate(): Promise<number> {
        const lastMeasurement = await this.getLastMeasurement();
        const flowRate = lastMeasurement / this.scaleFactor;
        logger.info("flow rate = %s", flowRate);
        return flowRate;
    }
    /**
     * Get total volume from totalizer
     * @param interval - Read interval in milliseconds
     */
    async getTotalVolume(interval = 20): Promise<number> {
        logger.debug("get totalizator value");
        const totalTicks = await this.getTotalizatorValue();
        logger.debug("total ticks %s", totalTicks);
        const samplingTime = interval / MILLISECONDS_PER_MINUTE;
        logger.debug("sampling time %s", samplingTime);
        const interimFlow = totalTicks / this.scaleFactor;
        logger.debug("interim flow %s", interimFlow);
        const volume = interimFlow * samplingTime;
        logger.info("total volume = %s", volume);
        return volume;
    }
    /**
     * Stop recording the volume flow
     * @param interval - Interval in milliseconds between measurements
     */
    async stopRecordingVolume(interval = 20): Promise<number> {
        logger.debug("stop continuous measurement");
        await this.stopContinuousMeasurement();
        const volume = await this.getTotalVolume(interval);
        logger.info("stopped recording volume");
        return volume;
    }
}
