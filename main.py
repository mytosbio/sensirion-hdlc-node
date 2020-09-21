import sys
import logging

from sensirion_shdlc_driver import ShdlcSerialPort, ShdlcConnection, ShdlcDevice
from sensirion_shdlc_driver.command import ShdlcCommand

MILLISECONDS_PER_MINUTE = 1000 * 60
SCALE_FACTOR = 500

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.WARNING)


def create_serial_port(path: str) -> ShdlcSerialPort:
    return ShdlcSerialPort(path, baudrate=115200)


def create_sensor_device(port: ShdlcSerialPort) -> ShdlcDevice:
    connection = ShdlcConnection(port)
    device = ShdlcDevice(connection, slave_address=0)
    logger.debug("Version: %s", device.get_version())
    logger.debug("Product Name: %s", device.get_product_name())
    logger.debug("Article Code: %s", device.get_article_code())
    logger.debug("Serial Number: %s", device.get_serial_number())
    return device


def init_sensor_device(device: ShdlcDevice):
    logger.debug("Device reset")
    device.execute(ShdlcCommand(0xD3, [], 250))
    logger.debug("Set sensor type")
    device.execute(ShdlcCommand(0x24, [0x03], 25))


def parse_most_significant_data(data: bytes):
    result = 0
    bits_in_byte = 8
    number_bytes = len(data)
    most_significant = bits_in_byte * number_bytes
    # Bit shift all data bytes
    for i in range(number_bytes):
        bit_shift = most_significant - (i + 1) * bits_in_byte
        result += data[i] << bit_shift
    # If MSF bit is 1 the number is negative
    if result & 2 ** 63 == 2 ** 63:
        return -((result ^ (2 ** 64 - 1)) + 1)
    return result


class StartContinuousMeasurement(ShdlcCommand):
    def __init__(self, measurement_interval: int):
        interval_bytes = measurement_interval.to_bytes(2, "big")
        super(StartContinuousMeasurement, self).__init__(
            0x33, [interval_bytes[0], interval_bytes[1], 0x36, 0x08], 1
        )


class StopContinuousMeasurement(ShdlcCommand):
    def __init__(self):
        super(StopContinuousMeasurement, self).__init__(0x34, [], 1)


class SetTotalizatorStatus(ShdlcCommand):
    def __init__(self, status: bool):
        data = [0x1 if status else 0x0]
        super(SetTotalizatorStatus, self).__init__(0x37, data, 1)


class GetTotalizatorValue(ShdlcCommand):
    def __init__(self):
        super(GetTotalizatorValue, self).__init__(0x38, [], 1)

    def interpret_response(self, data: bytes):
        logger.info("GetTotalizatorValue: %s %s", len(data), data)
        return parse_most_significant_data(data)


class ResetTotalizator(ShdlcCommand):
    def __init__(self):
        super(ResetTotalizator, self).__init__(0x39, [], 1)


def start_recording_volume(device: ShdlcDevice, measurement_interval: int):
    logger.debug("Set totalizator status")
    device.execute(SetTotalizatorStatus(True))
    logger.debug("Reset totalizator")
    device.execute(ResetTotalizator())
    logger.debug("Start continuous measurement")
    device.execute(StartContinuousMeasurement(measurement_interval))


def stop_recording_volume(device: ShdlcDevice, measurement_interval: int):
    logger.debug("Stop continuous measurement")
    device.execute(StopContinuousMeasurement())
    logger.debug("Get totalizator value")
    total_ticks = device.execute(GetTotalizatorValue())
    logger.info("total_ticks %s", total_ticks)
    sampling_time = measurement_interval / MILLISECONDS_PER_MINUTE
    logger.info("sampling_time %s", sampling_time)
    interim_flow = total_ticks / SCALE_FACTOR
    logger.info("interim_flow %s", interim_flow)
    return interim_flow * sampling_time


def main(path="/dev/tty.usbserial-FT41NKFH"):
    port = create_serial_port(path)
    device = create_sensor_device(port)
    init_sensor_device(device)
    input("Device ready - press enter to start recording volume")
    measurement_interval = 20
    start_recording_volume(device, measurement_interval)
    input("Recording volume - press enter to stop recording volume")
    volume_pumped = stop_recording_volume(device, measurement_interval)
    print("Volume pumped: {}".format(volume_pumped))
    port.close()


if __name__ == "__main__":
    main(*sys.argv[1:])