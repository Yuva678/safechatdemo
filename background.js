/**
 * SafeChat — Background Service Worker (Manifest V3)
 * AI-powered threat detection + storage + alerts
 */

/* ─── 🔑 ADD YOUR API KEY HERE ─── */
const HF_API_KEY = "PASTE_YOUR_HUGGINGFACE_TOKEN_HERE";

/* ─── 🤖 AI TOXICITY DETECTION ─── */
async function detectToxicity(text) {
  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/unitary/toxic-bert",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    const data = await res.json();

    const toxicScore =
      data?.[0]?.find((x) => x.label === "toxic")?.score || 0;

    return toxicScore;
  } catch (e) {
    console.error("[SafeChat] AI Error:", e);
    return 0;
  }
}

/* ─── 🔗 SCAM DETECTION (FAST HEURISTIC) ─── */
function detectScam(text) {
  const t = text.toLowerCase();

  if (
    t.includes("free money") ||
    t.includes("click here") ||
    t.includes("urgent") ||
    t.includes("verify account") ||
    t.includes("win prize") ||
    t.includes("lottery") ||
    t.includes("bank alert")
  ) {
    return 0.8;
  }

  return 0;
}

/* ─── Installation ─── */
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    enabled: true,
    stats: { totalScanned: 0, totalThreats: 0, bullying: 0, scams: 0 },
    alerts: [],
    settings: { notifications: true, autoBlock: false, legalTips: true },
  });
  chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
  console.log('[SafeChat] Extension installed.');
});

/* ─── Message Listener ─── */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  /* 🔥 AI CHECK HANDLER */
  if (msg.type === "AI_CHECK") {
    Promise.all([
      detectToxicity(msg.text),
    ]).then(([toxicity]) => {

      const scam = detectScam(msg.text);

      sendResponse({
        toxicity,
        scam
      });

      /* 🔔 Trigger alerts if risky */
      if (toxicity > 0.7 || scam > 0.7) {

        const type = toxicity > scam ? "bullying" : "scam";

        addAlert({
          type,
          severity: toxicity > 0.85 || scam > 0.85 ? "high" : "medium",
          summary: "AI detected harmful content"
        });

        updateStats({
          threat: true,
          type
        });
      }
    });

    return true; // REQUIRED
  }

  /* ─── Existing handlers ─── */
  if (msg.type === 'UPDATE_STATS') {
    updateStats(msg.data).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'ADD_ALERT') {
    addAlert(msg.data).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'GET_STATE') {
    chrome.storage.local.get(['enabled', 'stats', 'alerts', 'settings'], (data) => {
      sendResponse(data);
    });
    return true;
  }

  if (msg.type === 'TOGGLE_ENABLED') {
    chrome.storage.local.get(['enabled'], (data) => {
      const newVal = !data.enabled;
      chrome.storage.local.set({ enabled: newVal });
      updateBadge(newVal);
      sendResponse({ enabled: newVal });
    });
    return true;
  }

  if (msg.type === 'CLEAR_ALERTS') {
    chrome.storage.local.set({ alerts: [] });
    sendResponse({ ok: true });
    return true;
  }
});

/* ─── Stats Update ─── */
async function updateStats(delta) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['stats'], (data) => {
      const stats = data.stats || { totalScanned: 0, totalThreats: 0, bullying: 0, scams: 0 };

      if (delta.scanned) stats.totalScanned += delta.scanned;

      if (delta.threat) {
        stats.totalThreats += 1;
        if (delta.type === 'bullying') stats.bullying += 1;
        if (delta.type === 'scam') stats.scams += 1;
      }

      chrome.storage.local.set({ stats }, () => {
        updateBadge(true, stats.totalThreats);
        resolve();
      });
    });
  });
}

/* ─── Alert Management ─── */
async function addAlert(alert) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['alerts', 'settings'], (data) => {
      const alerts = data.alerts || [];

      const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        timestamp: new Date().toISOString(),
        ...alert,
      };

      alerts.unshift(entry);
      if (alerts.length > 100) alerts.length = 100;

      chrome.storage.local.set({ alerts }, () => {
        if (data.settings?.notifications && alert.severity !== 'low') {
          showNotification(entry);
        }
        resolve();
      });
    });
  });
}

/* ─── Notifications ─── */
function showNotification(alert) {
  const severityLabel = alert.severity === 'high' ? '🔴 HIGH RISK' : '🟡 MEDIUM RISK';

  chrome.notifications.create(alert.id, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: `SafeChat Alert — ${severityLabel}`,
    message: alert.summary || 'Potentially harmful content detected.',
    priority: alert.severity === 'high' ? 2 : 1,
  });
}

/* ─── Badge ─── */
function updateBadge(enabled, threatCount) {
  if (!enabled) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#666' });
    return;
  }

  if (threatCount && threatCount > 0) {
    chrome.action.setBadgeText({ text: String(threatCount) });
    chrome.action.setBadgeBackgroundColor({ color: '#ff4757' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}
