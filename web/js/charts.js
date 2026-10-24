/**
 * High-Performance Minimalist Canvas Chart Engine
 * Renders Clean Lines and Gradients with IBM Plex Mono Typography
 */
class TrafficCharts {
  /**
   * 1. Multi-Line Chart (Traffic Density Graph)
   * Renders Road A (Green), Road B (Cyan), Road C (Amber) density curves
   */
  static renderMultiLineChart(canvasId, labels, seriesList) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = (rect.width || 600) * dpr;
    canvas.height = (rect.height || 240) * dpr;

    const w = canvas.width;
    const h = canvas.height;
    const padLeft = 40 * dpr;
    const padRight = 20 * dpr;
    const padTop = 20 * dpr;
    const padBottom = 26 * dpr;

    ctx.clearRect(0, 0, w, h);

    // Calculate maximum value across all series
    let allValues = [];
    seriesList.forEach(s => {
      if (s.data && s.data.length > 0) allValues.push(...s.data);
    });
    const maxVal = Math.max(15, Math.ceil(Math.max(...(allValues.length ? allValues : [10])) * 1.2));

    // Horizontal grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1 * dpr;
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padTop + (h - padTop - padBottom) * (i / gridLines);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      const val = Math.round(maxVal - (maxVal / gridLines) * i);
      ctx.fillStyle = '#64748B';
      ctx.font = `${9 * dpr}px "IBM Plex Mono", monospace`;
      ctx.fillText(val, 6 * dpr, y + 3 * dpr);
    }

    // Plot each series
    seriesList.forEach(s => {
      if (!s.data || s.data.length < 2) return;
      const pts = s.data.map((val, idx) => {
        const x = padLeft + (w - padLeft - padRight) * (idx / (s.data.length - 1));
        const y = h - padBottom - (val / maxVal) * (h - padTop - padBottom);
        return { x, y, val };
      });

      // Line path
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      // Highlight the latest point
      if (pts.length > 0) {
        const last = pts[pts.length - 1];
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(last.x, last.y, 3.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Time labels on X-axis
    if (labels && labels.length > 0) {
      const step = Math.max(1, Math.floor(labels.length / 5));
      labels.forEach((lbl, idx) => {
        if (idx % step === 0 || idx === labels.length - 1) {
          const x = padLeft + (w - padLeft - padRight) * (idx / (labels.length - 1));
          ctx.fillStyle = '#64748B';
          ctx.font = `${8.5 * dpr}px "IBM Plex Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(lbl, x, h - 8 * dpr);
        }
      });
      ctx.textAlign = 'start';
    }
  }

  /**
   * 2. Area Chart (Queue Growth Graph)
   * Renders total queue backlog progression in meters
   */
  static renderAreaChart(canvasId, labels, dataPoints, color = '#F59E0B', fillGradientColor = 'rgba(245, 158, 11, 0.2)') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = (rect.width || 600) * dpr;
    canvas.height = (rect.height || 240) * dpr;

    const w = canvas.width;
    const h = canvas.height;
    const padLeft = 40 * dpr;
    const padRight = 20 * dpr;
    const padTop = 20 * dpr;
    const padBottom = 26 * dpr;

    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(30, Math.ceil(Math.max(...(dataPoints.length ? dataPoints : [20])) * 1.2));
    const minVal = 0;

    // Horizontal grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1 * dpr;
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padTop + (h - padTop - padBottom) * (i / gridLines);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      const val = Math.round(maxVal - (maxVal / gridLines) * i);
      ctx.fillStyle = '#64748B';
      ctx.font = `${9 * dpr}px "IBM Plex Mono", monospace`;
      ctx.fillText(`${val}m`, 6 * dpr, y + 3 * dpr);
    }

    if (!dataPoints || dataPoints.length < 2) return;

    // Calculate points
    const pts = dataPoints.map((val, idx) => {
      const x = padLeft + (w - padLeft - padRight) * (idx / (dataPoints.length - 1));
      const y = h - padBottom - ((val - minVal) / (maxVal - minVal)) * (h - padTop - padBottom);
      return { x, y, val };
    });

    // Fill area gradient
    const grad = ctx.createLinearGradient(0, padTop, 0, h - padBottom);
    grad.addColorStop(0, fillGradientColor);
    grad.addColorStop(1, 'rgba(17, 24, 39, 0.0)');

    ctx.beginPath();
    ctx.moveTo(pts[0].x, h - padBottom);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, h - padBottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line stroke
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    // Highlight latest point
    if (pts.length > 0) {
      const last = pts[pts.length - 1];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(last.x, last.y, 4 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Time labels
    if (labels && labels.length > 0) {
      const step = Math.max(1, Math.floor(labels.length / 5));
      labels.forEach((lbl, idx) => {
        if (idx % step === 0 || idx === labels.length - 1) {
          const x = padLeft + (w - padLeft - padRight) * (idx / (labels.length - 1));
          ctx.fillStyle = '#64748B';
          ctx.font = `${8.5 * dpr}px "IBM Plex Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(lbl, x, h - 8 * dpr);
        }
      });
      ctx.textAlign = 'start';
    }
  }
}

window.TrafficApp = window.TrafficApp || {};
window.TrafficApp.Charts = TrafficCharts;
