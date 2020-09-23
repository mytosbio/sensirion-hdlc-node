declare module "@serialport/binding-mock" {
    import { OpenOptions, PortInfo } from "serialport";
    import AbstractBinding from "@serialport/binding-abstract";

    type Flags = {
        brk: boolean;
        cts: boolean;
        dsr: boolean;
        dtr: boolean;
        rts: boolean;
    };

    /**
     * Mock bindings for pretend serialport access
     */
    export default class MockBinding extends AbstractBinding {
        /**
         * if record is true this buffer will have all data that has been written to this port
         */
        readonly recording: Buffer;

        /**
         * the buffer of the latest written data
         */
        readonly lastWrite: null | Buffer;

        /**
         * Create a mock port
         */
        static createPort(
            path: string,
            opt: { echo?: boolean; record?: boolean; readyData?: Buffer },
        ): void;

        /**
         * Reset available mock ports
         */
        static reset(): void;

        /**
         * list mock ports
         */
        static list(): Promise<PortInfo[]>;

        /**
         * Emit data on a mock port
         */
        emitData(data: Buffer | string | number[]): void;

        /**
         * Standard bindings interface
         */
        open(path: string, opt: OpenOptions): Promise<void>;
        close(): Promise<void>;
        read(
            buffer: Buffer,
            offset: number,
            length: number,
        ): Promise<{ bytesRead: number; buffer: Buffer }>;
        write(buffer: Buffer): Promise<void>;
        update(options: { baudRate: number }): Promise<void>;
        set(options: Partial<Flags>): Promise<void>;
        get(): Promise<Flags>;
        getBaudRate(): Promise<number>;
        flush(): Promise<void>;
        drain(): Promise<void>;
    }
}
