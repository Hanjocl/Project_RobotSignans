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


# class SharedPositions:
#     def __init__(self):
#         self._corner_positions = {
#             "topLeft": None,
#             "topRight": None,
#             "bottomLeft": None,
#             "bottomRight": None
#         }
#         self.camera_position = {
#             "cameraPosition": None
#         }

#     @property
#     def topLeft(self):
#         return self._corner_positions["topLeft"]

#     @topLeft.setter
#     def topLeft(self, value):
#         self._corner_positions["topLeft"] = value

#     @property
#     def topRight(self):
#         return self._corner_positions["topRight"]

#     @topRight.setter
#     def topRight(self, value):
#         self._corner_positions["topRight"] = value

#     @property
#     def bottomLeft(self):
#         return self._corner_positions["bottomLeft"]

#     @bottomLeft.setter
#     def bottomLeft(self, value):
#         self._corner_positions["bottomLeft"] = value

#     @property
#     def bottomRight(self):
#         return self._corner_positions["bottomRight"]

#     @bottomRight.setter
#     def bottomRight(self, value):
#         self._corner_positions["bottomRight"] = value

# shared_positions = SharedPositions()

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