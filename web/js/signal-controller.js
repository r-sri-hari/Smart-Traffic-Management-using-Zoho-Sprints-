/**
 * Sprint 3 Adaptive Traffic Signal Engine
 * Implements Scrum Sprint 3 logic:
 * - Dynamic Green Allocation
 * - Weighted Traffic Density
 * - Maximum Streak Logic (Max 3 cycles before cooldown)
 * - Starvation Prevention Boost (Waiting time > 15s)
 * - Emergency Vehicle Preemptive Priority
 * - Explainable AI Decision Tree Generator
 */
class SignalController {
  constructor(stateStore) {
    this.store = stateStore;
    this.timerInterval = null;
    this.yellowTransitioning = false;
  }

  init() {
    this.startClock();
  }

  // Exact math from backend signal_controller.py
  computeScore(road, weights) {
    const vehicleScore = (
      (road.cars || 0) * weights.cars +
      (road.motorcycles || 0) * weights.motorcycles +
      (road.buses || 0) * weights.buses +
      (road.trucks || 0) * weights.trucks
    );

    const waiting = road.waitingTime || 0;
    let score = vehicleScore + (waiting * weights.waitingFactor);

    // Starvation boost
    if (waiting > 15) {
      score += weights.starvationBoost;
    }

    // Cooldown penalty
    if (road.cooldown > 0) {
      score -= (road.cooldown * 8);
    }

    return Math.max(0, parseFloat(score.toFixed(2)));
  }

  // Run the AI Evaluation Loop
  evaluateCycle() {
    const state = this.store.data;
    const weights = state.weights;
    const roads = state.roads;

    // Check emergency override first
    if (state.emergencyActive && state.emergencyRoad) {
      this.applyEmergencyGreen(state.emergencyRoad);
      return;
    }

    const scores = {};
    const explanations = [];

    // 1. Calculate scores for each road
    for (const [key, road] of Object.entries(roads)) {
      const score = this.computeScore(road, weights);
      scores[key] = score;

      explanations.push({
        road: key,
        score: score,
        cars: road.cars,
        buses: road.buses,
        waiting: road.waitingTime,
        cooldown: road.cooldown,
        starvation: road.waitingTime > 15
      });
    }

    // 2. Determine best road
    let candidates = Object.keys(scores);

    // Filter out roads in hard cooldown if other roads exist
    const availableCandidates = candidates.filter(r => roads[r].cooldown === 0);
    if (availableCandidates.length > 0) {
      candidates = availableCandidates;
    }

    let nextRoad = candidates.reduce((a, b) => scores[a] >= scores[b] ? a : b);

    // 3. Streak Control
    let newStreak = state.greenStreak;
    if (nextRoad === state.lastGreen) {
      newStreak += 1;
      if (newStreak >= weights.maxStreak) {
        // Force rotation to next highest scoring road
        const altCandidates = candidates.filter(r => r !== nextRoad);
        if (altCandidates.length > 0) {
          const prevRoad = nextRoad;
          nextRoad = altCandidates.reduce((a, b) => scores[a] >= scores[b] ? a : b);
          roads[prevRoad].cooldown = 2; // set 2 cycle cooldown
          newStreak = 1;
          this.store.addLog("alert", "alert", `Streak limit (${weights.maxStreak}) reached on ${prevRoad}. Enforcing rotation to ${nextRoad}.`);
        }
      }
    } else {
      newStreak = 1;
    }

    // 4. Calculate dynamic green time
    const bestScore = scores[nextRoad] || 20;
    let greenDuration = Math.round(bestScore * 1.4);
    greenDuration = Math.max(weights.minGreen, Math.min(weights.maxGreen, greenDuration));

    // Update state
    this.store.update(d => {
      d.greenSignal = nextRoad;
      d.lastGreen = nextRoad;
      d.greenStreak = newStreak;
      d.greenTime = greenDuration;
      d.greenRemaining = greenDuration;

      // Update signal lights
      for (const [k, r] of Object.entries(d.roads)) {
        if (k === nextRoad) {
          r.state = 'GREEN';
          r.waitingTime = 0;
          r.density = Math.max(15, r.density - 15);
          r.queueLength = Math.max(10, r.queueLength - 25);
        } else {
          r.state = 'RED';
          r.waitingTime += Math.round(greenDuration / 4);
          r.density = Math.min(100, r.density + Math.floor(Math.random() * 8));
          r.queueLength = Math.min(250, r.queueLength + Math.floor(Math.random() * 15));
          if (r.cooldown > 0) r.cooldown -= 1;
        }
      }

      // Update AI Recommendation
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      const nextCandidate = sorted.find(s => s[0] !== nextRoad) || sorted[0];
      
      d.aiRecommendation = {
        suggestedRoad: nextCandidate[0],
        suggestedDuration: Math.round(nextCandidate[1] * 1.3),
        confidence: (94 + Math.random() * 5).toFixed(1) + "%",
        reasoning: `AI evaluated ${Object.keys(scores).length} corridors. ${nextRoad} prioritized with Score ${bestScore.toFixed(1)} due to higher vehicle density and waiting time.`,
        streakWarning: newStreak >= 2 ? `Warning: ${nextRoad} at Streak ${newStreak}/${weights.maxStreak}. Rotation will trigger soon.` : "Streak within nominal bounds."
      };
    });

    this.store.addLog("green", "green", `Signal Green awarded to ${nextRoad} for ${greenDuration}s (Score: ${bestScore.toFixed(1)}).`);
    if (window.TrafficApp.audio) {
      window.TrafficApp.audio.playChime(520, 0.15);
    }
  }

  // Ticking loop
  startClock() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      const state = this.store.data;
      if (!state.systemOnline) return;

      if (state.greenRemaining > 0) {
        this.store.update(d => {
          d.greenRemaining -= 1;

          // If yellow transition period (last 3 seconds)
          if (d.greenRemaining <= d.yellowTime && d.greenRemaining > 0) {
            const currentGreen = d.roads[d.greenSignal];
            if (currentGreen) currentGreen.state = 'YELLOW';
          }
        });
      } else {
        // Cycle ended -> Evaluate next phase
        this.evaluateCycle();
      }
    }, 1000);
  }

  // Preemptive Emergency Corridor
  triggerEmergency(roadKey, vehicleType = "Ambulance") {
    this.store.update(d => {
      d.emergencyActive = true;
      d.emergencyRoad = roadKey;
      d.greenSignal = roadKey;
      d.greenTime = 45;
      d.greenRemaining = 45;

      for (const [k, r] of Object.entries(d.roads)) {
        r.state = k === roadKey ? 'GREEN' : 'RED';
      }

      d.alerts.unshift({
        id: Date.now(),
        type: "danger",
        title: `EMERGENCY DISPATCH: ${vehicleType}`,
        text: `Preemptive Green Corridor activated for ${roadKey}. All cross lanes forced to RED.`,
        time: "Just now"
      });
    });

    this.store.addLog("danger", "danger", `🚨 PREEMPTIVE OVERRIDE: ${vehicleType} incoming on ${roadKey}. Corridor cleared!`);
    if (window.TrafficApp.audio) {
      window.TrafficApp.audio.playSiren();
    }
  }

  clearEmergency() {
    this.store.update(d => {
      d.emergencyActive = false;
      d.emergencyRoad = null;
      d.greenRemaining = 5; // quick reset
    });
    this.store.addLog("info", "info", "Emergency corridor cleared. Returning to normal AI adaptive cycle.");
  }
}

window.TrafficApp = window.TrafficApp || {};
window.TrafficApp.signalController = new SignalController(window.TrafficApp.state);
