import asyncio
from main import app
from serial_handler import write_to_esp32
from gcodeGenerator import generate_gcodeFile, generate_gcodeLine
from path_processing import get_3d_path_from_image, visualize_path_3d
from camera_capture import generate_transformed_frames
from state import shared_positions as pos

async def main_draw_loop():
    # Ensure we only start generating movements if conditions are met
    while True:
        img = generate_transformed_frames()
        #Determine path to draw based on image
        path = get_3d_path_from_image(img, pos.topLeft, pos.topRight, pos.bottomRight, pos.bottomLeft)
        visualize_path_3d(path, pos.topLeft, pos.topRight, pos.bottomRight, pos.bottomLeft,"ProjectedPaths.png", "captured_images" )                     # TODO: MAKE VARIABLE TO KILL PROCESS HERE OR SOMEWHERE ELSE???
        # Movement command for testing
        movement_commands = [[0, 0, -200], [0, 0, -198], [0, 10, -190]]         # For debug purpose
        #movement_commands = path.tolist()          # FOR REAL USE
        
        # Send the movement command to the ESP32 via serial
        if app.state.ser:
            gcode = generate_gcodeFile(movement_commands)
            for line in gcode:
                print(f"Sending: {line}")
                await asyncio.to_thread(write_to_esp32, line)                       #TODO -> CHECK IF THIS WAITS BEFORE SENDING A NEW COMMAND
                await asyncio.sleep(1)