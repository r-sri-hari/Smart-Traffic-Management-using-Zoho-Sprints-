import cv2
from pathlib import Path

# -----------------------------
# CONFIG
# -----------------------------
BASE_DIR = Path(r"D:\SmartTrafficSystem\SmartTrafficSystem")

# ✅ YOUR ACTUAL LOCATION (CONFIRMED)
INPUT_DIR = BASE_DIR / "reports" / "videos"

# Output can stay same folder or separate (recommended separate)
OUTPUT_DIR = BASE_DIR / "reports" / "videos"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# -----------------------------
# VIDEO WRITER (SAFE)
# -----------------------------
def create_writer(output_path, fps, width, height):

    codecs = [
        ("mp4v", ".mp4"),
        ("XVID", ".avi"),
        ("avc1", ".mp4"),
    ]

    for codec, ext in codecs:
        fourcc = cv2.VideoWriter_fourcc(*codec)
        path = output_path.with_suffix(ext)

        writer = cv2.VideoWriter(str(path), fourcc, fps, (width, height))

        if writer.isOpened():
            print(f"[INFO] Using codec: {codec} → {path}")
            return writer, path

    raise Exception("No valid codec found!")


# -----------------------------
# PROCESS VIDEO
# -----------------------------
def process_video(input_path: Path, output_name: str):

    print(f"\n[PROCESSING] {input_path}")

    cap = cv2.VideoCapture(str(input_path))

    if not cap.isOpened():
        print(f"[ERROR] Cannot open video: {input_path}")
        return None

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0 or fps is None:
        fps = 30

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    writer, final_path = create_writer(
        OUTPUT_DIR / output_name,
        fps,
        width,
        height
    )

    frame_count = 0

    while True:
        ret, frame = cap.read()

        if not ret:
            break

        # -----------------------------
        # YOLO / DETECTION HOOK (OPTIONAL)
        # -----------------------------
        # frame = model(frame)

        writer.write(frame)
        frame_count += 1

    cap.release()
    writer.release()

    print(f"[DONE] Saved: {final_path} | Frames: {frame_count}")

    return final_path


# -----------------------------
# RUN ALL VIDEOS
# -----------------------------
if __name__ == "__main__":

    videos = {
        "v1": INPUT_DIR / "v1.mp4",
        "v2": INPUT_DIR / "v2.mp4",
        "v3": INPUT_DIR / "v3.mp4",
    }

    results = {}

    for name, path in videos.items():

        if not path.exists():
            print(f"[ERROR] File not found: {path}")
            results[name] = None
            continue

        output_file = f"{name}_processed.mp4"
        results[name] = process_video(path, output_file)

    print("\n====================")
    print("PROCESS COMPLETE")
    print(results)