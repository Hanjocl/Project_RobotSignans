import asyncio
from serial_handler import find_esp32_port, connect_to_esp32, disconnect_from_esp32

connected = False  # exported for use

async def scan_for_esp32():
    global connected
    while True:
        port = await asyncio.to_thread(find_esp32_port)
        new_connected = port is not None

        if new_connected != connected:
            connected = new_connected
            if connected:
                connected = connect_to_esp32(port)
            else:
                disconnect_from_esp32()
                connected = False


def getConnectionStatus():
    return connected 