import os
import re

def generate_gcodeLine(X=None, Y=None, Z=None, Feed=None):
    coords = []
    if X is not None:
        coords.append(f"X{X}")
    if Y is not None:
        coords.append(f"Y{Y}")
    if Z is not None:
        coords.append(f"Z{Z}")
    line = "G1 " + " ".join(coords)
    if Feed is not None:
        line += f" F{Feed}"
    return line


async def generate_gcodeFile(path, Feed = None):
    gcode = []
    gcode.append("G90")  # Absolute positioning
    
    # Generate G-code for the 3D path (move through points)
    for point in path:
        if Feed is None:
            gcode.append(f"G1 X{point[0]} Y{point[1]} Z{point[2]}")  # Linear movement command
        else:
            gcode.append(f"G1 X{point[0]} Y{point[1]} Z{point[2]} F{Feed}")  # Linear movement command
    
    return gcode

async def save_gcode_to_file(gcode, folder, base_filename):
    try:
        # Ensure the folder exists
        os.makedirs(folder, exist_ok=True)

        # Extract base name and extension
        name, ext = os.path.splitext(base_filename)
        if not ext:
            ext = ".gcode"

        # List all matching files in the directory
        pattern = re.compile(rf"{re.escape(name)}_(\d+){re.escape(ext)}$")
        existing_numbers = []

        for f in os.listdir(folder):
            match = pattern.match(f)
            if match:
                existing_numbers.append(int(match.group(1)))

        # Determine next file number
        next_number = max(existing_numbers, default=0) + 1
        numbered_filename = f"{name}_{next_number}{ext}"
        filepath = os.path.join(folder, numbered_filename)

        # Write the G-code to file
        with open(filepath, 'w') as file:
            for line in gcode:
                file.write(line + '\n')

        print(f"G-code successfully saved to {filepath}")
    except Exception as e:
        print(f"Error saving G-code: {e}")

