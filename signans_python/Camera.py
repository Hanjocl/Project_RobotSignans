import cv2
import threading
import time
from log_manager import create_log

class CameraStream:
    def __init__(self, camera_index=0, res_width=1920, res_height=1080, rotate_code=cv2.ROTATE_90_CLOCKWISE, retry_interval=5):
        self.camera_index = camera_index
        self.res_width = res_width
        self.res_height = res_height
        self.rotate_code = rotate_code
        self.retry_interval = retry_interval

        self.cam = None
        self.frame = None
        self.lock = threading.Lock()
        self.running = True
        self.read_error = RuntimeError("Camera not yet initialized")

        self.thread = threading.Thread(target=self._update_frames, daemon=True)
        self.thread.start()

    def _init_camera(self):
        cam = cv2.VideoCapture(self.camera_index)
        cam.set(cv2.CAP_PROP_FRAME_WIDTH, self.res_width)
        cam.set(cv2.CAP_PROP_FRAME_HEIGHT, self.res_height)

        if not cam.isOpened():
            cam.release()
            return None

        # Optional camera settings
        cam.set(cv2.CAP_PROP_AUTO_EXPOSURE, 1)
        cam.set(cv2.CAP_PROP_EXPOSURE, 0)
        cam.set(cv2.CAP_PROP_BRIGHTNESS, -150)

        return cam

    def _update_frames(self):
        while self.running:
            if self.cam is None or not self.cam.isOpened():
                print("Trying to initialize camera...")
                self.cam = self._init_camera()
                if self.cam is None:
                    create_log(f"Camera initialization failed. Try re-plugging camera and reload site")
                    time.sleep(self.retry_interval)
                    continue
                else:
                    create_log("Camera initialized successfully. (ok)")

            success, frame = self.cam.read()
            if not success:
                create_log(f"Camera read failed. Reinitializing in {self.retry_interval} seconds.")
                self.cam.release()
                self.cam = None
                self.read_error = RuntimeError("Camera read failed")
                time.sleep(self.retry_interval)
                continue

            if self.rotate_code is not None:
                frame = cv2.rotate(frame, self.rotate_code)

            with self.lock:
                self.frame = frame
                self.read_error = None  # Clear error once a good frame is read

    def get_frame(self):
        if self.read_error:
            raise self.read_error
        with self.lock:
            return self.frame.copy() if self.frame is not None else None

    def stop(self):
        self.running = False
        self.thread.join()
        if self.cam:
            self.cam.release()