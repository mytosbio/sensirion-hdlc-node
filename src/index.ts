import { SerialPort } from "./port";
import { RetryConnection } from "./connection";
import { Device } from "./device";

/**
 *
 */
const main = async (): Promise<void> => {
    const port = new SerialPort("/dev/tty.usbserial-FT41NKFH", 115200);
    const connection = new RetryConnection(port);
    const device = new Device(connection);

    try {
        await port.open();
        const productName = await device.getProductName();
        console.log("productName", productName);
    } finally {
        await port.close();
    }
};

main().catch(error => console.error(error));
