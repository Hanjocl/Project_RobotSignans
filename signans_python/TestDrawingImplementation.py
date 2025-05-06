import cv2
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection

# === Step 1: Load image and extract path ===

# Load grayscale image
image = cv2.imread('testImage_1.jpg', cv2.IMREAD_GRAYSCALE)
if image is None:
    raise FileNotFoundError("Make sure 'path_image.png' is in the same directory.")

# Preprocessing: blur and edge detection
blurred = cv2.GaussianBlur(image, (5, 5), 0)
edges = cv2.Canny(blurred, 50, 150)

# Find contours (assumes path is largest contour)
contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
if not contours:
    raise ValueError("No contours found in image.")
path_contour = max(contours, key=cv2.contourArea)
path_points = path_contour.squeeze().astype(np.float32)

# === Step 2: Compute 2D to 3D projection ===

# Define 3D plane points (rectangle in XY plane, can be changed)
P0 = np.array([10, -10, 10])
P1 = np.array([10, 10, 10])
P2 = np.array([-10, 10, -10])
P3 = np.array([-10, -10, -10])

# Define image corners and unit square for homography
h, w = image.shape
src_quad = np.array([[0, 0], [w, 0], [w, h], [0, h]], dtype=np.float32)
dst_quad = np.array([[0, 0], [1, 0], [1, 1], [0, 1]], dtype=np.float32)

# Compute homography
H, _ = cv2.findHomography(src_quad, dst_quad)
path_normalized = cv2.perspectiveTransform(path_points.reshape(-1, 1, 2), H).reshape(-1, 2)

# Bilinear interpolation function
def bilinear_interpolate_plane(u, v):
    return (1 - u) * (1 - v) * P0 + u * (1 - v) * P1 + u * v * P2 + (1 - u) * v * P3

# Map 2D path to 3D plane
path_3d = np.array([bilinear_interpolate_plane(u, v) for u, v in path_normalized])

# === Step 3: Visualize and export ===

fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')

# Plot plane
plane = np.array([P0, P1, P2, P3])
ax.add_collection3d(Poly3DCollection([plane], facecolors='lightgray', alpha=0.5))

# Plot path
ax.plot(path_3d[:, 0], path_3d[:, 1], path_3d[:, 2], color='red', linewidth=2)

# Set 3D limits and aspect ratio
ax.set_xlim(-10, 10)
ax.set_ylim(-10, 10)
ax.set_zlim(-10, 10)
ax.set_box_aspect([1, 1, 0.2])

ax.set_title("Path Projected on 3D Plane")
plt.tight_layout()
plt.savefig("path_projected.png")
