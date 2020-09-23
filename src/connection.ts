import pino from "pino";

import { sleep } from "./async-utilities";

import {
    MAX_ERRORS,
    RESEND_COMMAND_ID,
    NO_ERROR_STATE,
    RESEND_DELAY_MS,
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
    NoResponseTimeout,
    PortBusy,
    SlaveAddressMismatch,
    SlaveStateError,
} from "./errors";

const logger = pino({ name: "flow-meter:connection" });

export interface Connection {
    transceive(
        requestData: RequestFrameData,
        responseTimeout: number,
    ): Promise<ResponseFrameData>;
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
     * @param responseTimeout - Timeout to allow for response
     * @param requestResend - True if special resend command should be sent
     * @param allowedErrors - Number of allowed errors remaining
     */
    private async _transceive(
        requestData: RequestFrameData,
        responseTimeout: number,
        requestResend = false,
        allowedErrors = MAX_ERRORS,
    ): Promise<ResponseFrameData> {
        try {
            const thisSendData = requestResend
                ? {
                      slaveAddress: requestData.slaveAddress,
                      commandId: RESEND_COMMAND_ID,
                      commandData: [],
                  }
                : requestData;
            const requestFrame = constructRequestFrame(thisSendData);
            logger.info("making request on port %s", thisSendData.commandId);
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
            if (allowedErrors < 1) {
                logger.error("Allowed errors reached");
                throw error;
            } else if (
                error instanceof PortBusy ||
                error instanceof NoResponseTimeout
            ) {
                // Send same command again after time delay
                logger.warn(
                    "%s when making request '%s' (%s more errors allowed)",
                    error.name,
                    error.message,
                    allowedErrors,
                );
                await sleep(RESEND_DELAY_MS);
                return this._transceive(
                    requestData,
                    responseTimeout,
                    false,
                    allowedErrors - 1,
                );
            } else if (
                error instanceof ChecksumInvalid ||
                error instanceof IncorrectDataLength
            ) {
                // Send special resend command
                logger.warn(
                    "%s when processing response '%s' (%s more errors allowed)",
                    error.name,
                    error.message,
                    allowedErrors,
                );
                return this._transceive(
                    requestData,
                    responseTimeout,
                    true,
                    allowedErrors - 1,
                );
            } else {
                logger.error("%s %s", error.name, error.message);
                throw error;
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
