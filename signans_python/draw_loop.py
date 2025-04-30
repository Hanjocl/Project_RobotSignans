import random
import asyncio
from main import app
from serial_handler import write_to_esp32

async def main_draw_loop():
    # Ensure we only start generating movements if conditions are met
    while True:
        # Generate a random movement command
        movement_commands = ["G1 X0 Y0 Z-195", "G1 X0 Y0 Z-192", "G1 X0 Y0 Z-200", "G1 X0 Y0 Z-198"]
        movement = random.choice(movement_commands)
        
        # Send the movement command to the ESP32 via serial (assuming app.state.ser is your serial connection)
        if app.state.ser:
            await asyncio.to_thread(write_to_esp32, movement)

        print(f"Sending command: {movement}")
    await asyncio.sleep(1)  # Delay been commands (e.g., 1 second)