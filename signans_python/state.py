class SharedPositions:
    def __init__(self):
        self.corner_positions = {
            "topLeft": None,
            "topRight": None,
            "bottomLeft": None,
            "bottomRight": None
        }
        self.camera_position = {
            "cameraPosition": None
        }

shared_positions = SharedPositions()

class Position3D:
    def __init__(self, x: float, y: float, z: float):
        self.X = x
        self.Y = y
        self.Z = z

    def to_list(self):
        return [self.X, self.Y, self.Z]


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