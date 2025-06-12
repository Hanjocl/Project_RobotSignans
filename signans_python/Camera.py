import cv2
import threading
import time

class CameraStream:
    def __init__(self, camera_index=0, res_width=1920, res_height=1080, rotate_code=cv2.ROTATE_90_CLOCKWISE):
        self.camera_index = camera_index
        self.res_width = res_width
        self.res_height = res_height
        self.rotate_code = rotate_code
        
        self.cam = self._init_camera()
        if self.cam is None:
            raise RuntimeError("Failed to initialize camera")

        self.frame = None
        self.lock = threading.Lock()
        self.running = True
        
        self.thread = threading.Thread(target=self._update_frames, daemon=True)
        self.thread.start()

    def _init_camera(self):
        try:
            cam = cv2.VideoCapture(self.camera_index)
            cam.set(cv2.CAP_PROP_FRAME_WIDTH, self.res_width)
            cam.set(cv2.CAP_PROP_FRAME_HEIGHT, self.res_height)
            if not cam.isOpened():
                raise IOError("Camera not available")
            
            cam.set(cv2.CAP_PROP_AUTO_EXPOSURE, 1)
            cam.set(cv2.CAP_PROP_EXPOSURE, 0)
            cam.set(cv2.CAP_PROP_BRIGHTNESS, -150)
            return cam
        except Exception as e:
            print(f"Camera error: {e}")
            return None

    def _update_frames(self):
        while self.running:
            success, frame = self.cam.read()
            if success:
                if self.rotate_code is not None:
                    frame = cv2.rotate(frame, self.rotate_code)
                with self.lock:
                    self.frame = frame
            else:
                print("Camera read failed")

    def get_frame(self):
        with self.lock:
            if self.frame is None:
                return None
            return self.frame.copy()

    def stop(self):
        self.running = False
        self.thread.join()
        self.cam.release()
