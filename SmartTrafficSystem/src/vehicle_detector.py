from ultralytics import YOLO
import cv2

model = YOLO("yolov8n.pt")

video_path = "../data/input_videos/v1.mp4"

cap = cv2.VideoCapture(video_path)

print("Video Opened:", cap.isOpened())

while True:
    ret, frame = cap.read()

    if not ret:
        print("Video Ended")
        break

    results = model(frame, verbose=False)

    annotated_frame = results[0].plot()

    cv2.imshow("YOLO Detection", annotated_frame)

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()