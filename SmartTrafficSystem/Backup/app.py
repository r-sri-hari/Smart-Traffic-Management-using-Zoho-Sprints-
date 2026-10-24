import streamlit as st
import json
import pandas as pd
from pathlib import Path

# Page Configuration
st.set_page_config(
    page_title="Smart Traffic Management System",
    layout="wide"
)

# Locate JSON file safely
BASE_DIR = Path(__file__).resolve().parent.parent
json_path = BASE_DIR / "reports" / "traffic_data.json"

# Check if file exists
if not json_path.exists():
    st.error(f"Traffic data file not found:\n{json_path}")
    st.stop()

# Load traffic data
with open(json_path, "r") as file:
    data = json.load(file)

roads = data["roads"]
green_signal = data["green_signal"]
green_time = data["green_time"]

# Dashboard Title
st.title("🚦 Smart Traffic Management System")

st.markdown("---")

# Road Statistics
col1, col2, col3 = st.columns(3)

road_names = list(roads.keys())

for col, road in zip([col1, col2, col3], road_names):

    stats = roads[road]

    with col:

        st.subheader(road)

        st.metric(
            label="Average Traffic Score",
            value=stats["avg_score"]
        )

        st.write(f"🚗 Cars: {stats['cars']}")
        st.write(f"🏍️ Motorcycles: {stats['motorcycles']}")
        st.write(f"🚌 Buses: {stats['buses']}")
        st.write(f"🚚 Trucks: {stats['trucks']}")

        st.write("")

        st.write(f"Min Score: {stats['min_score']}")
        st.write(f"Max Score: {stats['max_score']}")

st.markdown("---")

# Signal Decision
st.success(f"🟢 GREEN SIGNAL → {green_signal}")

st.info(f"⏱️ GREEN TIME → {green_time} seconds")

st.markdown("---")

# Traffic Comparison Chart
st.subheader("📊 Traffic Density Comparison")

chart_data = pd.DataFrame({
    "Road": road_names,
    "Traffic Score": [
        roads["Road 1"]["avg_score"],
        roads["Road 2"]["avg_score"],
        roads["Road 3"]["avg_score"]
    ]
})

st.bar_chart(
    chart_data.set_index("Road")
)

st.markdown("---")

# System Summary
st.subheader("📋 System Summary")

highest_score = max(
    roads[road]["avg_score"]
    for road in road_names
)

st.write(f"Highest Traffic Score: {highest_score}")
st.write(f"Selected Road: {green_signal}")
st.write(f"Allocated Green Time: {green_time} seconds")

st.markdown("---")

st.caption("Smart Traffic Management System using YOLOv8 and Streamlit")