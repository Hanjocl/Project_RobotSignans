import cv2
import os

# Make sure directory exists
os.makedirs("captured_images", exist_ok=True)
camera = cv2.VideoCapture(0)  # Use 0 or a video file

def generate_frames():
    while True:
        success, frame = camera.read()
        if not success:
            break
        _, buffer = cv2.imencode(".jpg", frame)
        frame_bytes = buffer.tobytes()

        # MJPEG streaming format
        yield (b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")
