import asyncio
from main import app
from serial_handler import write_to_esp32
from gcodeGenerator import generate_gcodeFile, generate_gcodeLine
from path_processing import get_3d_path_from_image, visualize_path_3d
from camera_capture import get_frame
from state import shared_positions as pos

async def main_draw_loop():
    # Ensure we only start generating movements if conditions are met
    while True:
        img = get_frame()
        #Determine path to draw based on image
        path = get_3d_path_from_image(img, pos.topLeft, pos.topRight, pos.bottomRight, pos.bottomLeft)
        visualize_path_3d(path, )                                                                  # TODO: MAKE VARIABLE TO KILL PROCESS HERE OR SOMEWHERE ELSE???
        # Movement command for testing
        movement_commands = [[0, 0, -200], [0, 0, -198], [0, 10, -190]]
        
        # Send the movement command to the ESP32 via serial
        if app.state.ser:
            gcode = generate_gcodeFile(movement_commands)
            for line in gcode:
                print(f"Sending: {line}")
                await asyncio.to_thread(write_to_esp32, line)                       #TODO -> CHECK IF THIS WAITS BEFORE SENDING A NEW COMMAND
                await asyncio.sleep(1)