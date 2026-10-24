#!/usr/bin/env python3
"""
APEX TRAFFIC AI - Production Server
Bridges Python OpenCV + YOLOv8 + ByteTrack AI Engine with the Web Interface.
Serves:
- Real-time MJPEG live video streams (/video_feed/<road_id>)
- Real-time Server-Sent Events (SSE) Detection Stream (/api/stream/events)
- Live AI Telemetry API (/api/telemetry)
- Multi-video Upload API (/api/upload)
- Dataset Video Selection API (/api/select-video)
- Static Frontend Assets
"""

import http.server
import socketserver
import os
import sys
import json
import time
import mimetypes
from pathlib import Path
from urllib.parse import urlparse, parse_qs

# Ensure UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 3000
WEB_DIR = Path(__file__).resolve().parent
PROJECT_DIR = WEB_DIR.parent / "SmartTrafficSystem"
MODEL_PATH = WEB_DIR.parent / "yolov8n.pt"
if not MODEL_PATH.exists():
    MODEL_PATH = PROJECT_DIR / "src" / "yolov8n.pt"

VIDEOS_DIR = PROJECT_DIR / "reports" / "videos"
UPLOADS_DIR = WEB_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Import the AI Engine
from ai_engine import TrafficSystemEngine

# Initialize the 3 Surveillance Video Paths
default_videos = {
    "road_a": VIDEOS_DIR / "v1.mp4",
    "road_b": VIDEOS_DIR / "v2.mp4",
    "road_c": VIDEOS_DIR / "v3.mp4",
}

print("=======================================================")
print("[STARTING] Initializing AI Traffic Engine...")
ai_engine = TrafficSystemEngine(MODEL_PATH, default_videos)
print("[READY] AI Traffic Engine initialized successfully.")
print("=======================================================")

class ApexTrafficHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def do_HEAD(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith("/video_feed/"):
            self.send_response(200)
            self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=frame')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            return

        if path.startswith("/videos/"):
            filename = path.replace("/videos/", "").strip("/")
            file_path = VIDEOS_DIR / filename
            if not file_path.exists():
                file_path = PROJECT_DIR / "data" / "input_videos" / filename
            if file_path.exists():
                file_size = file_path.stat().st_size
                self.send_response(200)
                self.send_header("Content-Type", "video/mp4")
                self.send_header("Content-Length", str(file_size))
                self.send_header("Accept-Ranges", "bytes")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                return

        return super().do_HEAD()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 1. Live MJPEG Stream for Road A, B, or C (Full Color, Smooth, No Codec Barrier)
        if path.startswith("/video_feed/"):
            road_id = path.replace("/video_feed/", "").strip("/").split("?")[0]
            if road_id in ai_engine.roads:
                self.send_response(200)
                self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=frame')
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Expires', '0')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()

                road = ai_engine.roads[road_id]
                try:
                    while True:
                        jpeg_bytes = road.get_jpeg()
                        if jpeg_bytes:
                            self.wfile.write(b'--frame\r\n')
                            self.send_header('Content-Type', 'image/jpeg')
                            self.send_header('Content-Length', str(len(jpeg_bytes)))
                            self.end_headers()
                            self.wfile.write(jpeg_bytes)
                            self.wfile.write(b'\r\n')
                        time.sleep(0.035)  # Smooth ~28 FPS streaming pace
                except (ConnectionResetError, BrokenPipeError):
                    return
                except Exception:
                    return

        # 2. Server-Sent Events (SSE) Live Detection & Telemetry Stream
        if path == "/api/stream/events":
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache, no-transform')
            self.send_header('Connection', 'keep-alive')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            try:
                while True:
                    telemetry = ai_engine.get_telemetry_dict()
                    payload = f"data: {json.dumps(telemetry)}\n\n"
                    self.wfile.write(payload.encode('utf-8'))
                    self.wfile.flush()
                    time.sleep(0.1)  # 10 updates per second
            except (ConnectionResetError, BrokenPipeError):
                return
            except Exception:
                return

        # 3. Live Telemetry API (Instant JSON)
        if path == "/api/telemetry" or path == "/api/traffic-data":
            telemetry = ai_engine.get_telemetry_dict()
            self._send_json(telemetry)
            return

        # 4. Settings API (GET)
        if path == "/api/settings":
            settings_data = {
                "weights": ai_engine.weights,
                "min_green": ai_engine.min_green,
                "max_green": ai_engine.max_green,
                "max_streak": ai_engine.max_streak,
                "starvation_threshold": ai_engine.starvation_threshold
            }
            self._send_json(settings_data)
            return

        # Static file fallback
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 1. Dataset Video Selection API (v1.mp4, v2.mp4, v3.mp4)
        if path == "/api/select-video":
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(body)
                road_id = data.get("road", "road_a")
                video_name = data.get("video", "v1.mp4")
                video_file = VIDEOS_DIR / video_name
                if not video_file.exists():
                    video_file = PROJECT_DIR / "data" / "input_videos" / video_name
                if not video_file.exists():
                    video_file = UPLOADS_DIR / video_name

                if video_file.exists() and road_id in ai_engine.roads:
                    ai_engine.roads[road_id].change_video(video_file)
                    print(f"[SELECT] Road {road_id} switched to: {video_file}")
                    self._send_json({
                        "status": "success", 
                        "road": road_id, 
                        "video": video_name,
                        "video_url": f"/video_feed/{road_id}"
                    })
                else:
                    self._send_json({"status": "error", "message": f"File {video_name} not found"}, 404)
            except Exception as e:
                self._send_json({"status": "error", "message": str(e)}, 400)
            return

        # 2. Video Upload API (Road A, B, or C)
        if path == "/api/upload":
            content_length = int(self.headers.get('Content-Length', 0))
            query = parse_qs(parsed.query)
            road_id = query.get('road', ['road_a'])[0]
            filename = query.get('filename', [f"{road_id}_uploaded.mp4"])[0]

            save_filename = f"{road_id}_{int(time.time())}_{filename}"
            save_path = UPLOADS_DIR / save_filename
            with open(save_path, "wb") as f:
                f.write(self.rfile.read(content_length))

            if road_id in ai_engine.roads:
                ai_engine.roads[road_id].change_video(save_path)
                print(f"[UPLOAD] Road {road_id} updated with new video: {save_path}")
                self._send_json({
                    "status": "success",
                    "road": road_id,
                    "video_url": f"/video_feed/{road_id}",
                    "message": f"Video uploaded and active for {ai_engine.roads[road_id].road_name}."
                })
            else:
                self._send_json({"status": "error", "message": f"Invalid road id: {road_id}"}, 400)
            return

        self.send_error(404, "Endpoint not found")

    def _send_json(self, data, code=200):
        data_bytes = json.dumps(data).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(data_bytes)))
        self.end_headers()
        self.wfile.write(data_bytes)


def run_server():
    server_address = ("", PORT)
    httpd = http.server.ThreadingHTTPServer(server_address, ApexTrafficHandler)
    httpd.daemon_threads = True
    print(f"=======================================================")
    print(f"🚀 SMART TRAFFIC MANAGEMENT SYSTEM Running")
    print(f"📍 Local Interface: http://localhost:{PORT}")
    print(f"📍 Road A Stream:   http://localhost:{PORT}/video_feed/road_a")
    print(f"📍 Road B Stream:   http://localhost:{PORT}/video_feed/road_b")
    print(f"📍 Road C Stream:   http://localhost:{PORT}/video_feed/road_c")
    print(f"📍 SSE Stream:      http://localhost:{PORT}/api/stream/events")
    print(f"📍 Real-time API:   http://localhost:{PORT}/api/telemetry")
    print(f"=======================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[STOPPING] Shutting down server...")
        httpd.server_close()

if __name__ == "__main__":
    run_server()
