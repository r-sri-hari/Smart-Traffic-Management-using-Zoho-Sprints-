# 🚦 AI-Powered Smart Traffic Management System

> **Minimalist Modern Smart Traffic Management System**  
> A clean, production-grade academic traffic control platform with real-time YOLOv8 vehicle detection, ByteTrack multi-object tracking, asynchronous non-blocking video inference, Server-Sent Events (SSE) telemetry streaming, and adaptive green signal allocation.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Exact Page Layout](#-exact-page-layout)
3. [Technology Stack](#-technology-stack)
4. [Folder Structure](#-folder-structure)
5. [Prerequisites](#-prerequisites)
6. [Installation](#-installation)
7. [Project Execution](#-project-execution)
8. [API Endpoints Reference](#-api-endpoints-reference)
9. [Verification & Health Checks](#-verification--health-checks)
10. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🌟 Project Overview

The **Smart Traffic Management System** transforms urban intersections into adaptive, real-time autonomous control nodes. By continuously processing live surveillance video feeds using **Ultralytics YOLOv8** and **ByteTrack**, the system detects, classifies, tracks, and counts vehicles across three independent multi-road approaches (Road A North, Road B East, Road C South) simultaneously. 

### Key Architectural Highlights:
- **Asynchronous Continuous Processing**: Videos play smoothly in hardware-accelerated HTML5 elements while background worker threads continuously run YOLOv8 + ByteTrack inference.
- **Server-Sent Events (SSE)**: Zero-latency telemetry streaming over `/api/stream/events` updates bounding boxes, tracking IDs, and counters without interrupting or freezing video playback.
- **Real Vehicle Counts**: For every frame, exact active counts of Cars, Motorcycles, Bus, and Truck are calculated.
- **Adaptive Signal Controller**: Allocates green time dynamically based on live density, preventing starvation with waiting time boosts and streak rotation.
- **Minimalist Modern UI**: Inspired by Apple, Notion, GitHub, Linear, and Vercel. Crisp typography, subtle shadows, clean spacing, and zero placeholder metrics.

---

## 🚀 Exact Page Layout

The dashboard is structured in the exact required sequence:

1. **Header**: Clean project title, subtitle, and live connection status indicator.
2. **Three Live Videos**:
   - Road A (North), Road B (East), Road C (South) in identical dimensions.
   - Smooth video playback with canvas detection overlay (Bounding Boxes, Class Labels, Confidence %, Tracking IDs).
   - In-app dataset selector (`v1.mp4`, `v2.mp4`, `v3.mp4`) and upload button.
   - Per-feed vehicle counters: **Cars**, **Motorcycles**, **Bus**, **Truck**, **FPS**.
3. **Vehicle Statistics** (9 Essential Intersection Metrics):
   - **Cars**, **Motorcycles**, **Bus**, **Truck**, **Traffic Density**, **Queue Length**, **Current Green Road**, **Green Timer**, **Average Waiting Time**.
4. **Traffic Signal**:
   - 4-direction animated traffic lights (**North**, **East**, **South**, **West**) dynamically driven by backend calculations.
5. **Traffic Density Graph**:
   - Real-time line chart appending Road A, Road B, and Road C density every second.
6. **Queue Growth Graph**:
   - Real-time area chart appending total queue backlog (meters) every second.
7. **Download Reports**:
   - **Download CSV**: Instant export of verified session telemetry.
   - **Download PDF**: Printable audit report with corridor breakdown.


### 3. Third Section: Clean Animated Traffic Signals (4 Directions)
- Displays an intuitive 4-direction traffic signal layout:
  - **North** (Road A Approach)
  - **East** (Road B Approach)
  - **South** (Road C Approach)
  - **West** (Cross-Corridor Standby)
- Each direction features a sleek traffic light housing with illuminated Red, Yellow, and Green bulbs.
- Automatically transitions between `PASS (GREEN)`, `TRANSITION (YELLOW)`, and `STOP (RED)` based on the adaptive backend controller.

### 4. Fourth Section: Only Two Primary Graphs
Focused purely on traffic flow analytics:
1. **Traffic Density Graph**: Multi-series line chart comparing Road A, Road B, and Road C densities over time.
2. **Queue Growth Graph**: Glowing area curve visualizing queue backlog and discharge over time.

### 5. Reports
- **Download CSV**: Instant export of corridor vehicle counts, density scores, and signal phase logs.
- **Download PDF**: Printable audit report summarizing fleet volume, density, and queue status.

### 6. Design System & Typography
- **Headings**: `Space Grotesk`
- **Body**: `Geist`
- **Numbers & Metrics**: `IBM Plex Mono`
- **Buttons**: Medium weight (`font-weight: 500`)
- **Aesthetic**: Minimal modern software design (Linear, GitHub, Notion, Vercel) with reduced border radius, zero glassmorphism glare, and clean whitespace.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **AI Computer Vision** | Ultralytics YOLOv8 (`yolov8n.pt`) | Real-time multi-class vehicle detection |
| **Object Tracking** | ByteTrack | Multi-object tracking across video frames |
| **Backend Server** | Python 3.11 (`http.server`, `socketserver`) | MJPEG multi-video streaming & REST APIs |
| **Image Processing** | OpenCV (`cv2`) | Military HUD overlay, corner reticles, frame encoding |
| **Frontend UI** | Clean HTML5 & Vanilla CSS | Minimalist academic project interface |
| **Typography** | Space Grotesk, Geist, IBM Plex Mono | Clean software typography |
| **Charts Engine** | HTML5 Canvas API | High-performance density and queue growth charts |
| **Reporting** | Native JavaScript Blob & Print API | CSV export and PDF audit reports |

---

## 📁 Folder Structure

```
d:/SmartTrafficSystem/
├── requirements.txt               # Complete Python dependencies specification
├── start_web.bat                  # 1-Click Windows execution script
├── yolov8n.pt                     # Ultralytics YOLOv8 nano model weights
├── README.md                      # Complete project execution guide
│
├── web/                           # Production Web Server & Command Center
│   ├── server.py                  # HTTP & MJPEG video streaming server
│   ├── ai_engine.py               # Multi-camera YOLOv8 + ByteTrack engine
│   ├── index.html                 # Command Center & Sprint views
│   │
│   ├── css/                       # Modular Design System
│   │   ├── tokens.css             # Color palette, spacing, typography tokens
│   │   ├── base.css               # Reset, typography, viewport layout
│   │   ├── components.css         # Glass cards, buttons, KPI cards, sidebar
│   │   ├── views.css              # Surveillance grid, signal panel, charts grid
│   │   └── animations.css         # HUD pulses, radar sweep, signal glows
│   │
│   ├── js/                        # Client-side Applications & State
│   │   ├── state.js               # Reactive telemetry subscriber (2Hz live polling)
│   │   ├── app.js                 # DOM controller, modal triggers, navigation
│   │   ├── charts.js              # Multi-line, area, donut & bar canvas engine
│   │   ├── detector.js            # Simulated HUD canvas overlay
│   │   ├── intersection.js        # 2D digital twin canvas visualizer
│   │   ├── signal-controller.js   # Dynamic cycle evaluation algorithms
│   │   ├── audio.js               # Web Audio API sound synthesizer
│   │   └── reports.js             # CSV & PDF audit report generation
│   │
│   └── uploads/                   # Uploaded traffic video clips storage
│
└── SmartTrafficSystem/            # Research, Core Scripts & Datasets
    ├── reports/videos/            # Sample surveillance video datasets (v1, v2, v3)
    ├── src/                       # Standalone model training & evaluation scripts
    └── models/                    # Model checkpoints and weights
```

---

## 💻 Prerequisites

Ensure your system meets the following minimum requirements:

1. **Operating System**:
   - Windows 10 / 11 (64-bit)
   - Ubuntu 20.04+ / Debian 11+
   - macOS 12+ (Monterey, Ventura, Sonoma)
2. **Python**: Python `3.9`, `3.10`, `3.11`, or `3.12` installed.
   - Verify in terminal:
     ```bash
     python --version
     ```
3. **Hardware**:
   - Minimum: 4-Core CPU, 8 GB RAM (runs CPU inference smoothly at ~10-15 FPS).
   - Recommended: NVIDIA GPU with CUDA 11.8+ / 12.1+ (runs inference at ~40-60 FPS).
4. **Web Browser**: Google Chrome, Microsoft Edge, Mozilla Firefox, or Brave.

---

## 📦 Installation

Follow these exact terminal commands to set up the project from scratch.

### Step 1: Open Terminal in Project Root
```powershell
cd d:\SmartTrafficSystem
```
*(On Linux/macOS: `cd /path/to/SmartTrafficSystem`)*

### Step 2: Create a Python Virtual Environment
Creating an isolated virtual environment prevents library conflicts:

**Windows (PowerShell / Command Prompt):**
```powershell
python -m venv venv
```

**Linux / macOS:**
```bash
python3 -m venv venv
```

### Step 3: Activate the Virtual Environment

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```
*(If PowerShell restricts script execution, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` then activate again)*

**Windows (Command Prompt / cmd.exe):**
```cmd
venv\Scripts\activate.bat
```

**Linux / macOS:**
```bash
source venv/bin/activate
```

### Step 4: Upgrade Package Installer (`pip`)
```bash
python -m pip install --upgrade pip
```

### Step 5: Install Python Dependencies
Install all required dependencies (Ultralytics, OpenCV, PyTorch, NumPy):
```bash
pip install -r requirements.txt
```

*Manual fallback if installing individually:*
```bash
pip install ultralytics opencv-python numpy torch torchvision
```

### Step 6: Verify YOLOv8 Weights File
The pre-trained YOLOv8 nano model weights (`yolov8n.pt`) are included in the workspace root. Verify that the weights exist:

**Windows:**
```powershell
Get-Item .\yolov8n.pt
```

**Linux / macOS:**
```bash
ls -lh yolov8n.pt
```

*If the file is missing, download it directly using Python:*
```bash
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

### Step 7: Frontend Assets (Zero Node.js Required)
The frontend is built using standard Vanilla HTML5, CSS3, and JavaScript with native Web APIs (Canvas API, Web Audio API, Fetch API). **No Node.js, npm install, or build steps are required.** The frontend runs immediately when served by the Python server.

---

## 🚀 Project Execution

Here are all available ways to launch the application:

### Method 1: Run Complete Application (1-Click Launcher)
The fastest method on Windows. Automatically starts the AI backend and launches the Command Center in your default browser:

**Windows Explorer:**
Double-click `start_web.bat` located at `d:\SmartTrafficSystem\start_web.bat`.

**Or run via Command Prompt / PowerShell:**
```cmd
d:\SmartTrafficSystem\start_web.bat
```

---

### Method 2: Run Backend Server (Standard Terminal)
Run the Python production server directly from the `web` directory:

**Windows (PowerShell / Command Prompt):**
```powershell
cd d:\SmartTrafficSystem\web
py -3.11 server.py
```
*(Or `python server.py` if Python 3.11 is your default system environment)*

**Linux / macOS:**
```bash
cd /path/to/SmartTrafficSystem/web
python3 server.py
```

**Access the application:**
Open your browser and navigate to:
```
http://localhost:3000
```

---

### Method 3: Run in Dedicated Virtual Environment
To run using an activated virtual environment:

**Windows:**
```powershell
cd d:\SmartTrafficSystem
.\venv\Scripts\Activate.ps1
cd web
python server.py
```

**Linux / macOS:**
```bash
cd /path/to/SmartTrafficSystem
source venv/bin/activate
cd web
python3 server.py
```

---

### Method 4: Run Local Development Server
If you are developing or modifying frontend HTML/CSS/JS files and want a standalone static server without the AI engine:

**Windows / Linux / macOS:**
```powershell
cd d:\SmartTrafficSystem\web
python -m http.server 8080
```
Open **`http://localhost:8080`** in your browser.  
*(Note: To receive live YOLO video feeds and telemetry, use Method 2 with `python server.py` on port 3000).*

---

### Method 5: Run Production / Background Daemon Mode
To run the server continuously in the background without keeping a terminal window open:

**Windows (PowerShell Background Process):**
```powershell
Start-Process python -ArgumentList "server.py" -WorkingDirectory "d:\SmartTrafficSystem\web" -WindowStyle Hidden
```

**To stop the Windows background process:**
```powershell
Get-Process python | Where-Object { $_.Path -like "*python*" } | Stop-Process -Force
```

**Linux / macOS (nohup background process):**
```bash
cd /path/to/SmartTrafficSystem/web
nohup python3 server.py > server.log 2>&1 &
```

**To stop the Linux/macOS background process:**
```bash
pkill -f "python3 server.py"
```

---

## 📡 API Endpoints Reference

The backend server exposes the following REST and streaming endpoints on port `3000`:

| Endpoint | Method | Format | Description |
|---|---|---|---|
| `/video_feed/road_a` | `GET` | `multipart/x-mixed-replace` | Live MJPEG video stream with YOLO HUD for Road A (North) |
| `/video_feed/road_b` | `GET` | `multipart/x-mixed-replace` | Live MJPEG video stream with YOLO HUD for Road B (East) |
| `/video_feed/road_c` | `GET` | `multipart/x-mixed-replace` | Live MJPEG video stream with YOLO HUD for Road C (South) |
| `/api/telemetry` | `GET` | `application/json` | Real-time AI telemetry (vehicle counts, densities, queues, signal countdown, charts) |
| `/api/settings` | `GET` | `application/json` | Retrieves current AI algorithm weights, thresholds, and limits |
| `/api/settings` | `POST` | `application/json` | Updates vehicle weights, minimum/maximum green times, and starvation thresholds |
| `/api/emergency` | `POST` | `application/json` | Dispatches emergency vehicle priority override to a specified corridor |
| `/api/upload` | `POST` | `multipart/form-data` | Uploads a custom `.mp4` / `.avi` surveillance video for Road A, B, or C |

---

## 🔍 Verification & Health Checks

Verify your installation and server health with these quick commands:

### 1. Test Python & YOLOv8 Imports
```bash
python -c "import cv2, ultralytics, torch; print('OpenCV:', cv2.__version__); print('YOLOv8:', ultralytics.__version__); print('CUDA Available:', torch.cuda.is_available())"
```

### 2. Test Live Telemetry API (While Server is Running)
**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/telemetry" | ConvertTo-Json -Depth 3
```

**cURL (Windows / Linux / macOS):**
```bash
curl -s http://localhost:3000/api/telemetry
```

### 3. Test Signal Settings API
```bash
curl -s http://localhost:3000/api/settings
```

---

## ❓ Troubleshooting & FAQ

### Port 3000 Already in Use
If port 3000 is occupied by another process, identify and terminate it:

**Windows:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process by PID (replace <PID> with number from netstat)
taskkill /F /PID <PID>
```

**Linux / macOS:**
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Video Feeds Show "INITIALIZING YOLO INFERENCE..."
- Ensure `yolov8n.pt` is located in either `d:\SmartTrafficSystem\` or `d:\SmartTrafficSystem\SmartTrafficSystem\src\`.
- Check if default video files exist in `SmartTrafficSystem/reports/videos/`.
- You can upload custom MP4 videos at any time by clicking the **Upload** button directly above any camera feed on the dashboard.

### Bounding Boxes Not Visible
- The bounding boxes are drawn on the server side onto each video frame using OpenCV. Verify that OpenCV is installed correctly:
  ```bash
  python -c "import cv2; print(cv2.__version__)"
  ```

### Resetting Algorithm Parameters
To reset all AI weights to factory defaults, trigger a POST request:
```bash
curl -X POST http://localhost:3000/api/settings -H "Content-Type: application/json" -d "{\"car\":1.0,\"motorcycle\":0.5,\"bus\":2.0,\"truck\":2.5,\"min_green\":10,\"max_green\":60,\"starvation_threshold\":15}"
```

---

## ⌨️ Keyboard Shortcuts (In-App)
- `Ctrl + K`: Open Omni-Search & Global Command Palette.
- `ESC`: Close any active modal, emergency console, or search palette.

---

**Developed for Smart City Intelligent Traffic Operations Centers.**
