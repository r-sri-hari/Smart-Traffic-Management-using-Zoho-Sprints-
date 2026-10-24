/**
 * Smart Traffic Management System - Production Frontend Application
 * Connects to Server-Sent Events (SSE) stream for real-time inference,
 * renders high-performance canvas detection overlays on smooth video feeds,
 * updates vehicle counters, dynamic signal states, and live charts.
 */

(function () {
  'use strict';

  let currentTelemetry = null;
  let chartUpdateCounter = 0;

  // Initialize on DOM Ready
  document.addEventListener('DOMContentLoaded', () => {
    initSSEStream();
    setupVideoElements();
  });

  /**
   * Initializes Server-Sent Events (SSE) connection with automatic polling fallback.
   */
  function initSSEStream() {
    const statusText = document.getElementById('system-status-text');

    if (window.EventSource) {
      const evtSource = new EventSource('/api/stream/events');

      evtSource.onmessage = function (event) {
        try {
          const telemetry = JSON.parse(event.data);
          currentTelemetry = telemetry;
          updateDashboard(telemetry);
          if (statusText) statusText.textContent = 'YOLOv8 + ByteTrack Active (Live SSE)';
        } catch (e) {
          console.error('[SSE] JSON parse error:', e);
        }
      };

      evtSource.onerror = function () {
        if (statusText) statusText.textContent = 'Reconnecting Telemetry...';
      };
    } else {
      // Fallback to high-speed HTTP polling if SSE is unsupported
      setInterval(pollTelemetry, 250);
    }
  }

  /**
   * Polling fallback for environments without EventSource.
   */
  async function pollTelemetry() {
    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const telemetry = await res.json();
        currentTelemetry = telemetry;
        updateDashboard(telemetry);
      }
    } catch (e) {
      console.warn('[Telemetry] Poll failed:', e);
    }
  }

  /**
   * Ensure videos play smoothly without interruptions.
   */
  function setupVideoElements() {
    ['road_a', 'road_b', 'road_c'].forEach(roadId => {
      const vid = document.getElementById(`video-${roadId}`);
      if (vid) {
        vid.muted = true;
        vid.play().catch(() => {
          // Autoplay policy: retry on user interaction
          document.addEventListener('click', () => vid.play(), { once: true });
        });
      }
    });
  }

  /**
   * Main dashboard update loop executing on every incoming telemetry packet.
   */
  function updateDashboard(data) {
    if (!data) return;

    const roads = data.roads || {};
    const kpis = data.kpis || {};
    const signal = data.signal_controller || {};
    const charts = data.charts || {};

    // 1. Update Video Surveillance Feeds (Overlay Canvas + Counters)
    updateRoadFeed('road_a', roads.road_a, 'cnt-a', 'pill-road_a');
    updateRoadFeed('road_b', roads.road_b, 'cnt-b', 'pill-road_b');
    updateRoadFeed('road_c', roads.road_c, 'cnt-c', 'pill-road_c');

    // 2. Update Vehicle Statistics (9 Essential Metrics)
    updateElementText('kpi-cars', kpis.cars ?? 0);
    updateElementText('kpi-bikes', kpis.motorcycles ?? 0);
    updateElementText('kpi-bus', kpis.buses ?? 0);
    updateElementText('kpi-truck', kpis.trucks ?? 0);
    updateElementText('kpi-density', (kpis.traffic_density ?? 0).toFixed(1));
    updateElementText('kpi-queue', `${(kpis.queue_length_m ?? 0).toFixed(1)}m`);
    updateElementText('kpi-green-road', signal.active_road_name || 'Road A (North Approach)');
    updateElementText('kpi-green-timer', `${signal.green_remaining ?? 0}s`);
    updateElementText('kpi-wait-time', `${(kpis.avg_waiting_time_sec ?? 0).toFixed(0)}s`);

    // 3. Update Traffic Signals (North, East, South, West)
    updateTrafficSignals(roads, signal);

    // 4. Update Graphs (Density & Queue Growth)
    chartUpdateCounter++;
    if (chartUpdateCounter % 4 === 0) {
      renderCharts(charts);
    }
  }

  /**
   * Updates an individual road feed's vehicle counters and state indicators.
   */
  function updateRoadFeed(roadId, roadData, cntPrefix, pillId) {
    if (!roadData) return;

    // Real-time Vehicle Counters
    updateElementText(`${cntPrefix}-cars`, roadData.cars ?? 0);
    updateElementText(`${cntPrefix}-bikes`, roadData.motorcycles ?? 0);
    updateElementText(`${cntPrefix}-bus`, roadData.buses ?? 0);
    updateElementText(`${cntPrefix}-truck`, roadData.trucks ?? 0);
    updateElementText(`${cntPrefix}-fps`, (roadData.fps ?? 0).toFixed(1));

    // Signal Pill in Feed Header
    const pill = document.getElementById(pillId);
    if (pill) {
      pill.textContent = roadData.state || 'RED';
      pill.className = `signal-pill ${(roadData.state || 'RED').toLowerCase()}`;
    }
  }


  /**
   * Renders YOLOv8 bounding boxes and ByteTrack IDs directly on the overlay canvas.
   */
  function renderDetectionCanvas(canvasId, detections) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!detections || detections.length === 0) return;

    const colorMap = {
      'Car': '#10B981',
      'Motorcycle': '#06B6D4',
      'Bus': '#F59E0B',
      'Truck': '#EF4444'
    };

    detections.forEach(det => {
      if (!det.norm_bbox) return;
      const [nx, ny, nw, nh] = det.norm_bbox;
      const x = nx * canvas.width;
      const y = ny * canvas.height;
      const w = nw * canvas.width;
      const h = nh * canvas.height;

      const color = colorMap[det.type] || '#10B981';

      // Minimalist Bounding Box
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.strokeRect(x, y, w, h);

      // Label Tag: #ID Class Conf%
      const label = `#${det.id} ${det.type} ${det.conf}%`;
      ctx.font = '10px "IBM Plex Mono", monospace';
      const tw = ctx.measureText(label).width;

      const tagY = Math.max(0, y - 16);
      ctx.fillStyle = 'rgba(11, 15, 23, 0.9)';
      ctx.fillRect(x, tagY, tw + 6, 16);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, tagY, tw + 6, 16);

      ctx.fillStyle = color;
      ctx.fillText(label, x + 3, tagY + 12);
    });
  }

  /**
   * Updates the 4-direction traffic lights (North, East, South, West).
   */
  function updateTrafficSignals(roads, signal) {
    const directions = [
      { id: 'north', road: roads.road_a, label: 'North' },
      { id: 'east', road: roads.road_b, label: 'East' },
      { id: 'south', road: roads.road_c, label: 'South' },
    ];

    directions.forEach(dir => {
      const road = dir.road;
      if (!road) return;

      const state = road.state || 'RED';
      const isGreen = state === 'GREEN';
      const isYellow = state === 'YELLOW';
      const isRed = state === 'RED';

      setBulbState(`bulb-${dir.id}-red`, isRed);
      setBulbState(`bulb-${dir.id}-yellow`, isYellow);
      setBulbState(`bulb-${dir.id}-green`, isGreen);

      const statusEl = document.getElementById(`status-${dir.id}`);
      const timerEl = document.getElementById(`timer-${dir.id}`);

      if (statusEl) {
        statusEl.textContent = isGreen ? 'PASS (GREEN)' : (isYellow ? 'TRANSITION (YELLOW)' : 'STOP (RED)');
        statusEl.className = `sig-status ${isGreen ? 'text-green' : (isYellow ? 'text-green' : 'text-red')}`;
      }

      if (timerEl) {
        if (isGreen || isYellow) {
          timerEl.textContent = `Active Phase: ${signal.green_remaining ?? 0}s`;
        } else {
          timerEl.textContent = `Waiting: ${road.waiting_time ?? 0}s`;
        }
      }
    });

    // West direction (Cross-Corridor Standby)
    setBulbState('bulb-west-red', true);
    setBulbState('bulb-west-yellow', false);
    setBulbState('bulb-west-green', false);
  }

  function setBulbState(elementId, isOn) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (isOn) el.classList.add('on');
    else el.classList.remove('on');
  }

  /**
   * Renders the two live analytics charts using real backend data.
   */
  function renderCharts(charts) {
    if (!charts || !window.TrafficApp || !window.TrafficApp.Charts) return;

    const timestamps = charts.timestamps || [];

    // 1. Traffic Density Graph (Road A, Road B, Road C)
    window.TrafficApp.Charts.renderMultiLineChart('traffic-density-chart', timestamps, [
      { name: 'Road A', color: '#10B981', data: charts.density_road_a || [] },
      { name: 'Road B', color: '#06B6D4', data: charts.density_road_b || [] },
      { name: 'Road C', color: '#F59E0B', data: charts.density_road_c || [] }
    ]);

    // 2. Queue Growth Graph (Total Queue Length in Meters)
    window.TrafficApp.Charts.renderAreaChart(
      'queue-growth-chart',
      timestamps,
      charts.total_queue || [],
      '#F59E0B',
      'rgba(245, 158, 11, 0.2)'
    );
  }

  function updateElementText(id, text) {
    const el = document.getElementById(id);
    if (el && el.textContent !== String(text)) {
      el.textContent = text;
    }
  }

  // =========================================================================
  // GLOBAL USER ACTIONS (Dataset Selection & Video Upload)
  // =========================================================================

  window.selectDatasetVideo = async function (roadId, videoName) {
    try {
      const res = await fetch('/api/select-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ road: roadId, video: videoName })
      });
      const data = await res.json();
      console.log('[SELECT] Video switched:', data);
      const img = document.getElementById(`video-${roadId}`);
      if (img) {
        img.src = `/video_feed/${roadId}?t=${Date.now()}`;
      }
    } catch (e) {
      console.error('[SELECT] Error switching video:', e);
    }
  };

  window.handleVideoUpload = async function (roadId, file) {
    if (!file) return;

    try {
      const res = await fetch(`/api/upload?road=${roadId}&filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'video/mp4' },
        body: file
      });
      const data = await res.json();
      console.log('[UPLOAD] Video upload complete:', data);
      const img = document.getElementById(`video-${roadId}`);
      if (img) {
        img.src = `/video_feed/${roadId}?t=${Date.now()}`;
      }
    } catch (e) {
      console.error('[UPLOAD] Error uploading video:', e);
    }
  };


  // Expose current telemetry globally for reports engine
  window.getLatestTelemetry = () => currentTelemetry;

})();
