import cv2
import os
import re
import time
import numpy as np
from state import camera_perspective_transfrom
from Camera import CameraStream  # your CameraStream class file

# Initialize camera stream once
cam_stream = CameraStream()

# Resolution constants (make sure these match CameraStream settings)
res_width = 1920
res_height = 1080

def stream_raw_frames():
    while True:
        frame = cam_stream.get_frame()
        if frame is None:
            time.sleep(0.01)
            continue
        _, buffer = cv2.imencode(".jpg", frame)
        frame_bytes = buffer.tobytes()
        yield (b"--frame\r\n"
               b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")


# Define destination points for perspective transform (consistent with your previous code)
dst_points = np.array([
    [0, 0],          # Top-left
    [1080, 0],       # Top-right
    [1080, 1920],    # Bottom-right
    [0, 1920]        # Bottom-left
], dtype=np.float32)

def apply_perspective_transform(frame, transform_perspective):
    h, w = frame.shape[:2]  # get actual frame size
    aspect_ratio = w / h
    
    # Define destination points using the actual frame size
    dst_points = np.array([
        [0, 0],
        [w, 0],
        [w, h],
        [0, h]
    ], dtype=np.float32)
    
    # Source points from your perspective transform config
    src_points = np.array([
        [transform_perspective[0]["x"], transform_perspective[0]["y"]],
        [transform_perspective[1]["x"], transform_perspective[1]["y"]],
        [transform_perspective[2]["x"], transform_perspective[2]["y"]],
        [transform_perspective[3]["x"], transform_perspective[3]["y"]],
    ], dtype=np.float32)

    # Compute transform matrix and warp the image
    matrix = cv2.getPerspectiveTransform(src_points, dst_points)
    transformed_frame = cv2.warpPerspective(frame, matrix, (w, h))

    return transformed_frame


def stream_transformed_frames():
    while True:
        frame = cam_stream.get_frame()
        if frame is None:
            time.sleep(0.01)
            continue

        transform_perspective = camera_perspective_transfrom.transform
        transformed_frame = apply_perspective_transform(frame, transform_perspective)

        _, buffer = cv2.imencode(".jpg", transformed_frame)
        frame_bytes = buffer.tobytes()
        yield (b"--frame\r\n"
               b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")

async def get_transformed_frame():
    frame = cam_stream.get_frame()
    if frame is None:
        raise RuntimeError("ERROR: Failed to capture frame")

    transform_perspective = camera_perspective_transfrom.transform
    transformed_frame = apply_perspective_transform(frame, transform_perspective, res_height, res_width)

    # Return just the transformed frame (not encoded)
    return transformed_frame

def save_frame_with_incrementing_filename(frame, path_2d=None, folder="saved_frames", prefix="frame_", ext=".jpg"):
    os.makedirs(folder, exist_ok=True)

    # --- 2D Path Overlay ---
    if path_2d is not None:
        h, w = frame.shape[:2]
        path_2d_normalized = np.clip(path_2d, 0, [w, h]).astype(np.int32)

        for i in range(1, len(path_2d_normalized)):
            cv2.line(frame, tuple(path_2d_normalized[i - 1]), tuple(path_2d_normalized[i]), (0, 0, 255), 4)

    # --- Save the frame ---
    existing_files = os.listdir(folder)
    frame_numbers = []
    pattern = re.compile(rf"{re.escape(prefix)}(\d{{4}}){re.escape(ext)}")

    for filename in existing_files:
        match = pattern.match(filename)
        if match:
            frame_numbers.append(int(match.group(1)))

    next_num = max(frame_numbers) + 1 if frame_numbers else 1

    filename = os.path.join(folder, f"{prefix}{next_num:04d}{ext}")
    cv2.imwrite(filename, frame)
    return filename
