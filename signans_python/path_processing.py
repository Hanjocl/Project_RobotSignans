import cv2
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import time
import os


def get_3d_path_from_image(image, P0, P1, P2, P3, segment_length=4.0):
    """Processes an image to extract and project a 2D path into 3D space with controllable segment length."""
    try:
        # --- Input check ---
        if image is None:
            raise ValueError("Image is None.")
        print(f"[DEBUG] Image shape: {image.shape}, dtype: {image.dtype}")

        if len(image.shape) == 3:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            print("[DEBUG] Converted image to grayscale.")

        # --- Blur and edge detection ---
        blurred = cv2.GaussianBlur(image, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        print(f"[DEBUG] Edges shape: {edges.shape}, unique values: {np.unique(edges)}")
        if np.count_nonzero(edges) == 0:
            raise ValueError("No edges found in image.")
        
        # --- Find contours ---
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        print(f"[DEBUG] Number of contours found: {len(contours)}")
        if not contours:
            raise ValueError("No contours found in image.")
        
        # --- Get largest contour ---
        path_2d = max(contours, key=cv2.contourArea).squeeze()
        print(f"[DEBUG] path_2d shape after squeeze: {path_2d.shape}")
        
        if path_2d.ndim != 2 or path_2d.shape[1] != 2:
            raise ValueError(f"Unexpected path_2d shape: {path_2d.shape}")

        path_2d = path_2d.astype(np.float32)
        print(f"[DEBUG] First 5 2D path points:\n{path_2d[:5]}")

        # --- Normalize to unit square ---
        h, w = image.shape[:2]
        print(f"[DEBUG] Image dimensions: width={w}, height={h}")
        src_quad = np.array([[0, 0], [w, 0], [w, h], [0, h]], dtype=np.float32)
        dst_quad = np.array([[0, 0], [1, 0], [1, 1], [0, 1]], dtype=np.float32)
        H, status = cv2.findHomography(src_quad, dst_quad)
        print(f"[DEBUG] Homography matrix:\n{H}\nStatus: {status}")

        if H is None:
            raise RuntimeError("Homography computation failed.")

        path_normalized = cv2.perspectiveTransform(path_2d.reshape(-1, 1, 2), H).reshape(-1, 2)
        print(f"[DEBUG] First 5 normalized 2D path points:\n{path_normalized[:5]}")

        # --- Bilinear interpolation to 3D ---
        print(f"[DEBUG] Corner points:\nP0={P0}, P1={P1}, P2={P2}, P3={P3}")

        def bilinear_interpolate(u, v):
            return (1 - u) * (1 - v) * P0 + u * (1 - v) * P1 + u * v * P2 + (1 - u) * v * P3

        path_3d = np.array([bilinear_interpolate(u, v) for u, v in path_normalized], dtype=np.float32)
        print(f"[DEBUG] First 5 3D path points:\n{path_3d[:5]}")
        print(f"[DEBUG] Total number of 3D points: {len(path_3d)}")

        # --- Resample 3D path ---
        def resample_path_3d(path, segment_length):
            diffs = np.diff(path, axis=0)
            dists = np.linalg.norm(diffs, axis=1)
            cumulative = np.insert(np.cumsum(dists), 0, 0)
            total_length = cumulative[-1]
            print(f"[DEBUG] Total path length: {total_length}, Segment length: {segment_length}")

            num_points = max(int(np.ceil(total_length / segment_length)) + 1, 2)
            new_distances = np.linspace(0, total_length, num_points)
            print(f"[DEBUG] Resampling to {num_points} points.")

            new_path = np.empty((num_points, 3), dtype=np.float32)
            for i in range(3):
                new_path[:, i] = np.interp(new_distances, cumulative, path[:, i])
            return new_path

        path_resampled_3d = resample_path_3d(path_3d, segment_length)
        print(f"[DEBUG] Resampled path shape: {path_resampled_3d.shape}")
        print(f"[DEBUG] First 5 resampled 3D points:\n{path_resampled_3d[:5]}")

        return path_resampled_3d
    except Exception as e:
        print(f"[ERROR] {e}")
        return None


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
    ax.set_title("Path Projected on 3D Plane (not to scale/ratio)")

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

