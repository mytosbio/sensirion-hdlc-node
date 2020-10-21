import pino from "pino";
import NodeSerialPort from "serialport";

import {
    createBytesSubject,
    storeBytes,
    collectResponses,
} from "./port-utilities";
import { encodeFrame, decodeFrame } from "./encapsulation";
import { BehaviorSubject, Subject } from "rxjs";
import { PortBusy } from "./errors";
import { promisify } from "util";
import { TERMINAL_BYTE } from "./constants";
import { formatBytes } from "./format-utilities";

/**
 * Encoding type for sending bytes
 */
type Encoding = "base64" | "binary" | "hex";

const logger = pino({ name: "flow-meter:port" });

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
     * Function to call node serialport open
     */
    private openAsync: () => Promise<void>;
    /**
     * Function to call node serialport close
     */
    private closeAsync: () => Promise<void>;
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
            logger.debug("write bytes to port");
            this.port.write(bytes, encoding, error => {
                if (error) {
                    reject(error);
                } else {
                    logger.debug("bytes written to port");
                    this.port.flush(error => {
                        if (error) {
                            reject(error);
                        } else {
                            logger.debug("data flushed");
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
        this.openAsync = promisify(this.port.open.bind(this.port));
        this.closeAsync = promisify(this.port.close.bind(this.port));
        this.reader = createBytesSubject(this.port, "data");
        this.busy = new BehaviorSubject<boolean>(false);
    }
    /**
     * Open serial port
     */
    async open(): Promise<void> {
        if (!this.port.isOpen) {
            await this.openAsync();
        }
    }
    /**
     * Close serial port
     */
    async close(): Promise<void> {
        if (this.port.isOpen) {
            await this.closeAsync();
        }
    }
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
            logger.warn(
                "port is busy when sending %s",
                formatBytes(requestFrame),
            );
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
