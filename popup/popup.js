/**
 * SafeChat Popup Controller
 */
document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const alertsList = document.getElementById('alertsList');
  const emptyState = document.getElementById('emptyState');

  // Load state
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (data) => {
    if (!data) return;
    if (data.enabled !== undefined) {
      toggleSwitch.checked = data.enabled;
      updateStatus(data.enabled);
    }
    if (data.stats) updateStats(data.stats);
    if (data.alerts) renderAlerts(data.alerts);
  });

  // Toggle
  toggleSwitch.addEventListener('change', () => {
    chrome.runtime.sendMessage({ type: 'TOGGLE_ENABLED' }, (resp) => {
      updateStatus(resp.enabled);
    });
  });

  // Clear alerts
  document.getElementById('clearAlerts').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_ALERTS' });
    alertsList.innerHTML = '';
    alertsList.appendChild(emptyState);
    emptyState.style.display = 'block';
  });

  // Dashboard
  document.getElementById('openDashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
  });

  // Report
  document.getElementById('reportCrime').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://cybercrime.gov.in' });
  });

  function updateStatus(enabled) {
    statusDot.className = 'status-dot' + (enabled ? ' active' : '');
    statusText.textContent = enabled ? 'Protection Active' : 'Protection Disabled';
  }

  function updateStats(stats) {
    document.getElementById('statScanned').textContent = formatNum(stats.totalScanned || 0);
    document.getElementById('statThreats').textContent = formatNum(stats.totalThreats || 0);
    document.getElementById('statBullying').textContent = formatNum(stats.bullying || 0);
    document.getElementById('statScams').textContent = formatNum(stats.scams || 0);
  }

  function renderAlerts(alerts) {
    if (!alerts || alerts.length === 0) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';
    const frag = document.createDocumentFragment();
    alerts.slice(0, 15).forEach(a => {
      const el = document.createElement('div');
      el.className = 'alert-item';
      const sev = a.severity || 'medium';
      const typeClass = a.threatType === 'scam' ? 'type-scam' : a.threatType === 'both' ? 'type-both' : 'type-bullying';
      el.innerHTML = `
        <span class="alert-severity alert-severity-${sev}"></span>
        <div class="alert-info">
          <div class="alert-text">${escapeHTML(a.summary || 'Threat detected')}</div>
          <div class="alert-time">${timeAgo(a.timestamp)}</div>
        </div>
        <span class="alert-type ${typeClass}">${a.threatType || 'threat'}</span>`;
      frag.appendChild(el);
    });
    alertsList.innerHTML = '';
    alertsList.appendChild(frag);
  }

  function formatNum(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  function timeAgo(ts) {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }

  function escapeHTML(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
});
