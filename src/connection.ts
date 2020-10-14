import pino from "pino";

import { sleep } from "./async-utilities";

import {
    MAX_SENSOR_ERRORS,
    RESEND_DELAY_MS,
    RESEND_COMMAND_ID,
    NO_ERROR_STATE,
} from "./constants";

import {
    RequestFrameData,
    ResponseFrameData,
    constructRequestFrame,
    deconstructResponseFrame,
} from "./message-frame";

import { Port } from "./port";

import {
    ChecksumInvalid,
    CommandIdMismatch,
    IncorrectDataLength,
    SlaveAddressMismatch,
    SlaveStateError,
} from "./errors";

import { formatBytes } from "./format-utilities";

const logger = pino({ name: "flow-meter:connection" });

export interface Connection {
    transceive(
        requestData: RequestFrameData,
        responseTimeout: number,
    ): Promise<ResponseFrameData>;
}

enum CommandRequest {
    Original = 0,
    Resend = 1,
}

/**
 * Retry connection uses a port to make repeated attempts at communication
 */
export class RetryConnection implements Connection {
    /**
     *
     */
    private port: Port;
    /**
     * Internal function to send receive data and manage errors
     * @param requestData - Send data frame to transmit to sensor
     * @param responseTimeout - Timeout to allow for response from the sensor
     * @param commandRequest - Declares if same command should be issued or resent command
     * @param allowedErrors - Number of allowed errors remaining
     */
    private async _transceive(
        requestData: RequestFrameData,
        responseTimeout: number,
        commandRequest = CommandRequest.Original,
        allowedErrors = MAX_SENSOR_ERRORS,
    ): Promise<ResponseFrameData> {
        try {
            const thisSendData =
                commandRequest == CommandRequest.Resend
                    ? {
                          slaveAddress: requestData.slaveAddress,
                          commandId: RESEND_COMMAND_ID,
                          commandData: [],
                      }
                    : requestData;
            const requestFrame = constructRequestFrame(thisSendData);
            logger.info(
                "making request command %s",
                formatBytes([thisSendData.commandId]),
            );
            const responseFrame = await this.port.transceive(
                requestFrame,
                responseTimeout,
            );
            const responseData = deconstructResponseFrame(responseFrame);
            if (requestData.slaveAddress !== responseData.slaveAddress) {
                throw new SlaveAddressMismatch(
                    requestData.slaveAddress,
                    responseData.slaveAddress,
                );
            } else if (requestData.commandId !== responseData.commandId) {
                throw new CommandIdMismatch(
                    requestData.commandId,
                    responseData.commandId,
                );
            } else if (responseData.slaveState !== NO_ERROR_STATE) {
                throw new SlaveStateError(responseData.slaveState);
            }
            return responseData;
        } catch (error) {
            // If no more errors are allowed throw error
            const remainingErrors = allowedErrors - 1;
            if (remainingErrors < 1) {
                logger.error("Allowed errors reached");
                throw error;
            }
            // Log the number of remaining errors
            logger.warn(
                "%s: '%s' (%s more errors allowed)",
                error.name,
                error.message,
                remainingErrors,
            );
            // Check if response should be resent
            if (
                error instanceof ChecksumInvalid ||
                error instanceof IncorrectDataLength
            ) {
                // Send special resend command
                logger.warn("send special resend command");
                return this._transceive(
                    requestData,
                    responseTimeout,
                    CommandRequest.Resend,
                    remainingErrors,
                );
            } else {
                // Send same request again after time delay
                logger.warn("delay %s ms before resend", RESEND_DELAY_MS);
                await sleep(RESEND_DELAY_MS);
                logger.warn("send original command again");
                return this._transceive(
                    requestData,
                    responseTimeout,
                    CommandRequest.Original,
                    remainingErrors,
                );
            }
        }
    }
    /**
     * Create a new connection
     * @param port - Port to communicate over
     */
    constructor(port: Port) {
        this.port = port;
    }
    /**
     * Send receive data to underlying port
     * @param requestData - Send data frame to transmit to sensor
     * @param responseTimeout - Timeout to allow for response
     */
    async transceive(
        requestData: RequestFrameData,
        responseTimeout: number,
    ): Promise<ResponseFrameData> {
        return this._transceive(requestData, responseTimeout);
    }
}
