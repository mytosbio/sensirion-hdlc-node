import SerialPort from "serialport";

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

const path = "/dev/tty.usbserial-FT41NKFH";
const port = new SerialPort(path, { baudRate: 115200 });

const writeHex = (hex) =>
  new Promise((resolve, reject) => {
    port.write(hex, "hex", (error) => {
      if (error) {
        reject(error);
      } else {
        port.flush((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      }
    });
  });

const main = async () => {
  try {
    port.on("open", () => console.log("isOpen", port.isOpen));
    port.on("error", (error) => console.log("error", error));
    port.on("data", (data) => console.log("data", data));
    console.log("Reset chip");
    await writeHex([0x06]);
    console.log("isOpen", port.isOpen);
    await sleep(500);
    console.log("isOpen", port.isOpen);
    console.log("Start measurement");
    await writeHex([0x36, 0x08]);
    await sleep(10000);
  } catch (error) {
    console.log(error);
  }
};

main().then(() => process.exit(0));
