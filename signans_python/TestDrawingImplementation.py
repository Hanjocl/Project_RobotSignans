import cv2
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

# Step 1: Analyze the Image for Pencil Streaks
def detect_streaks(image_path):
    # Load the image in grayscale
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    
    # Apply thresholding to emphasize streaks (binary image)
    ret, thresh = cv2.threshold(image, 127, 255, cv2.THRESH_BINARY)
    
    # Find contours in the thresholded image
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    return contours

# Step 2: Generate a New Image Based on the Detected Pencil Streaks
def generate_streak_image(image, contours):
    # Create a blank image of the same size as the original image
    new_image = np.zeros_like(image)
    
    # Draw the detected contours (streaks) on the blank image
    cv2.drawContours(new_image, contours, -1, (255, 255, 255), 1)
    
    return new_image

# Step 3: Map the Detected Streaks to 3D Space using Perspective Transform
def map_to_3d(streak_points_2d, pts_2d, pts_3d):
    # Compute the homography matrix to map 2D points to 3D space
    H, _ = cv2.findHomography(pts_2d, pts_3d)
    
    # Apply homography to the 2D points (detected streaks)
    streak_points_3d = cv2.perspectiveTransform(np.array([streak_points_2d], dtype=np.float32), H)
    
    return streak_points_3d

# Step 4: Export the Mapped Path as GCODE
def generate_gcode(path):
    gcode = []
    gcode.append("G21")  # Set units to mm
    gcode.append("G90")  # Absolute positioning
    
    # Generate G-code for the 3D path (move through points)
    for point in path:
        gcode.append(f"G1 X{point[0]} Y{point[1]} Z{point[2]} F1500")  # Linear movement command
    
    gcode.append("M30")  # End of program
    return gcode

# Step 5: Visualize the Path Mapped onto the 3D Plane and Save as an Image
def plot_3d_path(streak_points_3d, output_image_path):
    # Extract x, y, and z coordinates
    x = streak_points_3d[:, 0]
    y = streak_points_3d[:, 1]
    z = streak_points_3d[:, 2]

    # Create a 3D plot
    fig = plt.figure()
    ax = fig.add_subplot(111, projection='3d')

    # Plot the points as a path (line plot with markers)
    ax.plot(x, y, z, marker='o', linestyle='-', color='b')  # Line plot with markers

    # Set axis labels
    ax.set_xlabel('X')
    ax.set_ylabel('Y')
    ax.set_zlabel('Z')

    # Set title
    ax.set_title('3D Path of Pencil Streaks')

    # Save the plot as an image
    plt.savefig(output_image_path, dpi=300)  # Save with high resolution
    plt.close()  # Close the plot to avoid display

# Main execution
def main(image_path, output_image_path):
    # Known 3D coordinates of the panel corners (replace these with your actual values)
    pts_3d = np.array([[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0]], dtype=np.float32)
    
    # Known 2D coordinates of the panel corners in the image
    pts_2d = np.array([[50, 50], [400, 50], [400, 400], [50, 400]], dtype=np.float32)
    
    # Step 1: Detect streaks in the image
    contours = detect_streaks(image_path)
    
    # Step 2: Generate an image with the detected streaks
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    streak_image = generate_streak_image(image, contours)
    
    # Optionally: Save the generated streak image
    cv2.imwrite('generated_streak_image.png', streak_image)
    
    # Step 3: Map detected streaks to 3D space
    # Extract the points from the contours (example: take the centroid or boundary points of each contour)
    streak_points_2d = []
    for contour in contours:
        for point in contour:
            streak_points_2d.append(point[0])
    
    # Map the 2D streak points to 3D space
    streak_points_3d = map_to_3d(streak_points_2d, pts_2d, pts_3d)
    
    # Step 4: Generate the G-code from the mapped 3D path
    gcode = generate_gcode(streak_points_3d)
    with open('output.gcode', 'w') as f:
        f.write("\n".join(gcode))
    
    # Step 5: Visualize the mapped 3D path and save it as an image
    plot_3d_path(streak_points_3d, output_image_path)

# Run the main function
image_path = 'testImage_1.jpg'  # Replace with the path to your image
output_image_path = 'mapped_3d_path.png'  # Path to save the 3D visualization image
main(image_path, output_image_path)
