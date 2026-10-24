from ultralytics import YOLO
import cv2
import json

# Load YOLO model
model = YOLO("yolov8n.pt")

# Vehicle weights
WEIGHTS = {
    "motorcycle": 1,
    "car": 2,
    "bus": 4,
    "truck": 5
}

VIDEOS = {
    "Road 1": "../data/input_videos/v1.mp4",
    "Road 2": "../data/input_videos/v2.mp4",
    "Road 3": "../data/input_videos/v3.mp4"
}


def analyze_road(video_path):

    cap = cv2.VideoCapture(video_path)

    frame_number = 0
    traffic_scores = []

    total_cars = 0
    total_motorcycles = 0
    total_buses = 0
    total_trucks = 0

    sampled_frames = 0

    while True:

        ret, frame = cap.read()

        if not ret:
            break

        frame_number += 1

        # Analyze every 15th frame
        if frame_number % 15 != 0:
            continue

        sampled_frames += 1

        results = model(frame, verbose=False)

        score = 0

        frame_cars = 0
        frame_motorcycles = 0
        frame_buses = 0
        frame_trucks = 0

        for box in results[0].boxes:

            class_id = int(box.cls[0])
            class_name = model.names[class_id]

            if class_name == "car":
                frame_cars += 1
                score += WEIGHTS["car"]

            elif class_name == "motorcycle":
                frame_motorcycles += 1
                score += WEIGHTS["motorcycle"]

            elif class_name == "bus":
                frame_buses += 1
                score += WEIGHTS["bus"]

            elif class_name == "truck":
                frame_trucks += 1
                score += WEIGHTS["truck"]

        total_cars += frame_cars
        total_motorcycles += frame_motorcycles
        total_buses += frame_buses
        total_trucks += frame_trucks

        traffic_scores.append(score)

    cap.release()

    if sampled_frames == 0:
        sampled_frames = 1

    if len(traffic_scores) == 0:
        traffic_scores = [0]

    return {
        "cars": round(total_cars / sampled_frames),
        "motorcycles": round(total_motorcycles / sampled_frames),
        "buses": round(total_buses / sampled_frames),
        "trucks": round(total_trucks / sampled_frames),

        "min_score": min(traffic_scores),
        "max_score": max(traffic_scores),
        "avg_score": round(sum(traffic_scores) / len(traffic_scores), 2)
    }


road_stats = {}

print("\nAnalyzing Traffic Density...\n")

for road, path in VIDEOS.items():
    road_stats[road] = analyze_road(path)

for road, stats in road_stats.items():

    print("=" * 40)
    print(road)
    print("=" * 40)

    print(f"Cars        : {stats['cars']}")
    print(f"Motorcycles : {stats['motorcycles']}")
    print(f"Buses       : {stats['buses']}")
    print(f"Trucks      : {stats['trucks']}")
    print()

    print(f"Min Score   : {stats['min_score']}")
    print(f"Max Score   : {stats['max_score']}")
    print(f"Avg Score   : {stats['avg_score']}")
    print()

green_road = max(
    road_stats,
    key=lambda road: road_stats[road]["avg_score"]
)

avg_score = road_stats[green_road]["avg_score"]

if avg_score <= 20:
    green_time = 15
elif avg_score <= 40:
    green_time = 30
elif avg_score <= 60:
    green_time = 45
else:
    green_time = 60

print("=" * 40)
print("SMART TRAFFIC DECISION")
print("=" * 40)

print(f"GREEN SIGNAL : {green_road}")
print(f"GREEN TIME   : {green_time} sec")

print("=" * 40)

# Save data for dashboard

dashboard_data = {
    "roads": road_stats,
    "green_signal": green_road,
    "green_time": green_time
}

with open("../reports/traffic_data.json", "w") as file:
    json.dump(dashboard_data, file, indent=4)

print("Traffic data saved to reports/traffic_data.json")