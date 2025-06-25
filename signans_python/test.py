from os import path
import cv2
import numpy as np
import matplotlib.pyplot as plt
from path_processing import image_to_path

print("Processing...")
image_path = 'Test images/testImage_1.jpg'  # Replace with your actual path
image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

if image is None:
    raise FileNotFoundError(f"Could not load image: {image_path}")

path_2d = image_to_path(image)

if path_2d is None:
    raise RuntimeError("Invalid path")

# --- Plot the result ---
plt.figure(figsize=(8, 8))
plt.imshow(image, cmap='gray')

# Plot the path with transparency (alpha < 1)
plt.plot(path_2d[:, 0], path_2d[:, 1], color='red', linewidth=1, alpha=0.6)

# Scatter all points as small dots
plt.scatter(path_2d[:, 0], path_2d[:, 1], color='yellow', s=2, alpha=0.5)

# Highlight start and end points
plt.scatter(path_2d[0, 0], path_2d[0, 1], color='green', s=60, label='Start')
plt.scatter(path_2d[-1, 0], path_2d[-1, 1], color='blue', s=60, label='End')

plt.title("Extracted 2D Path with Transparency (Overlaps Darken)")
plt.axis('off')
plt.legend()
plt.show()
