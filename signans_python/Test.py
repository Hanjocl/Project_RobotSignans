
class PlanePoints:
    def __init__(self):
        self.points = None

    def set_points(self, p1, p2, p3, p4):
        self.points = np.array([p1, p2, p3, p4])

    def get_points(self):
        if self.points is None:
            raise ValueError("Plane points not set.")
        return self.points

plane = PlanePoints()
corners = shared_positions.corner_positions

plane.set_points(
    [50,      50,       100,],
    [-50,     50,       100,],
    [50,      -50,      0,],
    [-50,     -50,      0,]
)


# plane.set_points(
#     [corners["topLeft"].X,      corners["topLeft"].Y,       corners["topLeft"].Z],
#     [corners["topRight"].X,     corners["topRight"].Y,      corners["topRight"].Z],
#     [corners["bottomLeft"].X,   corners["bottomLeft"].Y,    corners["bottomLeft"].Z],
#     [corners["bottomRight"].X,  corners["bottomRight"].Y,   corners["bottomRight"].Z],
# )
# Step 2: Fit a plane to the 4 points using SVD
centroid = np.mean(plane, axis=0)
_, _, vh = np.linalg.svd(plane - centroid)
normal = vh[2, :]  # normal to the plane

# Step 3: Project a path onto the plane
# Example path in 3D (could be 2D if flat, add Z=0 and project)
path = np.array([
    [px1, py1, pz1],
    [px2, py2, pz2],
    ...
])

def project_point_onto_plane(point, plane_point, normal):
    v = point - plane_point
    distance = np.dot(v, normal)
    return point - distance * normal

projected_path = np.array([project_point_onto_plane(p, centroid, normal) for p in path])

# Step 4: Convert projected path to G-code
def path_to_gcode(path):
    gcode = []
    for pt in path:
        gcode.append(f"G1 X{pt[0]:.3f} Y{pt[1]:.3f} Z{pt[2]:.3f}")
    return "\n".join(gcode)

gcode_output = path_to_gcode(projected_path)
print(gcode_output)
