from ultralytics import YOLO
import cv2

# Load YOLO model
model = YOLO("yolov8n.pt")

# Vehicle classes in COCO dataset
VEHICLE_CLASSES = {
    "car",
    "bus",
    "truck",
    "motorcycle"
}

video_path = "../data/input_videos/v1.mp4"

cap = cv2.VideoCapture(video_path)

frame_count = 0

while True:
    ret, frame = cap.read()

    if not ret:
        break

    frame_count += 1

    # Process every 10th frame to improve speed
    if frame_count % 10 != 0:
        continue

    results = model(frame, verbose=False)

    vehicle_count = 0

    for box in results[0].boxes:
        class_id = int(box.cls[0])
        class_name = model.names[class_id]

        if class_name in VEHICLE_CLASSES:
            vehicle_count += 1

    print(f"Frame {frame_count}: {vehicle_count} vehicles")

cap.release()

print("Processing Complete")