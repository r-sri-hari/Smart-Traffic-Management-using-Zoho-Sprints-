import streamlit as st
import json
import pandas as pd
import time
from pathlib import Path
import streamlit_autorefresh
import subprocess

# -----------------------------
# CONFIG
# -----------------------------
st.set_page_config(
    page_title="Smart Traffic Control Center",
    layout="wide"
)

streamlit_autorefresh.st_autorefresh(interval=1000, key="refresh")

# -----------------------------
# PATHS
# -----------------------------
BASE_DIR = Path(r"D:\SmartTrafficSystem\SmartTrafficSystem")
JSON_PATH = BASE_DIR / "reports" / "traffic_data.json"
ENGINE_SCRIPT = BASE_DIR / "src" / "signal_controller.py"

# -----------------------------
# ENGINE STATE
# -----------------------------
if "engine_process" not in st.session_state:
    st.session_state.engine_process = None

# -----------------------------
# LOAD DATA (SAFE VERSION)
# -----------------------------
def load_data():
    if JSON_PATH.exists():
        try:
            with open(JSON_PATH, "r") as f:
                return json.load(f)
        except:
            return None
    return None

data = load_data()

if not data:
    st.error("No traffic data found")
    st.stop()

roads = data.get("roads", {})
green_signal = data.get("green_signal", "")
green_time = int(data.get("green_time", 30))
road_names = list(roads.keys())

# -----------------------------
# 🔥 FIX 1: FORCE VALID SIGNAL CHECK
# -----------------------------
if green_signal not in road_names:
    green_signal = road_names[0]  # fallback safety

# -----------------------------
# HEADER
# -----------------------------
st.markdown("""
<h1 style='text-align:center; color:#00FFD5;'>
🚦 SMART CITY TRAFFIC CONTROL CENTER
</h1>
""", unsafe_allow_html=True)

st.markdown("---")

# -----------------------------
# 🚀 START / STOP SYSTEM
# -----------------------------
col1, col2, col3 = st.columns(3)

with col1:
    if st.button("🟢 START SYSTEM"):
        if st.session_state.engine_process is None:
            st.session_state.engine_process = subprocess.Popen(
                ["python", str(ENGINE_SCRIPT)],
                cwd=str(BASE_DIR / "src")
            )
            st.success("🚦 System Started Successfully")
        else:
            st.warning("Engine already running")

with col2:
    if st.button("🔴 STOP SYSTEM"):
        if st.session_state.engine_process:
            st.session_state.engine_process.terminate()
            st.session_state.engine_process = None
            st.error("🛑 System Stopped")

with col3:
    status = "RUNNING 🚦" if st.session_state.engine_process else "STOPPED 🛑"
    st.markdown(f"### Status: {status}")

st.markdown("---")

# -----------------------------
# 🧠 ROAD STATUS PANEL
# -----------------------------
st.subheader("🧠 Road Status Panel")

cols = st.columns(len(road_names))

for col, road in zip(cols, road_names):
    stats = roads.get(road, {})
    is_green = (road == green_signal)

    color = "#00FF00" if is_green else "#FF3030"
    status = "🟢 GREEN" if is_green else "🔴 RED"

    flow_icon = "🚗" * min(stats.get("cars", 0) // 3, 8)

    with col:
        st.markdown(f"""
        <div style="
            background:#0f0f0f;
            padding:18px;
            border-radius:15px;
            border:2px solid {color};
            text-align:center;
            color:white;
            box-shadow:0px 0px 15px {color};
        ">
            <h3>{road}</h3>
            <h2>{status}</h2>
            <hr>
            <p>🚗 Cars: {stats.get('cars', 0)}</p>
            <p>🏍️ Bikes: {stats.get('motorcycles', 0)}</p>
            <p>🚌 Buses: {stats.get('buses', 0)}</p>
            <p>🚚 Trucks: {stats.get('trucks', 0)}</p>
            <hr>
            <h3>Score: {stats.get('avg_score', 0):.1f}</h3>
            <p style="font-size:18px;">{flow_icon}</p>
        </div>
        """, unsafe_allow_html=True)

st.markdown("---")

# -----------------------------
# ⏱️ TIMER (SAFE)
# -----------------------------
st.subheader("⏱️ Dynamic Signal Timer")

if "start_time" not in st.session_state:
    st.session_state.start_time = time.time()

elapsed = int(time.time() - st.session_state.start_time)
remaining = max(1, green_time - (elapsed % green_time))

st.markdown(f"## 🟢 {remaining} sec remaining")

if remaining <= 1:
    st.session_state.start_time = time.time()

st.markdown("---")

# -----------------------------
# 📊 ANALYTICS
# -----------------------------
st.subheader("📊 Traffic Analytics")

df = pd.DataFrame({
    "Road": road_names,
    "Cars": [roads[r].get("cars", 0) for r in road_names],
    "Bikes": [roads[r].get("motorcycles", 0) for r in road_names],
    "Buses": [roads[r].get("buses", 0) for r in road_names],
    "Trucks": [roads[r].get("trucks", 0) for r in road_names],
    "Score": [roads[r].get("avg_score", 0) for r in road_names]
})

st.bar_chart(df.set_index("Road"))
st.dataframe(df)

st.markdown("---")

# -----------------------------
# 🚦 INTERSECTION (FIXED VISUAL SYNC)
# -----------------------------
st.subheader("🚦 Live Smart Intersection Simulation")

layout = {
    "Road 1": "⬅️ LEFT",
    "Road 2": "⬆️ TOP",
    "Road 3": "➡️ RIGHT"
}

for road in road_names:

    stats = roads.get(road, {})
    is_green = (road == green_signal)

    status = "🟢 FLOWING" if is_green else "🔴 WAITING"
    density = "🟢" * min(10, max(1, stats.get("cars", 1)))

    st.markdown(f"""
    <div style="
        margin:10px;
        padding:15px;
        border-radius:12px;
        background:#111;
        border-left:6px solid {'#00FF00' if is_green else '#FF3030'};
        color:white;
        font-size:18px;
    ">
        <b>{layout.get(road, road)}</b> → {road}<br>
        Status: <b>{status}</b><br>
        Traffic: {density}
    </div>
    """, unsafe_allow_html=True)

st.markdown("---")

# -----------------------------
# 🔥 CONGESTION HEAT VIEW
# -----------------------------
st.subheader("🔥 Congestion Heat Map")

for road in road_names:
    score = roads[road].get("avg_score", 0)

    if score < 15:
        level = "🟩 LOW"
    elif score < 30:
        level = "🟨 MEDIUM"
    else:
        level = "🟥 HIGH"

    st.markdown(f"""
    <div style="
        padding:10px;
        margin:6px;
        background:#0f0f0f;
        border-radius:10px;
        border-left:6px solid {'green' if score<15 else 'orange' if score<30 else 'red'};
        color:white;
    ">
        <b>{road}</b> → {level} (Score: {score})
    </div>
    """, unsafe_allow_html=True)

# -----------------------------
# FOOTER
# -----------------------------
st.success(f"Active Signal → {green_signal}")
st.info(f"Cycle Time → {green_time}s")