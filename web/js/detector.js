/**
 * Sprint 1 Vision Module & YOLOv8 Object Detection Engine
 * Simulates high-precision bounding boxes, confidence tags, frame statistics,
 * video timeline scrubber, and detection logs.
 */
class VehicleDetector {
  constructor(overlayCanvasId, videoPlayerId) {
    this.canvas = document.getElementById(overlayCanvasId);
    this.video = document.getElementById(videoPlayerId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.showBoundingBoxes = true;
    this.showLabels = true;
    this.showConfidence = true;
    this.showTracks = true;

    // Simulated bounding box tracks across video stream
    this.trackedBoxes = [
      { id: "V-102", type: "car", conf: 0.94, x: 120, y: 180, w: 90, h: 55, vx: 1.2, vy: 0.2, color: "#38BDF8" },
      { id: "V-103", type: "truck", conf: 0.97, x: 260, y: 130, w: 140, h: 75, vx: 0.9, vy: 0.1, color: "#FB923C" },
      { id: "V-104", type: "bus", conf: 0.92, x: 420, y: 190, w: 150, h: 65, vx: 1.0, vy: -0.2, color: "#C084FC" },
      { id: "V-105", type: "motorcycle", conf: 0.89, x: 180, y: 260, w: 45, h: 35, vx: 1.8, vy: 0.4, color: "#FDE047" },
      { id: "V-106", type: "car", conf: 0.95, x: 540, y: 160, w: 85, h: 50, vx: 1.3, vy: -0.1, color: "#38BDF8" },
      { id: "V-107", type: "car", conf: 0.91, x: 80, y: 220, w: 80, h: 48, vx: 1.4, vy: 0.2, color: "#38BDF8" }
    ];

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.startDetectionLoop();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio || 640;
    this.canvas.height = rect.height * window.devicePixelRatio || 380;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  startDetectionLoop() {
    const loop = () => {
      this.updateBoxes();
      this.drawOverlay();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  updateBoxes() {
    this.trackedBoxes.forEach(box => {
      box.x += box.vx;
      box.y += box.vy;

      // Wrap around screen
      if (box.x > this.width + 40) box.x = -box.w - 20;
      if (box.x < -box.w - 40) box.x = this.width + 20;
      if (box.y > this.height - box.h || box.y < 40) box.vy *= -1;
    });
  }

  drawOverlay() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    if (!this.showBoundingBoxes) return;

    this.trackedBoxes.forEach(box => {
      const scaleX = this.width / 680;
      const scaleY = this.height / 380;
      const bx = box.x * scaleX;
      const by = box.y * scaleY;
      const bw = box.w * scaleX;
      const bh = box.h * scaleY;

      ctx.save();

      // Bounding box neon outline
      ctx.strokeStyle = box.color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = box.color;
      ctx.shadowBlur = 8;
      ctx.strokeRect(bx, by, bw, bh);

      // Tech corner reticles
      const reticleLen = 8;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      // Top-left
      ctx.moveTo(bx, by + reticleLen); ctx.lineTo(bx, by); ctx.lineTo(bx + reticleLen, by);
      // Top-right
      ctx.moveTo(bx + bw - reticleLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + reticleLen);
      // Bottom-left
      ctx.moveTo(bx, by + bh - reticleLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + reticleLen, by + bh);
      // Bottom-right
      ctx.moveTo(bx + bw - reticleLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - reticleLen);
      ctx.stroke();

      // Label Pill Tag
      if (this.showLabels) {
        ctx.shadowBlur = 0;
        const text = `${box.type.toUpperCase()} ${(box.conf * 100).toFixed(0)}%`;
        ctx.font = '10px "JetBrains Mono", monospace';
        const textWidth = ctx.measureText(text).width;

        // Pill background
        ctx.fillStyle = box.color;
        ctx.fillRect(bx, by - 18, textWidth + 12, 18);

        // Text
        ctx.fillStyle = '#0A0F1D';
        ctx.fontWeight = 'bold';
        ctx.fillText(text, bx + 6, by - 5);

        // Tracking ID pill
        if (this.showTracks) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = box.color;
          ctx.lineWidth = 1;
          ctx.strokeRect(bx + textWidth + 14, by - 18, 48, 18);
          ctx.fillRect(bx + textWidth + 14, by - 18, 48, 18);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(box.id, bx + textWidth + 18, by - 5);
        }
      }

      ctx.restore();
    });
  }

  // Switch video source
  setVideoSource(src) {
    if (this.video) {
      this.video.src = src;
      this.video.play().catch(() => {});
    }
  }
}

window.TrafficApp = window.TrafficApp || {};
window.TrafficApp.VehicleDetector = VehicleDetector;
