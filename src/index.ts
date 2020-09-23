import pino from "pino";

import { sleep } from "./async-utilities";
import { SerialPort } from "./port";
import { RetryConnection } from "./connection";
import { FlowMeter } from "./device";

const logger = pino({ name: "flow-meter:main" });

/**
 * Run an example to read total flow
 * @param path - Path to sensor device
 */
const main = async (path = "/dev/tty.usbserial-FT41NKFH"): Promise<void> => {
    logger.info("connect to device at %s", path);
    const port = new SerialPort(path, 115200);
    const connection = new RetryConnection(port);
    const device = new FlowMeter(connection);
    const measurementInterval = 20;
    try {
        await port.open();
        const productName = await device.getProductName();
        logger.info("product name = %s", productName);
        await device.init();
        await device.startRecordingVolume(measurementInterval);
        logger.info("started recording volume");
        for (const _ of Array(10).fill(null)) {
            const lastMeasurement = await device.getLastMeasurement();
            logger.info("last measurement = %s", lastMeasurement);
            await sleep(1000);
        }
        logger.info("stop recording volume");
        const volume = await device.stopRecordingVolume(measurementInterval);
        logger.info("volume flow = %s", volume);
    } finally {
        await port.close();
    }
};

if (require.main === module) {
    main(...process.argv.slice(2)).catch(error => console.error(error));
}
