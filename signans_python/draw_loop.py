import asyncio
import string
from tabnanny import check
import time
from main import app
from serial_handler import read_serial_lines, write_to_esp32, get_position
from gcodeGenerator import generate_gcodeFile, generate_gcodeLine
from path_processing import get_3d_path_from_image, visualize_path_3d
from camera_capture import get_transformed_frame
from state import shared_positions as pos

async def main_test_loop():
    while True:
        print("Main draw loop running...")
        await asyncio.sleep(2)

async def main_debug_loop():
    while True:
        print(f"Going to camera position [{int(time.time())}]")
        line = generate_gcodeLine(pos.cameraPosition[0], pos.cameraPosition[1], pos.cameraPosition[2])
        print(f"Generated line: {line}")
        await asyncio.sleep(1)

async def main_draw_loop():
    # Ensure we only start generating movements if conditions are met
    while True:
        print_stat("Going to camera position")
        line = generate_gcodeLine(pos.cameraPosition[0], pos.cameraPosition[1], pos.cameraPosition[2])
        print_stat("Generated line: {line}")

        write_to_esp32(line)
        await read_serial_lines()

        print_stat("Arrived at camera position")


        time.sleep(1)
        print_stat("Trying to capture image")


        img = await get_transformed_frame()

        print_stat("Image succesfuly captured")


        #Determine path to draw based on image
        print_stat("Generating path...")
        path = get_3d_path_from_image(img, pos.topLeft, pos.topRight, pos.bottomRight, pos.bottomLeft)
        print_stat("Path generated")
        movement_commands = path.tolist()          # FOR REAL USE
        await visualize_path_3d(path, pos.topLeft, pos.topRight, pos.bottomRight, pos.bottomLeft)                     # TODO: MAKE VARIABLE TO KILL PROCESS HERE OR SOMEWHERE ELSE???
        print_stat("Visual exported")

        time.sleep(1.0)
        # Send the movement command to the ESP32 via serial

        if app.state.ser:
            print_stat(f"Generating gcode")
            gcode = await generate_gcodeFile(movement_commands)
            print_stat(f"Gcode generated")


            # Go through all the lines
            for line in gcode:
                print_stat(f"Sending: {line}")
                write_to_esp32(line)
                await read_serial_lines()                       #TODO -> CHECK IF THIS WAITS BEFORE SENDING A NEW COMMAND
                await asyncio.sleep(0.1)
        
        print_stat(f"Finish cycle")
        await asyncio.sleep(4)


def print_stat(msg: string):
    timestamp = time.strftime("%H:%M:%S")
    timestamped_msg = f"[{timestamp}] {msg}"
    print(timestamped_msg)