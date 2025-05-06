
def generate_gcodeFile(path, Feed):
    gcode = []
    gcode.append("G21")  # Set units to mm
    gcode.append("G90")  # Absolute positioning
    
    # Generate G-code for the 3D path (move through points)
    for point in path:
        gcode.append(f"G1 X{point[0]} Y{point[1]} Z{point[2]} F{Feed}")  # Linear movement command
        
    return gcode


def generate_gcodeLine(X, Y, Z, Feed):
    return (f"G1 X{X} Y{Y} Z{Z} F{Feed}") 
