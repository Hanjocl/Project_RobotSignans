import cv2
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import time
import os

# Generate a 3d path on canvas based on the 4 corners. Should be given like np.array([X, Y, Z])
import numpy as np
import cv2

def get_3d_path_from_image(image, P0, P1, P2, P3, segment_length=0.1):
    """Processes an image to extract and project a 2D path into 3D space with controllable segment length."""

    blurred = cv2.GaussianBlur(image, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        raise ValueError("No contours found in image.")

    path_2d = max(contours, key=cv2.contourArea).squeeze().astype(np.float32)
    
    h, w = image.shape[:2]
    src_quad = np.array([[0, 0], [w, 0], [w, h], [0, h]], dtype=np.float32)
    dst_quad = np.array([[0, 0], [1, 0], [1, 1], [0, 1]], dtype=np.float32)
    H, _ = cv2.findHomography(src_quad, dst_quad)
    path_normalized = cv2.perspectiveTransform(path_2d.reshape(-1, 1, 2), H).reshape(-1, 2)

    # Resample path to have points spaced approximately by segment_length
    def resample_path(path, segment_length):
        # Compute cumulative distances
        diffs = np.diff(path, axis=0)
        dists = np.sqrt((diffs ** 2).sum(axis=1))
        cumulative = np.insert(np.cumsum(dists), 0, 0)
        total_length = cumulative[-1]

        # Number of segments
        num_points = max(int(np.ceil(total_length / segment_length)) + 1, 2)
        new_distances = np.linspace(0, total_length, num_points)

        # Interpolate for new points
        new_path = np.empty((num_points, 2), dtype=np.float32)
        new_path[:,0] = np.interp(new_distances, cumulative, path[:,0])
        new_path[:,1] = np.interp(new_distances, cumulative, path[:,1])
        return new_path

    path_resampled = resample_path(path_normalized, segment_length)

    def bilinear_interpolate(u, v):
        return (1 - u) * (1 - v) * P0 + u * (1 - v) * P1 + u * v * P2 + (1 - u) * v * P3

    path_3d = np.array([bilinear_interpolate(u, v) for u, v in path_resampled])
    return path_3d


def visualize_path_3d(path_3d, P0, P1, P2, P3, output_file='path_projected.png', folder='plots'):
    """Visualizes the 3D path and saves the plot."""
    fig = plt.figure()
    ax = fig.add_subplot(111, projection='3d')

    # Plot 3D plane
    plane = np.array([P0, P1, P2, P3])
    ax.add_collection3d(Poly3DCollection([plane], facecolors='lightgray', alpha=0.5))

    # Plot 3D path
    ax.plot(path_3d[:, 0], path_3d[:, 1], path_3d[:, 2], color='red', linewidth=2)

    ax.set_xlim(-300, 300)
    ax.set_ylim(-300, 300)
    ax.set_zlim(-2000, 0)
    ax.set_box_aspect([1, 1, 1])
    ax.view_init(elev=30, azim=135)
    ax.set_title("Path Projected on 3D Plane")

    plt.tight_layout()


    # Ensure the folder exists, create it if it doesn't
    if not os.path.exists(folder):
        os.makedirs(folder)

    # Add timestamp to the file name to avoid overwriting
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    base, ext = os.path.splitext(output_file)
    output_file = f"{base}_{timestamp}{ext}"
    output_file = os.path.join(folder, f"{base}_{timestamp}{ext}")
    
    # Save file
    plt.savefig(output_file)
    print(f"Graph has been saved to {output_file}")
