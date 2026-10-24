/**
 * State Management & Reactive Store for Smart Traffic System
 * Connected to Live Python OpenCV + YOLOv8 + ByteTrack Backend.
 * NO MOCK DATA. Real telemetry streams from /api/telemetry.
 */
class TrafficState {
  constructor() {
    this.listeners = [];
    this.pollInterval = null;
    this.isBackendConnected = false;
    
    // Core Traffic Data
    this.data = {
      systemOnline: true,
      lastSync: new Date().toLocaleTimeString(),
      soundEnabled: true,
      activeSprint: 'sprint4',
      activeVideo: 'road_a',
      viewMode: 'tri-view', // 'tri-view' or 'single'
      emergencyActive: false,
      emergencyRoad: null,
      
      // 3 Approach Roads: Road A, Road B, Road C (Approaching Intersection)
      roads: {
        "Road A (North Approach)": {
          id: "road_a",
          name: "Road A (North Approach)",
          cars: 0,
          motorcycles: 0,
          buses: 0,
          trucks: 0,
          total_unique: 0,
          density: 0.0,
          queueLength: 0.0,
          queueGrowthRate: 0.0,
          queueTrend: "Stable",
          predictedQueue: 0.0,
          avgSpeed: 38.0,
          waitingTime: 0,
          state: 'GREEN',
          fps: 0,
          inferenceMs: 0,
          detections: []
        },
        "Road B (East Approach)": {
          id: "road_b",
          name: "Road B (East Approach)",
          cars: 0,
          motorcycles: 0,
          buses: 0,
          trucks: 0,
          total_unique: 0,
          density: 0.0,
          queueLength: 0.0,
          queueGrowthRate: 0.0,
          queueTrend: "Stable",
          predictedQueue: 0.0,
          avgSpeed: 35.0,
          waitingTime: 0,
          state: 'RED',
          fps: 0,
          inferenceMs: 0,
          detections: []
        },
        "Road C (South Approach)": {
          id: "road_c",
          name: "Road C (South Approach)",
          cars: 0,
          motorcycles: 0,
          buses: 0,
          trucks: 0,
          total_unique: 0,
          density: 0.0,
          queueLength: 0.0,
          queueGrowthRate: 0.0,
          queueTrend: "Stable",
          predictedQueue: 0.0,
          avgSpeed: 40.0,
          waitingTime: 0,
          state: 'RED',
          fps: 0,
          inferenceMs: 0,
          detections: []
        }
      },

      // KPIs directly aggregated from YOLO
      kpis: {
        cars: 0,
        motorcycles: 0,
        buses: 0,
        trucks: 0,
        total_unique: 0,
        avg_density: 0.0,
        total_queue_m: 0.0,
        avg_wait_sec: 0,
        green_time: 30,
        fps: 0.0,
        inference_ms: 0.0,
        confidence_avg: 94.2
      },

      // Signal Controller State
      greenSignal: "Road A (North Approach)",
      greenSignalId: "road_a",
      greenTime: 30,
      greenRemaining: 30,
      greenStreak: 1,
      yellowTime: 3,
      decisionExplanation: "AI Engine analyzing real-time traffic density across Road A, B, and C...",

      // Configurable Weights
      weights: {
        car: 1.0,
        motorcycle: 0.5,
        bus: 2.0,
        truck: 2.5,
        min_green: 10,
        max_green: 60,
        max_streak: 3,
        starvation_threshold: 15,
        conf_threshold: 0.25,
        iou_threshold: 0.45
      },

      densityFormula: "Density = (Car × 1.0) + (Motorcycle × 0.5) + (Bus × 2.0) + (Truck × 2.5)",

      // Real Timeline Chart Series from Backend
      charts: {
        timestamps: [],
        vehicles: [],
        density_road_a: [],
        density_road_b: [],
        density_road_c: [],
        queue_road_a: [],
        queue_road_b: [],
        queue_road_c: [],
        history: []
      },

      logs: [
        { time: new Date().toLocaleTimeString(), tag: "system", level: "info", msg: "Connecting to real-time YOLOv8 & ByteTrack AI backend..." }
      ],

      alerts: []
    };

    // Begin live polling
    this.startLiveTelemetrySync();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.data));
  }

  update(fn) {
    fn(this.data);
    this.notify();
  }

  addLog(tag, level, msg) {
    const time = new Date().toLocaleTimeString();
    this.data.logs.unshift({ time, tag, level, msg });
    if (this.data.logs.length > 50) this.data.logs.pop();
    this.notify();
  }

  // Connect to Python Backend /api/telemetry
  startLiveTelemetrySync() {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/api/telemetry');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const telemetry = await res.json();
        
        if (!this.isBackendConnected) {
          this.isBackendConnected = true;
          this.addLog("yolo", "info", "Successfully connected to Ultralytics YOLOv8 & ByteTrack live inference server.");
        }

        this.applyTelemetry(telemetry);
      } catch (err) {
        // Backend temporarily reconnecting
        this.isBackendConnected = false;
      }
    };

    // Initial fetch & interval
    fetchTelemetry();
    this.pollInterval = setInterval(fetchTelemetry, 500); // 2Hz live telemetry
  }

  applyTelemetry(t) {
    this.update(d => {
      d.lastSync = t.timestamp || new Date().toLocaleTimeString();
      d.weights = t.weights || d.weights;
      d.densityFormula = t.density_formula || d.densityFormula;
      
      // Update KPIs
      if (t.kpis) {
        d.kpis = t.kpis;
      }

      // Update Signal Controller
      if (t.signal_controller) {
        const sc = t.signal_controller;
        d.greenSignalId = sc.active_green_road;
        d.greenSignal = sc.active_road_name;
        d.greenRemaining = sc.green_remaining;
        d.greenTime = sc.allocated_green_time;
        d.greenStreak = sc.green_streak;
        d.emergencyActive = sc.emergency_active;
        d.decisionExplanation = sc.decision_explanation;
      }

      // Update Roads
      if (t.roads) {
        const mapping = {
          "road_a": "Road A (North Approach)",
          "road_b": "Road B (East Approach)",
          "road_c": "Road C (South Approach)"
        };

        for (const [rid, rdata] of Object.entries(t.roads)) {
          const key = mapping[rid];
          if (key && d.roads[key]) {
            d.roads[key].cars = rdata.cars;
            d.roads[key].motorcycles = rdata.motorcycles;
            d.roads[key].buses = rdata.buses;
            d.roads[key].trucks = rdata.trucks;
            d.roads[key].total_unique = rdata.total_unique;
            d.roads[key].density = rdata.density;
            d.roads[key].queueLength = rdata.queue_length_m;
            d.roads[key].queueGrowthRate = rdata.queue_growth_rate;
            d.roads[key].queueTrend = rdata.queue_trend;
            d.roads[key].predictedQueue = rdata.predicted_queue_m;
            d.roads[key].avgSpeed = rdata.avg_speed_kmh;
            d.roads[key].waitingTime = rdata.waiting_time;
            d.roads[key].state = rdata.state;
            d.roads[key].fps = rdata.fps;
            d.roads[key].inferenceMs = rdata.inference_ms;
            d.roads[key].detections = rdata.detections;
          }
        }
      }

      // Update Real Chart Histories
      if (t.charts) {
        d.charts = t.charts;
      }

      // Generate dynamic alerts if queues spike
      d.alerts = [];
      for (const [rname, r] of Object.entries(d.roads)) {
        if (r.queueGrowthRate > 15) {
          d.alerts.push({
            id: rname,
            type: "danger",
            title: `Queue Growth Spike: ${rname}`,
            text: `Queue growing at +${r.queueGrowthRate}%. Backlog currently ${r.queueLength}m.`,
            time: "Live"
          });
        }
        if (r.waitingTime >= (d.weights.starvation_threshold || 15)) {
          d.alerts.push({
            id: `${rname}-starvation`,
            type: "warning",
            title: `Starvation Warning: ${rname}`,
            text: `Waiting time reached ${r.waitingTime}s. Starvation priority boost active!`,
            time: "Live"
          });
        }
      }
    });
  }

  // Upload video for Road A, B, or C
  async uploadVideo(roadId, file) {
    this.addLog("yolo", "info", `Uploading video for ${roadId.toUpperCase()}: ${file.name} (${(file.size / (1024*1024)).toFixed(1)} MB)...`);
    const formData = new FormData();
    formData.append("video", file);

    try {
      const res = await fetch(`/api/upload?road=${roadId}&filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        body: file
      });
      const data = await res.json();
      if (data.status === "success") {
        this.addLog("yolo", "info", `✓ Video successfully uploaded for ${roadId.toUpperCase()}. Automated YOLO detection restarted.`);
        return true;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      this.addLog("alert", "alert", `Failed to upload video: ${err.message}`);
      return false;
    }
  }

  // Push new settings to Backend
  async saveSettings(settingsObj) {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsObj)
      });
      const data = await res.json();
      this.addLog("info", "info", "Controller weights and thresholds updated in live AI engine.");
      return data;
    } catch (err) {
      console.error("Save settings error:", err);
    }
  }

  // Trigger Emergency Corridor
  async triggerEmergency(roadId) {
    try {
      await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ road: roadId, action: 'trigger' })
      });
      this.addLog("danger", "danger", `🚨 EMERGENCY PREEMPTION: Dispatched green corridor for ${roadId.toUpperCase()}!`);
    } catch (e) {}
  }

  async clearEmergency() {
    try {
      await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      });
      this.addLog("info", "info", "Emergency green corridor cleared.");
    } catch (e) {}
  }
}

window.TrafficApp = window.TrafficApp || {};
window.TrafficApp.state = new TrafficState();
