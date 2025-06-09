import cv2
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import time
import os
import re

# Generate a 3d path on canvas based on the 4 corners. Should be given like np.array([X, Y, Z])
def get_3d_path_from_image(image, P0, P1, P2, P3):
    """Processes an image to extract and project a 2D path into 3D space."""
    # Load image and extract contour

  
    
    print("Start processing")
    image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    blurred = cv2.GaussianBlur(image, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        raise ValueError("No contours found in image.")
    
    path_2d = max(contours, key=cv2.contourArea).squeeze().astype(np.float32)
    
    # Normalize path to unit square
    h, w = image.shape[:2]
    src_quad = np.array([[0, 0], [w, 0], [w, h], [0, h]], dtype=np.float32)
    dst_quad = np.array([[0, 0], [1, 0], [1, 1], [0, 1]], dtype=np.float32)
    H, _ = cv2.findHomography(src_quad, dst_quad)
    path_normalized = cv2.perspectiveTransform(path_2d.reshape(-1, 1, 2), H).reshape(-1, 2)

    # Map normalized path to 3D plane
    def bilinear_interpolate(u, v):
        return (1 - u) * (1 - v) * P0 + u * (1 - v) * P1 + u * v * P2 + (1 - u) * v * P3

    path_3d = np.array([bilinear_interpolate(u, v) for u, v in path_normalized])
    return path_3d

import os
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import numpy as np

async def visualize_path_3d(path_3d, P0, P1, P2, P3, output_file='path_projected.png', folder='plots'):
    os.makedirs(folder, exist_ok=True)
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

    # Handle filename uniqueness with a numeric counter
    base, ext = os.path.splitext(output_file)
    final_output_file = os.path.join(folder, output_file)
    counter = 1
    while os.path.exists(final_output_file):
        suffix = f"_{counter:04d}"  # zero-padded to 4 digits
        final_output_file = os.path.join(folder, f"{base}{suffix}{ext}")
        counter += 1

    # Save file
    plt.savefig(final_output_file)
    plt.close(fig)
    print(f"Graph has been saved to {final_output_file}")

    return True

