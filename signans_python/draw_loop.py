import asyncio
import time
from main import app
from serial_handler import read_serial_lines, write_to_esp32
from gcodeGenerator import generate_gcodeFile, generate_gcodeLine, save_gcode_to_file
from path_processing import get_3d_path_from_image, visualize_path_3d
from camera_capture import get_transformed_frame, save_frame_with_incrementing_filename
from log_manager import create_log
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

async def wait_until_ready():
    response = await read_serial_lines()
    print(f"Response: {response}")
    if not response:
        app.state.draw_task.cancel()
        app.state.draw_task = None    

async def main_draw_loop():
    # Ensure we only start generating movements if conditions are met
    while True:
        #Turn on absolute mode
        write_to_esp32("G90")
        create_log("Send: G90 (ok)")
        await wait_until_ready()

        # Set camera speed
        write_to_esp32("G0 F960")
        create_log("Send: G0 F960 (ok)")
        await wait_until_ready()

        create_log("Going to camera position (ok)")
        line = generate_gcodeLine(pos.cameraPosition[0], pos.cameraPosition[1], pos.cameraPosition[2])
        create_log(f"Generated line: {line} (ok)")
        await asyncio.sleep(1)

        write_to_esp32(line)
        await wait_until_ready()

        create_log("Arrived at camera position (ok)")
        await asyncio.sleep(1)

        create_log("Trying to capture image (ok)")
        await asyncio.sleep(1)

        img = await get_transformed_frame()
        if img is None:
            create_log("Failure: Camera (ok)")
            app.state.draw_task.cancel()
            app.state.draw_task = None
            break

        create_log("Image succesfuly captured (ok)")
        await asyncio.sleep(1)

        #Determine path to draw based on image
        create_log("Generating path... (ok)")
        path_3d, path_2d = await get_3d_path_from_image(img, pos.topLeft, pos.topRight, pos.bottomRight, pos.bottomLeft, 10)
        if path_3d is None:
            create_log("Failure: Path generation (ok)")
            app.state.draw_task.cancel()
            app.state.draw_task = None
            break    

        #Save image wiht path overlay to disk
        save_frame_with_incrementing_filename(img, path_2d)
                
        create_log("Path generated (ok)")
        movement_commands = path_3d.tolist()          # FOR REAL USE
        await visualize_path_3d(path_3d, pos.topLeft, pos.topRight, pos.bottomRight, pos.bottomLeft)
        create_log("Visual exported (ok)")
 
        await asyncio.sleep(2)
        
        if not app.state.ser.is_open:
            raise ValueError("Serial Connection failed! (ok)")
        
        # Set drawing speed
        write_to_esp32("G0 F1200")
        create_log("Send: G0 F1200 (ok)")
        await wait_until_ready()

        # Send the movement command to the ESP32 via serial
        try:
            create_log(f"Generating gcode (ok)")
            gcode = await generate_gcodeFile(movement_commands)
            await save_gcode_to_file(gcode, "Gcode", "Gcode_testing_")

            create_log(f"Gcode generated (ok)")


            # Go through all the lines
            for line in gcode:
                create_log(f"Sending: {line} (ok)")
                write_to_esp32(line)
                await wait_until_ready()                       #TODO -> CHECK IF THIS WAITS BEFORE SENDING A NEW COMMAND
                await asyncio.sleep(0.1)
        except Exception as e:
            create_log(f"Failure: ESP32 connection ({e}) (ok)")
            app.state.draw_task.cancel()
            app.state.draw_task = None 
        
        create_log(f"Finish cycle (ok)")
        await asyncio.sleep(4)