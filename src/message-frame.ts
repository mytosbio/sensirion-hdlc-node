import { IncorrectDataLength } from "./errors";

export type RequestFrameData = {
    slaveAddress: number;
    commandId: number;
    commandData: number[];
};

export type ResponseFrameData = {
    slaveAddress: number;
    commandId: number;
    slaveState: number;
    commandData: number[];
};

/**
 * Construct a frame to send to sensor
 * @param requestFrameData - Data with which to construct request frame
 * @returns Bytes to send to sensor
 */
export const constructRequestFrame = ({
    slaveAddress,
    commandId,
    commandData,
}: RequestFrameData): number[] => {
    const dataLength = commandData.length;
    return [slaveAddress, commandId, dataLength, ...commandData];
};

/**
 * Deconstruct bytes to create a received frame
 * @param frameBytes - Frame bytes from sensor
 * @returns Response frame data
 */
export const deconstructResponseFrame = (
    frameBytes: number[],
): ResponseFrameData => {
    const [
        slaveAddress,
        commandId,
        slaveState,
        dataLength,
        ...commandData
    ] = frameBytes;
    if (dataLength !== commandData.length) {
        throw new IncorrectDataLength(
            `Data length ${dataLength} does not match data length received ${commandData.length}`,
        );
    }
    return {
        slaveAddress,
        commandId,
        slaveState,
        commandData,
    };
};
