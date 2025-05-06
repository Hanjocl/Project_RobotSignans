import random
import asyncio
from main import app
from serial_handler import write_to_esp32
from gcodeGenerator import generate_gcodeFile, generate_gcodeLine

async def main_draw_loop():
    # Ensure we only start generating movements if conditions are met
    while True:                                                                     # TODO: MAKE VARIABLE TO KILL PROCESS HERE OR SOMEWHERE ELSE???
        # Movement command for testing
        movement_commands = [[0, 0, -200], [0, 0, -198], [0, 10, -190]]
        
        # Send the movement command to the ESP32 via serial
        if app.state.ser:
            gcode = generate_gcodeFile(movement_commands)
            for line in gcode:
                print(f"Sending: {line}")
                await asyncio.to_thread(write_to_esp32, line)                       #TODO -> CHECK IF THIS WAITS BEFORE SENDING A NEW COMMAND
                await asyncio.sleep(1)