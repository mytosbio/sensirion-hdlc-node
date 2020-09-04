import logging

from sensirion_shdlc_driver import ShdlcSerialPort, ShdlcConnection, ShdlcDevice
from sensirion_shdlc_driver.command import ShdlcCommand

logging.basicConfig(level=logging.DEBUG)

port='/dev/tty.usbserial-FT41NKFH'
# port = "/Users/hpgmiskin/Code/Cytera/sensiron-flow-meter/mock-device"

with ShdlcSerialPort(port=port, baudrate=115200) as port:
    device = ShdlcDevice(ShdlcConnection(port), slave_address=0)
    print("Version: {}".format(device.get_version()))
    print("Product Name: {}".format(device.get_product_name()))
    print("Article Code: {}".format(device.get_article_code()))
    print("Serial Number: {}".format(device.get_serial_number()))

    # We want to send the command 'DeviceReset' to device 0.
    print("DeviceReset")
    print(device.execute(ShdlcCommand(0xD3, [], 1000)))

    # Send command 'Set Sensor Type' to address 0 with sensor type 3::
    print("Set Sensor Type")
    print(device.execute(ShdlcCommand(0x24, [0x03], 1000)))

    # Send command 'Start Continuous Measurement with command' with sampling time 250 ms and measurement command '0x3608' to address 0
    print("Start Continuous Measurement")
    print(device.execute(ShdlcCommand(0x33, [0x00, 0xFA, 0x36, 0x08], 1000)))

    # We want to send the command 'GetLastMeasurement' to device 0
    print("GetLastMeasurement")
    print(device.execute(ShdlcCommand(0x35, [], 1000)))

    # We want to send the command 'Get Totalizator Value' to device 0
    print("Get Totalizator Value")
    print(device.execute(ShdlcCommand(0x38, [], 1000)))