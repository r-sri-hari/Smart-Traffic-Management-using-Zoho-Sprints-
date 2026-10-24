/**
 * Smart Traffic Management System - Telemetry Report Engine
 * Generates verified CSV exports and printable PDF audit sheets from real backend data.
 */

class ReportEngine {
  constructor() {}

  getTelemetryData() {
    if (typeof window.getLatestTelemetry === 'function') {
      const data = window.getLatestTelemetry();
      if (data) return data;
    }
    return null;
  }

  generateCSV() {
    const data = this.getTelemetryData();
    if (!data) {
      alert("No backend telemetry received yet. Please wait a moment.");
      return;
    }

    const roads = data.roads || {};
    const kpis = data.kpis || {};
    const signal = data.signal_controller || {};

    const rows = [
      ["Smart Traffic Management System - Session Audit Report"],
      ["Generated At", new Date().toISOString()],
      [],
      ["INTERSECTION TOTALS"],
      ["Cars", kpis.cars ?? 0],
      ["Motorcycles", kpis.motorcycles ?? 0],
      ["Bus", kpis.buses ?? 0],
      ["Truck", kpis.trucks ?? 0],
      ["Traffic Density Index", kpis.traffic_density ?? 0],
      ["Queue Length (m)", kpis.queue_length_m ?? 0],
      ["Current Green Road", signal.active_road_name || ""],
      ["Green Timer (s)", signal.green_remaining ?? 0],
      ["Average Waiting Time (s)", kpis.avg_waiting_time_sec ?? 0],
      [],
      ["ROAD-BY-ROAD METRICS"],
      ["Road ID", "Road Name", "Cars", "Motorcycles", "Bus", "Truck", "Density", "Queue (m)", "Signal State", "Waiting Time (s)", "FPS"],
    ];

    Object.values(roads).forEach(r => {
      rows.push([
        r.id,
        r.name,
        r.cars,
        r.motorcycles,
        r.buses,
        r.trucks,
        r.density,
        r.queue_length_m,
        r.state,
        r.waiting_time,
        r.fps
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Traffic_Session_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openPDFPreview() {
    const data = this.getTelemetryData();
    const modal = document.getElementById('report-pdf-modal');
    if (!modal) return;

    const reportContent = document.getElementById('pdf-report-body');
    if (reportContent) {
      const roads = data?.roads || {};
      const kpis = data?.kpis || {};
      const signal = data?.signal_controller || {};

      let roadRowsHtml = '';
      Object.values(roads).forEach(r => {
        roadRowsHtml += `
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 8px 10px; font-weight: 600;">${r.name}</td>
            <td style="padding: 8px 10px; font-family: 'IBM Plex Mono', monospace;">${r.cars}</td>
            <td style="padding: 8px 10px; font-family: 'IBM Plex Mono', monospace;">${r.motorcycles}</td>
            <td style="padding: 8px 10px; font-family: 'IBM Plex Mono', monospace;">${r.buses}</td>
            <td style="padding: 8px 10px; font-family: 'IBM Plex Mono', monospace;">${r.trucks}</td>
            <td style="padding: 8px 10px; font-family: 'IBM Plex Mono', monospace;">${r.density}</td>
            <td style="padding: 8px 10px; font-family: 'IBM Plex Mono', monospace;">${r.queue_length_m}m</td>
            <td style="padding: 8px 10px; font-weight: 600; color: ${r.state === 'GREEN' ? '#16A34A' : '#DC2626'};">${r.state}</td>
            <td style="padding: 8px 10px; font-family: 'IBM Plex Mono', monospace;">${r.waiting_time}s</td>
          </tr>
        `;
      });

      reportContent.innerHTML = `
        <div style="font-family: 'Space Grotesk', -apple-system, sans-serif; color: #0F172A; padding: 10px 0;">
          <div style="border-bottom: 2px solid #0F172A; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <h2 style="margin: 0; font-size: 1.3rem; letter-spacing: -0.02em;">Smart Traffic Management System</h2>
              <p style="margin: 4px 0 0; font-size: 0.85rem; color: #64748B;">Academic Project Surveillance &amp; Signal Optimization Telemetry</p>
            </div>
            <div style="text-align: right; font-family: 'IBM Plex Mono', monospace; font-size: 0.8rem; color: #64748B;">
              <div>Date: ${new Date().toLocaleDateString()}</div>
              <div>Time: ${data?.timestamp || new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          <!-- KPI Summary Grid -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px 14px; border-radius: 4px;">
              <span style="font-size: 0.72rem; color: #64748B; text-transform: uppercase;">Total Active Vehicles</span>
              <div style="font-family: 'IBM Plex Mono', monospace; font-size: 1.3rem; font-weight: 700; color: #0F172A; margin-top: 2px;">
                ${(kpis.cars || 0) + (kpis.motorcycles || 0) + (kpis.buses || 0) + (kpis.trucks || 0)}
              </div>
            </div>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px 14px; border-radius: 4px;">
              <span style="font-size: 0.72rem; color: #64748B; text-transform: uppercase;">Avg Traffic Density</span>
              <div style="font-family: 'IBM Plex Mono', monospace; font-size: 1.3rem; font-weight: 700; color: #0F172A; margin-top: 2px;">
                ${(kpis.traffic_density || 0).toFixed(1)}
              </div>
            </div>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px 14px; border-radius: 4px;">
              <span style="font-size: 0.72rem; color: #64748B; text-transform: uppercase;">Total Queue Backlog</span>
              <div style="font-family: 'IBM Plex Mono', monospace; font-size: 1.3rem; font-weight: 700; color: #0F172A; margin-top: 2px;">
                ${(kpis.queue_length_m || 0).toFixed(1)}m
              </div>
            </div>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px 14px; border-radius: 4px;">
              <span style="font-size: 0.72rem; color: #64748B; text-transform: uppercase;">Active Green Road</span>
              <div style="font-size: 0.95rem; font-weight: 600; color: #16A34A; margin-top: 4px;">
                ${signal.active_road_name || 'Road A (North)'}
              </div>
            </div>
          </div>

          <!-- Road Table -->
          <h4 style="margin: 0 0 8px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.03em;">Corridor Breakdown</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left; margin-bottom: 20px;">
            <thead>
              <tr style="background: #F1F5F9; border-bottom: 2px solid #CBD5E1; color: #475569;">
                <th style="padding: 8px 10px;">Approach</th>
                <th style="padding: 8px 10px;">Cars</th>
                <th style="padding: 8px 10px;">Moto</th>
                <th style="padding: 8px 10px;">Bus</th>
                <th style="padding: 8px 10px;">Truck</th>
                <th style="padding: 8px 10px;">Density</th>
                <th style="padding: 8px 10px;">Queue</th>
                <th style="padding: 8px 10px;">Signal</th>
                <th style="padding: 8px 10px;">Wait</th>
              </tr>
            </thead>
            <tbody>
              ${roadRowsHtml}
            </tbody>
          </table>

          <div style="font-size: 0.75rem; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 8px;">
            Signal Decision: ${signal.decision_explanation || 'Adaptive cycle in progress.'}
          </div>
        </div>
      `;
    }

    modal.classList.add('open');
  }

  closePDFPreview() {
    const modal = document.getElementById('report-pdf-modal');
    if (modal) modal.classList.remove('open');
  }

  printPDF() {
    window.print();
  }
}

window.TrafficApp = window.TrafficApp || {};
window.TrafficApp.reportEngine = new ReportEngine();
