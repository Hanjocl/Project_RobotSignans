import cv2
import os

# Make sure directory exists
os.makedirs("captured_images", exist_ok=True)

def init_camera():
    try:
        cam = cv2.VideoCapture(0)
        cam.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)   # Width
        cam.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)   # Height
        if not cam.isOpened():
            raise IOError("Cannot open webcam")
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

def generate_frames():
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
