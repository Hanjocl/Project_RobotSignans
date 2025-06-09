import cv2
import os
import re
import numpy as np
from state import camera_perspective_transfrom

# Make sure directory exists
os.makedirs("captured_images", exist_ok=True)

res_width = 1920
res_height = 1080

def init_camera():
    try:
        cam = cv2.VideoCapture(0)
        cam.set(cv2.CAP_PROP_FRAME_WIDTH, res_width)   # Width
        cam.set(cv2.CAP_PROP_FRAME_HEIGHT, res_height)   # Height
        if not cam.isOpened():
            raise IOError("Camera not available")
        
        cam.set(cv2.CAP_PROP_AUTO_EXPOSURE, 1)  # Enable auto exposure
        actual_exposure = cam.get(cv2.CAP_PROP_EXPOSURE)
        # Set exposure
        # Note: The value and effect depends on your camera driver.
        # A lower value = longer exposure (brighter image), higher = shorter exposure (darker image)
        # Try negative values (e.g. -6 to -1) for many webcams.
        cam.set(cv2.CAP_PROP_EXPOSURE, 0)
        cam.set(cv2.CAP_PROP_BRIGHTNESS, -150)
        # Check if the setting was successful
        return cam
    
    except Exception as e:
        print(f"Camera error: {e}")
        return None

camera = init_camera()

def get_frame():
    success, frame = camera.read()
    frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
    if not success:
        return
    return frame

def stream_raw_frames():
    if camera is None:
        raise RuntimeError("Camera is not initialized.")
    while True:
        success, frame = camera.read()
        frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
        if not success:
            break
        _, buffer = cv2.imencode(".jpg", frame)
        frame_bytes = buffer.tobytes()

        # MJPEG streaming format
        yield (b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")
        

# Define the destination points for the perspective transformation
dst_points = np.array([
    [0, 0],  # Top-left
    [1080, 0],  # Top-right
    [1080, 1920],  # Bottom-right
    [0, 1920]  # Bottom-left
], dtype=np.float32)

def apply_perspective_transform(frame, transform_perspective, new_height, new_width):
    # Extract the source points from camera_perspective_transform
    src_points = np.array([
        [transform_perspective[0]["x"], transform_perspective[0]["y"]],  # Top-left
        [transform_perspective[1]["x"], transform_perspective[1]["y"]],  # Top-right
        [transform_perspective[2]["x"], transform_perspective[2]["y"]],  # Bottom-right
        [transform_perspective[3]["x"], transform_perspective[3]["y"]]   # Bottom-left
    ], dtype=np.float32)

    # Compute the perspective transformation matrix
    matrix = cv2.getPerspectiveTransform(src_points, dst_points)

    # Apply the perspective transformation to the frame
    transformed_frame = cv2.warpPerspective(frame, matrix, (new_height, new_width))

    return transformed_frame

def stream_transformed_frames():
    if camera is None:
        raise RuntimeError("Camera is not initialized.")
    while True:
        success, frame = camera.read()
        if not success:
            print("ERROR: Failed to capture frame")
            break

        frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
        transform_perspective = camera_perspective_transfrom.transform
        transformed_frame  = apply_perspective_transform(frame, transform_perspective, res_height, res_width)

        _, buffer = cv2.imencode(".jpg", transformed_frame)
        frame_bytes = buffer.tobytes()

        # MJPEG streaming format
        yield (b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")
        
async def get_transformed_frame():
    if camera is None:
        raise RuntimeError("Camera is not initialized.")
    
    success, frame = camera.read()
    if not success:
        print("ERROR: Failed to capture frame")
        raise RuntimeError("ERROR: Failed to capture frame")

    frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
    transform_perspective = camera_perspective_transfrom.transform
    transformed_frame  = apply_perspective_transform(frame, transform_perspective, res_height, res_width)

    # Save frame to folder
    save_frame_with_incrementing_filename(transformed_frame)

    # MJPEG streaming format
    return transformed_frame

def save_frame_with_incrementing_filename(frame, folder="saved_frames", prefix="frame_", ext=".jpg"):
    os.makedirs(folder, exist_ok=True)
    
    existing_files = os.listdir(folder)
    frame_numbers = []
    pattern = re.compile(rf"{re.escape(prefix)}(\d{{4}}){re.escape(ext)}")
    
    for filename in existing_files:
        match = pattern.match(filename)
        if match:
            frame_numbers.append(int(match.group(1)))
    
    if frame_numbers:
        next_num = max(frame_numbers) + 1
    else:
        next_num = 1
    
    filename = os.path.join(folder, f"{prefix}{next_num:04d}{ext}")
    cv2.imwrite(filename, frame)
    return filename  # optionally return the saved filename
