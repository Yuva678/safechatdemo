/**
 * SafeChat Dashboard Controller
 * Loads stats & alerts from chrome.storage, renders charts using Canvas API.
 */
document.addEventListener('DOMContentLoaded', () => {
  loadData();

  document.getElementById('refreshBtn').addEventListener('click', loadData);
  document.getElementById('reportBtn').addEventListener('click', () => {
    window.open('https://cybercrime.gov.in', '_blank');
  });
  document.getElementById('clearBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_ALERTS' }, () => loadData());
  });

  function loadData() {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (data) => {
      if (!data) return;
      const stats = data.stats || { totalScanned: 0, totalThreats: 0, bullying: 0, scams: 0 };
      const alerts = data.alerts || [];
      updateStats(stats);
      drawPieChart(stats);
      drawBarChart(alerts);
      renderTable(alerts);
    });
  }

  function updateStats(s) {
    document.getElementById('totalScanned').textContent = s.totalScanned;
    document.getElementById('totalThreats').textContent = s.totalThreats;
    document.getElementById('totalBullying').textContent = s.bullying;
    document.getElementById('totalScams').textContent = s.scams;
  }

  /* ─── Pie Chart ─── */
  function drawPieChart(stats) {
    const canvas = document.getElementById('pieChart');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 280 * dpr;
    canvas.height = 280 * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = '280px';
    canvas.style.height = '280px';

    ctx.clearRect(0, 0, 280, 280);
    const cx = 140, cy = 130, r = 90;
    const total = (stats.bullying || 0) + (stats.scams || 0);

    if (total === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '13px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', cx, cy + 5);
      return;
    }

    const slices = [
      { label: 'Bullying', value: stats.bullying, color: '#ff4757' },
      { label: 'Scams', value: stats.scams, color: '#ffa502' },
    ].filter(s => s.value > 0);

    let start = -Math.PI / 2;
    slices.forEach(slice => {
      const angle = (slice.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + angle);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      // Label
      const mid = start + angle / 2;
      const lx = cx + Math.cos(mid) * (r * 0.6);
      const ly = cy + Math.sin(mid) * (r * 0.6);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(slice.value / total * 100) + '%', lx, ly);
      start += angle;
    });

    // Center hole
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a14';
    ctx.fill();
    ctx.fillStyle = '#e8e8f0';
    ctx.font = 'bold 22px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(total, cx, cy + 4);
    ctx.font = '10px Segoe UI';
    ctx.fillStyle = 'rgba(232,232,240,0.4)';
    ctx.fillText('TOTAL', cx, cy + 18);

    // Legend
    let ly2 = 250;
    slices.forEach(s => {
      ctx.fillStyle = s.color;
      ctx.fillRect(80, ly2 - 8, 10, 10);
      ctx.fillStyle = 'rgba(232,232,240,0.6)';
      ctx.font = '11px Segoe UI';
      ctx.textAlign = 'left';
      ctx.fillText(`${s.label}: ${s.value}`, 96, ly2);
      ly2 += 18;
    });
  }

  /* ─── Bar Chart ─── */
  function drawBarChart(alerts) {
    const canvas = document.getElementById('barChart');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 380 * dpr;
    canvas.height = 280 * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = '380px';
    canvas.style.height = '280px';

    ctx.clearRect(0, 0, 380, 280);

    const counts = { high: 0, medium: 0, low: 0 };
    alerts.forEach(a => { if (counts[a.severity] !== undefined) counts[a.severity]++; });

    const bars = [
      { label: 'High', value: counts.high, color: '#ff4757' },
      { label: 'Medium', value: counts.medium, color: '#ffa502' },
      { label: 'Low', value: counts.low, color: '#2ed573' },
    ];

    const maxVal = Math.max(1, ...bars.map(b => b.value));
    const chartH = 200, baseY = 240, barW = 60, gap = 40;
    const startX = (380 - (bars.length * barW + (bars.length - 1) * gap)) / 2;

    bars.forEach((bar, i) => {
      const x = startX + i * (barW + gap);
      const h = (bar.value / maxVal) * chartH;
      const y = baseY - h;

      // Bar with rounded top
      const radius = 6;
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.lineTo(x + barW - radius, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
      ctx.lineTo(x + barW, baseY);
      ctx.closePath();
      ctx.fillStyle = bar.color;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Value
      ctx.fillStyle = '#e8e8f0';
      ctx.font = 'bold 16px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(bar.value, x + barW / 2, y - 8);

      // Label
      ctx.fillStyle = 'rgba(232,232,240,0.5)';
      ctx.font = '11px Segoe UI';
      ctx.fillText(bar.label, x + barW / 2, baseY + 18);
    });

    // Axis line
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(20, baseY);
    ctx.lineTo(360, baseY);
    ctx.stroke();
  }

  /* ─── Table ─── */
  function renderTable(alerts) {
    const body = document.getElementById('alertsBody');
    const empty = document.getElementById('emptyTable');
    if (!alerts.length) { body.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    body.innerHTML = alerts.slice(0, 50).map(a => `
      <tr>
        <td>${formatTime(a.timestamp)}</td>
        <td>${esc(a.platform || '—')}</td>
        <td>${esc(a.threatType || 'unknown')}</td>
        <td><span class="sev-badge sev-${a.severity || 'medium'}">${(a.severity || 'medium').toUpperCase()}</span></td>
        <td>${esc(a.summary || '')}</td>
      </tr>`).join('');
  }

  function formatTime(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
});
