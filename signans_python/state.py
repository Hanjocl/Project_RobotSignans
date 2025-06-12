import numpy as np
import json

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

def set_all():
    # Reset shared positions
    shared_positions.topLeft[:] = [-755.07, -186.66 ,-1301.7]
    shared_positions.topRight[:] = [-755.07, 173.34, -1301.7]
    shared_positions.bottomLeft[:] = [-405.07, -186.66,  -1501.7]
    shared_positions.bottomRight[:] = [-405.07, 173.34, -1501.7]
    shared_positions.cameraPosition[:] = [194.9, 273.3, -1561.7]

    # Reset shared status
    for step in shared_status.status._statuses:
        shared_status.status._statuses[step] = "complete"

    # Reset camera perspective transform
    camera_perspective_transfrom.transform = [
        {"id": 1, "x": 490, "y": 830},            # Top-left
        {"id": 2, "x": 981, "y": 1016},         # Top-right
        {"id": 3, "x": 529, "y": 1604},      # Bottom-right
        {"id": 4, "x": 131, "y": 1341},         # Bottom-left
    ]


## Saving stuff
def shared_positions_to_dict(sp: SharedPositions):
    return {
        "topLeft": sp.topLeft.tolist(),
        "topRight": sp.topRight.tolist(),
        "bottomLeft": sp.bottomLeft.tolist(),
        "bottomRight": sp.bottomRight.tolist(),
        "cameraPosition": sp.cameraPosition.tolist(),
    }

def shared_positions_from_dict(sp: SharedPositions, data: dict):
    sp.topLeft[:] = data.get("topLeft", [None, None, None])
    sp.topRight[:] = data.get("topRight", [None, None, None])
    sp.bottomLeft[:] = data.get("bottomLeft", [None, None, None])
    sp.bottomRight[:] = data.get("bottomRight", [None, None, None])
    sp.cameraPosition[:] = data.get("cameraPosition", [None, None, None])

def shared_status_to_dict(ss: SharedStatus):
    return ss.status._statuses.copy()

def shared_status_from_dict(ss: SharedStatus, data: dict):
    for step, status in data.items():
        if step in ss.status._statuses:
            ss.status._statuses[step] = status

def camera_transform_to_dict(ct: CameraTransformPerspective):
    return ct.transform.copy()

def camera_transform_from_dict(ct: CameraTransformPerspective, data: list):
    ct.transform = data

# --- Save to file ---
def save_state(filename: str):
    data = {
        "shared_positions": shared_positions_to_dict(shared_positions),
        "shared_status": shared_status_to_dict(shared_status),
        "camera_transform": camera_transform_to_dict(camera_perspective_transfrom),
    }
    with open(filename, "w") as f:
        json.dump(data, f, indent=2)

# --- Load from file ---
def load_state(filename: str):
    with open(filename, "r") as f:
        data = json.load(f)
    shared_positions_from_dict(shared_positions, data.get("shared_positions", {}))
    shared_status_from_dict(shared_status, data.get("shared_status", {}))
    camera_transform_from_dict(camera_perspective_transfrom, data.get("camera_transform", []))
