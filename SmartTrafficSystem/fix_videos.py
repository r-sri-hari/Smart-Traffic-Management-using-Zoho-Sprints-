import streamlit as st
import json
import pandas as pd
import time
from pathlib import Path
import streamlit_autorefresh

# -----------------------------
# CONFIG
# -----------------------------
st.set_page_config(
    page_title="Smart Traffic Control Center",
    layout="wide"
)

# Auto refresh (live feel)
streamlit_autorefresh.st_autorefresh(interval=1000, key="refresh")

# -----------------------------
# BASE PATH (IMPORTANT FIX)
# -----------------------------
BASE_DIR = Path(r"D:\SmartTrafficSystem\SmartTrafficSystem")
VIDEO_DIR = BASE_DIR / "reports" / "videos"
JSON_PATH = BASE_DIR / "reports" / "traffic_data.json"

# -----------------------------
# LOAD DATA
# -----------------------------
if not JSON_PATH.exists():
    st.error(f"Missing JSON file: {JSON_PATH}")
    st.stop()

with open(JSON_PATH, "r") as f:
    data = json.load(f)

roads = data["roads"]
green_signal = data["green_signal"]
green_time = int(data["green_time"])

road_names = list(roads.keys())

# -----------------------------
# HEADER
# -----------------------------
st.markdown(
    """
    <h1 style='text-align:center; color:#00FFD5;'>
    🚦 SMART TRAFFIC CONTROL CENTER
    </h1>
    """,
    unsafe_allow_html=True
)

st.markdown("---")

# -----------------------------
# ROAD STATUS
# -----------------------------
st.subheader("🧠 Road Status Panel")

cols = st.columns(3)

for col, road in zip(cols, road_names):
    stats = roads[road]
    is_green = (road == green_signal)

    color = "#00FF00" if is_green else "#FF3030"
    status = "🟢 GREEN" if is_green else "🔴 RED"

    with col:
        st.markdown(
            f"""
            <div style="
                background:#111;
                padding:20px;
                border-radius:15px;
                border:2px solid {color};
                text-align:center;
            ">
                <h3>{road}</h3>
                <h2>{status}</h2>
                <hr>
                <p>🚗 Cars: {stats['cars']}</p>
                <p>🏍️ Bikes: {stats['motorcycles']}</p>
                <p>🚌 Buses: {stats['buses']}</p>
                <p>🚚 Trucks: {stats['trucks']}</p>
                <hr>
                <h3>Score: {stats['avg_score']}</h3>
            </div>
            """,
            unsafe_allow_html=True
        )

st.markdown("---")

# -----------------------------
# TIMER
# -----------------------------
st.subheader("⏱️ Live Signal Timer")

if "start_time" not in st.session_state:
    st.session_state.start_time = time.time()

elapsed = int(time.time() - st.session_state.start_time)
remaining = green_time - (elapsed % green_time)

st.markdown(f"## 🟢 {remaining} sec")

if remaining == 0:
    st.session_state.start_time = time.time()

st.markdown("---")

# -----------------------------
# 🎥 VIDEO FEEDS (FIXED VERSION)
# -----------------------------
st.subheader("🎥 Live Camera Feeds")

video_files = {
    "Road 1": VIDEO_DIR / "v1_fixed.mp4",
    "Road 2": VIDEO_DIR / "v2_fixed.mp4",
    "Road 3": VIDEO_DIR / "v3_fixed.mp4",
}

col1, col2, col3 = st.columns(3)

for col, (road, path) in zip([col1, col2, col3], video_files.items()):
    with col:
        st.markdown(f"### {road}")

        if path.exists():
            st.video(str(path))
        else:
            st.error(f"Missing video:\n{path}")

st.markdown("---")

# -----------------------------
# ANALYTICS
# -----------------------------
st.subheader("📊 Traffic Analytics")

df = pd.DataFrame({
    "Road": road_names,
    "Score": [roads[r]["avg_score"] for r in road_names]
})

st.bar_chart(df.set_index("Road"))
st.dataframe(df)

st.markdown("---")

# -----------------------------
# SYSTEM STATUS
# -----------------------------
st.success(f"Active Signal → {green_signal}")
st.info(f"Cycle Time → {green_time} seconds")

st.caption("Smart Traffic System • YOLOv8 • Streamlit Control Dashboard")