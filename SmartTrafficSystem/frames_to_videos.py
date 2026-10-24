import cv2
import os

# Dataset folder
image_folder = r"D:\Intern\Dataset Train\MVI_39211"

# Output video
output_video = r"D:\Intern\MVI_39211.mp4"

# Get image files
images = [
    img for img in os.listdir(image_folder)
    if img.lower().endswith(('.jpg', '.jpeg', '.png'))
]

# Sort images
images.sort()

if len(images) == 0:
    print("No images found!")
    exit()

# Read first image
first_frame = cv2.imread(os.path.join(image_folder, images[0]))
height, width, _ = first_frame.shape

# Create video writer
video = cv2.VideoWriter(
    output_video,
    cv2.VideoWriter_fourcc(*'mp4v'),
    30,
    (width, height)
)

# Write frames
for image in images:
    frame = cv2.imread(os.path.join(image_folder, image))
    if frame is not None:
        video.write(frame)

video.release()

print(f"Video saved at: {output_video}")