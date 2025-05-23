import numpy as np

class SharedPositions:
    def __init__(self):
        self.topLeft = np.array([None, None, None])
        self.topRight = np.array([None,None,None])
        self.bottomLeft = np.array([None,None,None])
        self.bottomRight = np.array([None,None,None])
        self.cameraPosition = np.array([None,None,None])

    def get_corners(self):
        return ["topLeft", "topRight", "bottomLeft", "bottomRight"]

shared_positions = SharedPositions()

class StepStatus:
    def __init__(self, initial_statuses):
        self._statuses = initial_statuses

    def __getattr__(self, name):
        if name in self._statuses:
            return self._statuses[name]
        raise AttributeError(f"'StepStatus' object has no attribute '{name}'")

    def __setattr__(self, name, value):
        if name == "_statuses":
            super().__setattr__(name, value)
        elif name in self._statuses:
            self._statuses[name] = value
        else:
            raise AttributeError(f"'StepStatus' object has no attribute '{name}'")

    def items(self):
        return self._statuses.items()

    def update(self, step, status):
        if step in self._statuses:
            self._statuses[step] = status
            return True
        return False


class SharedStatus:
    def __init__(self):
        self.status = StepStatus({
            "Homing": "pending",
            "Connect Wires": "pending",
            "Corner Calibration": "pending",
            "Camera Calibration": "pending",
            "Final Checklist": "pending"
        })

shared_status = SharedStatus()


class CameraTransformPerspective:
    def __init__(self):
        self.transform = [
        {"id": 1, "x": 0, "y": 0},            # Top-left
        {"id": 2, "x": 1080, "y": 0},         # Top-right
        {"id": 3, "x": 1080, "y": 1920},      # Bottom-right
        {"id": 4, "x": 0, "y": 1920},         # Bottom-left
    ] 

camera_perspective_transfrom = CameraTransformPerspective()

def get_transform_store():
    return camera_perspective_transfrom

def set_camera_transform(store: CameraTransformPerspective, data: list[dict]):
    store.transform = data

def reset_all():
    # Reset shared positions
    shared_positions.topLeft[:] = [None, None, None]
    shared_positions.topRight[:] = [None, None, None]
    shared_positions.bottomLeft[:] = [None, None, None]
    shared_positions.bottomRight[:] = [None, None, None]
    shared_positions.cameraPosition[:] = [None, None, None]

    # Reset shared status
    for step in shared_status.status._statuses:
        shared_status.status._statuses[step] = "pending"

    # Reset camera perspective transform
    camera_perspective_transfrom.transform = [
        {"id": 1, "x": 0, "y": 0},            # Top-left
        {"id": 2, "x": 1080, "y": 0},         # Top-right
        {"id": 3, "x": 1080, "y": 1920},      # Bottom-right
        {"id": 4, "x": 0, "y": 1920},         # Bottom-left
    ]