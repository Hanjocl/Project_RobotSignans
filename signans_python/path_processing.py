import cv2
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import time
import os
import re


async def get_3d_path_from_image(image, P0, P1, P2, P3, segment_length=4.0):
    """Processes an image to extract and project a 2D path into 3D space with controllable segment length."""
    try:
        # --- Input check ---
        if image is None:
            raise ValueError("Image is None.")
        
        # Convert img to grayscale if not already
        if len(image.shape) != 2:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        path_2d = image_to_path(image)
        
        # --- Normalize to unit square ---
        h, w = image.shape[:2]
        src_quad = np.array([[0, 0], [w, 0], [w, h], [0, h]], dtype=np.float32)
        dst_quad = np.array([[0, 0], [1, 0], [1, 1], [0, 1]], dtype=np.float32)
        H, status = cv2.findHomography(src_quad, dst_quad)

        if H is None:
            raise RuntimeError("Homography computation failed.")

        path_normalized = cv2.perspectiveTransform(path_2d.reshape(-1, 1, 2), H).reshape(-1, 2)

        # --- Bilinear interpolation to 3D ---

        def bilinear_interpolate(u, v):
            return (1 - u) * (1 - v) * P0 + u * (1 - v) * P1 + u * v * P2 + (1 - u) * v * P3

        path_3d = np.array([bilinear_interpolate(u, v) for u, v in path_normalized], dtype=np.float32)

        # --- Resample 3D path ---
        def resample_path_3d(path, segment_length, min_segment_length=0.1):
            # Compute differences and distances between consecutive points
            diffs = np.diff(path, axis=0)
            dists = np.linalg.norm(diffs, axis=1)

            # Filter out segments that are too small by merging points
            # We will keep only points where distance to previous is >= min_segment_length

            filtered_points = [path[0]]
            for i, dist in enumerate(dists):
                if dist >= min_segment_length:
                    filtered_points.append(path[i + 1])

            filtered_points = np.array(filtered_points)

            # Now resample based on segment_length on filtered points
            diffs = np.diff(filtered_points, axis=0)
            dists = np.linalg.norm(diffs, axis=1)
            cumulative = np.insert(np.cumsum(dists), 0, 0)
            total_length = cumulative[-1]

            num_points = max(int(np.ceil(total_length / segment_length)) + 1, 2)
            new_distances = np.linspace(0, total_length, num_points)

            new_path = np.empty((num_points, 3), dtype=np.float32)
            for i in range(3):
                new_path[:, i] = np.interp(new_distances, cumulative, filtered_points[:, i])

            return new_path


        path_resampled_3d = resample_path_3d(path_3d, segment_length)

        return path_resampled_3d, path_2d
    
    except Exception as e:
        print(f"[ERROR] {e}")
        return None

def image_to_path(image):
    # Ensure image is binary (0 or 255)
    _, binary = cv2.threshold(image, 80, 160, cv2.THRESH_BINARY)
    
    # Invert image for thinning (thinning expects foreground=1)
    binary_inv = cv2.bitwise_not(binary)

    # Perform thinning (skeletonization)
    skeleton = cv2.ximgproc.thinning(binary_inv)

    # Find contours on skeleton image
    contours, _ = cv2.findContours(image=skeleton, mode=cv2.RETR_TREE, method=cv2.CHAIN_APPROX_NONE)

    if not contours:
        raise ValueError("No contours found in skeletonized image.")

    # Get largest contour as path
    path_2d = max(contours, key=cv2.contourArea).squeeze()

    # Ensure correct shape (N, 2)
    if path_2d.ndim != 2 or path_2d.shape[1] != 2:
        raise ValueError(f"Unexpected path_2d shape: {path_2d.shape}")

    path_2d = path_2d.astype(np.float32)

    return path_2d

async def visualize_path_3d(path_3d, P0, P1, P2, P3, output_file='path_projected.jpg', folder='plots'):
    os.makedirs(folder, exist_ok=True)
    """Visualizes the 3D path and saves the plot."""

    fig = plt.figure()
    ax = fig.add_subplot(111, projection='3d')
    

    # Plot 3D plane
    plane = np.array([P0, P1, P2, P3])
    ax.add_collection3d(Poly3DCollection([plane], facecolors='lightgray', alpha=0.5))

    # Plot 3D path
    ax.plot(path_3d[:, 0], path_3d[:, 1], path_3d[:, 2], color='red', linewidth=2)
    
    # Plot dots for each point
    ax.scatter(path_3d[:, 0], path_3d[:, 1], path_3d[:, 2], color='blue', s=10, label='Path Points')


    ax.set_xlim(-1000, 0)
    ax.set_ylim(-500, 500)
    ax.set_zlim(-2000, 0)
    ax.set_box_aspect([1, 1, 2])
    ax.view_init(elev=20, azim=315)
    ax.set_title("Path Projected on 3D Plane (not to scale/ratio)")
    
    # Add subtitle with current date and time below the title
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    subtitle = f"[{timestamp}]"
    # Position subtitle slightly below title using fig.suptitle with y-position
    fig.suptitle(subtitle, fontsize=10, y=0.92, alpha=0.7)

    plt.tight_layout(rect=[0, 0, 1, 0.9])  # Adjust layout to make space for suptitle

    # Handle filename uniqueness with a numeric counter
    prefix, ext = os.path.splitext(output_file)
    final_output_file = os.path.join(folder, output_file)
    

    existing_files = os.listdir(folder)
    frame_numbers = []
    pattern = re.compile(rf"{re.escape(prefix)}(\d{{4}}){re.escape(ext)}")
    
    for filename in existing_files:
        match = pattern.match(filename)
        if match:
            frame_numbers.append(int(match.group(1)))
    
    if frame_numbers:
        next_num = max(frame_numbers) + 1
    else:
        next_num = 1
    
    final_output_file = os.path.join(folder, f"{prefix}{next_num:04d}{ext}")

    # Save file
    plt.savefig(final_output_file)
    plt.close(fig)
    print(f"Graph has been saved to {final_output_file}")

    return True

