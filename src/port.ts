import NodeSerialPort from "serialport";

import {
    createBytesSubject,
    storeBytes,
    collectResponses,
} from "./port-utilities";
import { encodeFrame, decodeFrame, TERMINAL_BYTE } from "./encapsulation";
import { BehaviorSubject, Subject } from "rxjs";
import { PortBusy } from "./errors";

/**
 * Encoding type for sending bytes
 */
type Encoding = "base64" | "binary" | "hex";

/**
 * Port is an interface with a type of data port
 */
export interface Port {
    open(): Promise<void>;
    close(): Promise<void>;
    transceive(
        requestFrame: number[],
        responseTimeout: number,
    ): Promise<number[]>;
}

/**
 * Serial port is a special type of port using serial
 */
export class SerialPort implements Port {
    /**
     * Internal reference to a node serialport port
     */
    port: NodeSerialPort;
    /**
     * Reader subject used to manage bytes from the serial port
     */
    private reader: Subject<number>;
    /**
     * Behavior subject which records if the port is busy
     */
    private busy: BehaviorSubject<boolean>;
    /**
     * Write bytes to the serial port
     * @param bytes - Array of bytes to write
     * @param encoding - Encoding to write bytes
     */
    private writeBytes = (
        bytes: number[],
        encoding: Encoding = "hex",
    ): Promise<null> =>
        new Promise((resolve, reject) => {
            this.port.write(bytes, encoding, error => {
                if (error) {
                    reject(error);
                } else {
                    this.port.flush(error => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                }
            });
        });
    /**
     * Create a new serialport object
     * @param path - Path of serial port
     * @param baudRate - Baud rate to communicate
     */
    constructor(path: string, baudRate: number) {
        this.port = new NodeSerialPort(path, {
            baudRate,
            dataBits: 8,
            parity: "none",
            stopBits: 1,
            xon: false,
            xoff: false,
            autoOpen: false,
        });
        this.reader = createBytesSubject(this.port, "data");
        this.busy = new BehaviorSubject<boolean>(false);
    }
    /**
     * Open serial port
     */
    open = (): Promise<void> =>
        new Promise((resolve, reject) =>
            this.port.open(error => (error ? reject(error) : resolve())),
        );
    /**
     * Close serial port
     */
    close = (): Promise<void> =>
        new Promise((resolve, reject) =>
            this.port.close(error => (error ? reject(error) : resolve())),
        );
    /**
     * Send receive data with the port
     * @param requestFrame - Request frame to encode and send
     * @param responseTimeout - Time in milliseconds before timeout is raised
     * @returns Response frame
     */
    async transceive(
        requestFrame: number[],
        responseTimeout: number,
    ): Promise<number[]> {
        if (this.busy.value) {
            throw new PortBusy("Port is busy");
        }
        try {
            this.busy.next(true);
            const encoded = encodeFrame(requestFrame);
            const replaySubject = storeBytes(this.reader);
            await this.writeBytes(encoded);
            const response = await collectResponses(
                replaySubject,
                TERMINAL_BYTE,
                responseTimeout,
            );
            return decodeFrame(response);
        } finally {
            this.busy.next(false);
        }
    }
}
