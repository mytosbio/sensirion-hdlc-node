import pino from "pino";
import NodeSerialPort from "serialport";

import { loadNumber } from "./constants";
import { sleep } from "./async-utilities";
import { SerialPort } from "./port";
import { RetryConnection } from "./connection";
import { FlowMeter } from "./device";
import { clearInterval } from "timers";

export { FlowMeter, RetryConnection, SerialPort };

// Constants used to control testing
const CALCULATION_ARRAY_LENGTH = loadNumber("CALCULATION_ARRAY_LENGTH", 10000);
const GET_MEASUREMENT_INTERVAL = loadNumber("GET_MEASUREMENT_INTERVAL", 1000);

const NUMBER_FLOW_RECORD = loadNumber("NUMBER_FLOW_RECORD", 5);
const RECORD_FLOW_DURATION = loadNumber("RECORD_FLOW_DURATION", 10000);
const INTER_RECORD_DURATION = loadNumber("INTER_RECORD_DURATION", 100);

const logger = pino({ name: "flow-meter:main" });

/**
 * Perform fake expensive processor operation on data from port
 * @param port - Serial port to listen for data from
 */
const mockProcessAllTraffic = (port: NodeSerialPort): void => {
    port.on("data", data => {
        logger.debug("process data %s", data);
        data.forEach((byte: number) => {
            Array(CALCULATION_ARRAY_LENGTH)
                .fill(null)
                .forEach((_, i) => {
                    const exponent = 1 / (i + 1);
                    Math.pow(byte, exponent);
                });
        });
    });
};

/**
 * Run an example to read total flow
 * @param path - Path to sensor device
 */
const testSensorDevice = async (
    sensorPath: string,
    otherSerialPath?: string,
): Promise<void> => {
    const measureInterval = 20;
    logger.info("connect to sensor device at %s", sensorPath);
    const sensorPort = new SerialPort(sensorPath, 115200);
    const sensorConnection = new RetryConnection(sensorPort);
    const sensorDevice = new FlowMeter(sensorConnection);
    const otherSerialPort = otherSerialPath
        ? new NodeSerialPort(otherSerialPath)
        : null;
    if (otherSerialPort) {
        logger.info("connect to other device at %s", otherSerialPath);
        otherSerialPort.on("open", () => logger.info("other device port open"));
        mockProcessAllTraffic(otherSerialPort);
    }
    const interval = setInterval(async () => {
        try {
            await sensorDevice.getCurrentFlowRate();
            await sensorDevice.getTotalVolume();
        } catch (error) {
            logger.error("get last measurement error %s", error.message);
        }
    }, GET_MEASUREMENT_INTERVAL);
    try {
        await sensorPort.open();
        await sensorDevice.init();
        const productName = await sensorDevice.getProductName();
        logger.info("product name = %s", productName);
        const sensorPartName = await sensorDevice.getSensorPartName();
        logger.info("sensor part name = %s", sensorPartName);
        for (const _ of Array(NUMBER_FLOW_RECORD).fill(null)) {
            await sensorDevice.startRecordingVolume(measureInterval);
            logger.info("started recording volume");
            await sleep(RECORD_FLOW_DURATION);
            logger.info("stop recording volume");
            const volume = await sensorDevice.stopRecordingVolume(
                measureInterval,
            );
            logger.info("volume flow = %s", volume);
            await sleep(INTER_RECORD_DURATION);
        }
    } finally {
        clearInterval(interval);
        await sensorPort.close();
        if (otherSerialPort) {
            otherSerialPort.close();
        }
    }
};

/**
 * Run the main testing script to test sensor device
 */
const main = async (): ReturnType<typeof testSensorDevice> => {
    const { ArgumentParser } = await import("argparse");
    const parser = new ArgumentParser();
    parser.add_argument("sensorPath");
    parser.add_argument("otherSerialPath", { nargs: "?" });
    const args = parser.parse_args();
    return testSensorDevice(args.sensorPath, args.otherSerialPath);
};

if (require.main === module) {
    main().catch(error => console.error(error));
}
