import json
import time
from pathlib import Path

# -----------------------------
# PATH
# -----------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "reports" / "traffic_data.json"

if not DATA_PATH.exists():
    print("❌ No traffic data found. Run detector first.")
    exit()

# -----------------------------
# LOAD / SAVE
# -----------------------------
def load_data():
    with open(DATA_PATH, "r") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_PATH, "w") as f:
        json.dump(data, f, indent=4)

# -----------------------------
# CONFIG
# -----------------------------
WEIGHTS = {
    "cars": 1.0,
    "motorcycles": 0.5,
    "buses": 2.0,
    "trucks": 2.5
}

WAITING_FACTOR = 0.6
STARVATION_BOOST = 5

MIN_GREEN = 10
MAX_GREEN = 60

MAX_STREAK = 3
COOLDOWN_LIMIT = 5   # safety cap

# -----------------------------
# SCORE FUNCTION (STABILIZED)
# -----------------------------
def compute_score(road_data):

    vehicle_score = (
        road_data.get("cars", 0) * WEIGHTS["cars"] +
        road_data.get("motorcycles", 0) * WEIGHTS["motorcycles"] +
        road_data.get("buses", 0) * WEIGHTS["buses"] +
        road_data.get("trucks", 0) * WEIGHTS["trucks"]
    )

    waiting = road_data.get("waiting_time", 0)

    score = vehicle_score + (waiting * WAITING_FACTOR)

    # starvation boost (safe)
    if waiting > 15:
        score += STARVATION_BOOST

    # clamp to avoid negative or extreme values
    return max(0, score)

# -----------------------------
# ENGINE LOOP
# -----------------------------
def run_engine():

    data = load_data()
    roads = data["roads"]

    state = {
        "last_green": data.get("green_signal"),
        "streak": data.get("green_streak", 0),
        "cooldown": data.get("cooldown", {})
    }

    scores = {}

    # -----------------------------
    # COMPUTE SCORES
    # -----------------------------
    for road in roads:
        scores[road] = compute_score(roads[road])

    # -----------------------------
    # FAIRNESS LOGIC (IMPROVED)
    # -----------------------------
    best_road = max(scores, key=scores.get)

    # streak control
    if best_road == state["last_green"]:
        state["streak"] += 1
    else:
        state["streak"] = 0

    # 🔥 fairness override (SOFT, NOT HARD RESET)
    if state["streak"] >= MAX_STREAK:
        print("⚠️ Fairness override activated (soft rotation)")

        # instead of killing score, we slightly reduce preference
        scores[best_road] *= 0.7

        best_road = max(scores, key=scores.get)
        state["streak"] = 0

    # -----------------------------
    # GREEN TIME (STABLE SCALING)
    # -----------------------------
    green_score = scores[best_road]
    green_time = int(15 + green_score * 1.2)
    green_time = max(MIN_GREEN, min(green_time, MAX_GREEN))

    # -----------------------------
    # UPDATE WAITING + COOLDOWN
    # -----------------------------
    for road in roads:

        if road == best_road:
            roads[road]["waiting_time"] = 0
            state["cooldown"][road] = 0
        else:
            roads[road]["waiting_time"] = roads[road].get("waiting_time", 0) + 1

            # cooldown grows but capped
            state["cooldown"][road] = min(
                state["cooldown"].get(road, 0) + 1,
                COOLDOWN_LIMIT
            )

    # -----------------------------
    # SAVE STATE
    # -----------------------------
    data["green_signal"] = best_road
    data["green_time"] = green_time
    data["green_streak"] = state["streak"]
    data["last_green"] = best_road
    data["cooldown"] = state["cooldown"]
    data["scores"] = scores

    save_data(data)

    # -----------------------------
    # LOG OUTPUT
    # -----------------------------
    print("\n🚦 FAIRNESS SIGNAL UPDATE")
    print("--------------------------------")
    print(f"🟢 GREEN → {best_road}")
    print(f"⏱️ TIME  → {green_time}s")
    print(f"🔥 STREAK → {state['streak']}")

    print("\n📊 SCORES")
    for r, s in scores.items():
        print(f"  {r}: {round(s, 2)}")

# -----------------------------
# LOOP
# -----------------------------
if __name__ == "__main__":

    print("🚦 Improved Fairness Traffic Engine Running...\n")

    while True:
        run_engine()
        time.sleep(5)