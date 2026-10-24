/**
 * Interactive 2D Smart City Traffic Intersection Visualizer
 * Canvas-based high-fps simulation:
 * - 4-Way Junction with dynamic lanes, stop lines, crosswalks
 * - Dynamic Traffic Signal Pods with glowing halos
 * - Autonomous vehicle agents (Cars, Bikes, Buses, Trucks)
 * - Deceleration on RED, smooth acceleration on GREEN
 * - Emergency vehicle flashers (Ambulance / Siren)
 * - Congestion heat radiance overlay
 */
class IntersectionVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.vehicles = [];
    this.showHeatmap = false;
    this.animId = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.spawnInitialTraffic();
    this.startLoop();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio || 600;
    this.canvas.height = rect.height * window.devicePixelRatio || 380;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.cx = this.width / 2;
    this.cy = this.height / 2;
    this.roadWidth = Math.min(this.width, this.height) * 0.32;
  }

  spawnInitialTraffic() {
    this.vehicles = [];
    const types = [
      { type: 'car', color: '#38BDF8', length: 18, width: 9, speed: 2.2 },
      { type: 'car', color: '#F8FAFC', length: 18, width: 9, speed: 2.4 },
      { type: 'bus', color: '#C084FC', length: 34, width: 11, speed: 1.6 },
      { type: 'truck', color: '#FB923C', length: 30, width: 12, speed: 1.4 },
      { type: 'motorcycle', color: '#FDE047', length: 10, width: 5, speed: 2.8 }
    ];

    const dirs = ['N', 'S', 'E', 'W'];
    for (let i = 0; i < 28; i++) {
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      const t = types[Math.floor(Math.random() * types.length)];
      this.vehicles.push(this.createVehicle(dir, t, Math.random() * 300));
    }
  }

  createVehicle(dir, template, offset = 0) {
    const laneOffset = (this.roadWidth / 4) * 0.5;
    let x, y, vx, vy;

    switch (dir) {
      case 'N': // Moving South
        x = this.cx - laneOffset;
        y = -40 - offset;
        vx = 0;
        vy = template.speed;
        break;
      case 'S': // Moving North
        x = this.cx + laneOffset;
        y = this.height + 40 + offset;
        vx = 0;
        vy = -template.speed;
        break;
      case 'E': // Moving West
        x = this.width + 40 + offset;
        y = this.cy - laneOffset;
        vx = -template.speed;
        vy = 0;
        break;
      case 'W': // Moving East
        x = -40 - offset;
        y = this.cy + laneOffset;
        vx = template.speed;
        vy = 0;
        break;
    }

    return {
      dir,
      x,
      y,
      vx,
      vy,
      baseSpeed: template.speed,
      currentSpeed: template.speed,
      type: template.type,
      color: template.color,
      length: template.length,
      width: template.width,
      id: Math.floor(Math.random() * 9000) + 1000
    };
  }

  startLoop() {
    const render = () => {
      this.update();
      this.draw();
      this.animId = requestAnimationFrame(render);
    };
    render();
  }

  update() {
    const state = window.TrafficApp.state ? window.TrafficApp.state.data : null;
    const roads = state ? state.roads : {};

    // Map road states from real AI Controller (Road A, Road B, Road C)
    const signals = {
      'N': (roads['Road A (North Approach)'] || roads['Road 1 (North)'])?.state || 'RED',
      'E': (roads['Road B (East Approach)'] || roads['Road 2 (East)'])?.state || 'RED',
      'S': (roads['Road C (South Approach)'] || roads['Road 3 (South)'])?.state || 'RED',
      'W': 'RED'
    };

    const stopLineOffset = this.roadWidth / 2 + 15;

    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      const light = signals[v.dir] || 'RED';

      let targetSpeed = v.baseSpeed;

      // Check distance to stop line
      if (light === 'RED' || light === 'YELLOW') {
        let distToStop = 999;
        if (v.dir === 'N') distToStop = (this.cy - stopLineOffset) - (v.y + v.length / 2);
        if (v.dir === 'S') distToStop = (v.y - v.length / 2) - (this.cy + stopLineOffset);
        if (v.dir === 'E') distToStop = (v.x - v.length / 2) - (this.cx + stopLineOffset);
        if (v.dir === 'W') distToStop = (this.cx - stopLineOffset) - (v.x + v.length / 2);

        if (distToStop > 0 && distToStop < 90) {
          targetSpeed = 0;
        }
      }

      // Check collision with vehicle ahead
      for (let j = 0; j < this.vehicles.length; j++) {
        if (i === j) continue;
        const other = this.vehicles[j];
        if (other.dir === v.dir) {
          let gap = 999;
          if (v.dir === 'N' && other.y > v.y) gap = other.y - other.length / 2 - (v.y + v.length / 2);
          if (v.dir === 'S' && other.y < v.y) gap = (v.y - v.length / 2) - (other.y + other.length / 2);
          if (v.dir === 'E' && other.x < v.x) gap = (v.x - v.length / 2) - (other.x + other.length / 2);
          if (v.dir === 'W' && other.x > v.x) gap = other.x - other.length / 2 - (v.x + v.length / 2);

          if (gap > 0 && gap < 24) {
            targetSpeed = 0;
            break;
          }
        }
      }

      // Smooth acceleration / deceleration
      v.currentSpeed += (targetSpeed - v.currentSpeed) * 0.12;

      // Update position
      if (v.dir === 'N') v.y += v.currentSpeed;
      if (v.dir === 'S') v.y -= v.currentSpeed;
      if (v.dir === 'E') v.x -= v.currentSpeed;
      if (v.dir === 'W') v.x += v.currentSpeed;

      // Recycle off-screen vehicles
      const buffer = 80;
      if (v.y > this.height + buffer || v.y < -buffer || v.x > this.width + buffer || v.x < -buffer) {
        const types = [
          { type: 'car', color: '#38BDF8', length: 18, width: 9, speed: 2.2 },
          { type: 'bus', color: '#C084FC', length: 34, width: 11, speed: 1.6 },
          { type: 'truck', color: '#FB923C', length: 30, width: 12, speed: 1.4 },
          { type: 'motorcycle', color: '#FDE047', length: 10, width: 5, speed: 2.8 }
        ];
        const t = types[Math.floor(Math.random() * types.length)];
        this.vehicles[i] = this.createVehicle(v.dir, t, Math.random() * 40);
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Asphalt Background & Grid
    ctx.fillStyle = '#090D17';
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle intersection grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    const step = 24;
    for (let x = 0; x < this.width; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke();
    }
    for (let y = 0; y < this.height; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
    }

    // 2. Draw Roads (Cross intersection)
    ctx.fillStyle = '#111827';
    // Vertical road
    ctx.fillRect(this.cx - this.roadWidth / 2, 0, this.roadWidth, this.height);
    // Horizontal road
    ctx.fillRect(0, this.cy - this.roadWidth / 2, this.width, this.roadWidth);

    // 3. Road Markings & Borders
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 2;
    // Outer road borders
    ctx.strokeRect(this.cx - this.roadWidth / 2, 0, this.roadWidth, this.height);
    ctx.strokeRect(0, this.cy - this.roadWidth / 2, this.width, this.roadWidth);

    // Dashed centerlines
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(this.cx, 0); ctx.lineTo(this.cx, this.cy - this.roadWidth / 2);
    ctx.moveTo(this.cx, this.cy + this.roadWidth / 2); ctx.lineTo(this.cx, this.height);
    ctx.moveTo(0, this.cy); ctx.lineTo(this.cx - this.roadWidth / 2, this.cy);
    ctx.moveTo(this.cx + this.roadWidth / 2, this.cy); ctx.lineTo(this.width, this.cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Pedestrian Crosswalks (Zebra)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    const zebraCount = 6;
    const stopOffset = this.roadWidth / 2 + 12;

    // North crosswalk
    for (let i = 0; i < zebraCount; i++) {
      const zx = (this.cx - this.roadWidth / 2) + i * (this.roadWidth / zebraCount) + 3;
      ctx.fillRect(zx, this.cy - stopOffset, (this.roadWidth / zebraCount) - 6, 8);
    }
    // South crosswalk
    for (let i = 0; i < zebraCount; i++) {
      const zx = (this.cx - this.roadWidth / 2) + i * (this.roadWidth / zebraCount) + 3;
      ctx.fillRect(zx, this.cy + stopOffset - 8, (this.roadWidth / zebraCount) - 6, 8);
    }
    // West crosswalk
    for (let i = 0; i < zebraCount; i++) {
      const zy = (this.cy - this.roadWidth / 2) + i * (this.roadWidth / zebraCount) + 3;
      ctx.fillRect(this.cx - stopOffset, zy, 8, (this.roadWidth / zebraCount) - 6);
    }
    // East crosswalk
    for (let i = 0; i < zebraCount; i++) {
      const zy = (this.cy - this.roadWidth / 2) + i * (this.roadWidth / zebraCount) + 3;
      ctx.fillRect(this.cx + stopOffset - 8, zy, 8, (this.roadWidth / zebraCount) - 6);
    }

    // 5. Draw Vehicles
    this.vehicles.forEach(v => {
      ctx.save();
      ctx.translate(v.x, v.y);

      // Orientation
      let angle = 0;
      if (v.dir === 'N') angle = Math.PI / 2;
      if (v.dir === 'S') angle = -Math.PI / 2;
      if (v.dir === 'E') angle = Math.PI;
      if (v.dir === 'W') angle = 0;
      ctx.rotate(angle);

      // Vehicle body shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(-v.length / 2 + 1, -v.width / 2 + 2, v.length, v.width);

      // Vehicle body
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.roundRect(-v.length / 2, -v.width / 2, v.length, v.width, 3);
      ctx.fill();

      // Headlight glow
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(v.length / 2 - 2, -v.width / 2 + 1, 2, 2);
      ctx.fillRect(v.length / 2 - 2, v.width / 2 - 3, 2, 2);

      // Windshield
      ctx.fillStyle = '#0B1120';
      ctx.fillRect(0, -v.width / 2 + 1.5, 4, v.width - 3);

      ctx.restore();
    });

    // 6. Draw Traffic Light Pods at 4 corners
    const state = window.TrafficApp.state ? window.TrafficApp.state.data : null;
    const roads = state ? state.roads : {};

    const roadAState = (roads['Road A (North Approach)'] || roads['Road 1 (North)'])?.state || 'RED';
    const roadBState = (roads['Road B (East Approach)'] || roads['Road 2 (East)'])?.state || 'RED';
    const roadCState = (roads['Road C (South Approach)'] || roads['Road 3 (South)'])?.state || 'RED';

    this.drawLightPod(this.cx - this.roadWidth / 2 - 20, this.cy - this.roadWidth / 2 - 20, roadAState, 'ROAD A');
    this.drawLightPod(this.cx + this.roadWidth / 2 + 10, this.cy - this.roadWidth / 2 - 20, roadBState, 'ROAD B');
    this.drawLightPod(this.cx + this.roadWidth / 2 + 10, this.cy + this.roadWidth / 2 + 10, roadCState, 'ROAD C');
    this.drawLightPod(this.cx - this.roadWidth / 2 - 20, this.cy + this.roadWidth / 2 + 10, 'RED', 'WEST');

    // 7. Emergency Strobe effect if active
    if (state && state.emergencyActive) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, this.width - 8, this.height - 8);
    }
  }

  drawLightPod(x, y, state, label) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#0A0F1D';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, 16, 36, 4);
    ctx.fill();
    ctx.stroke();

    const rColor = state === 'RED' ? '#EF4444' : 'rgba(255, 255, 255, 0.08)';
    const yColor = state === 'YELLOW' ? '#F59E0B' : 'rgba(255, 255, 255, 0.08)';
    const gColor = state === 'GREEN' ? '#22C55E' : 'rgba(255, 255, 255, 0.08)';

    // Red Bulb
    ctx.fillStyle = rColor;
    if (state === 'RED') {
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 10;
    }
    ctx.beginPath(); ctx.arc(x + 8, y + 7, 3.5, 0, Math.PI * 2); ctx.fill();

    // Yellow Bulb
    ctx.shadowBlur = 0;
    ctx.fillStyle = yColor;
    if (state === 'YELLOW') {
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 10;
    }
    ctx.beginPath(); ctx.arc(x + 8, y + 18, 3.5, 0, Math.PI * 2); ctx.fill();

    // Green Bulb
    ctx.shadowBlur = 0;
    ctx.fillStyle = gColor;
    if (state === 'GREEN') {
      ctx.shadowColor = '#22C55E';
      ctx.shadowBlur = 12;
    }
    ctx.beginPath(); ctx.arc(x + 8, y + 29, 3.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }
}

window.TrafficApp = window.TrafficApp || {};
window.TrafficApp.IntersectionVisualizer = IntersectionVisualizer;
