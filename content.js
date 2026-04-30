(function () {
  'use strict';

  const PLATFORMS = {
    whatsapp: {
      name: 'WhatsApp Web',
      hostMatch: 'web.whatsapp.com',
      composeSelector: 'div[contenteditable="true"], footer div[contenteditable="true"]',
      sendBtnSelector: 'button[data-testid="send"], span[data-icon="send"]',
    },
    twitter: {
      name: 'Twitter / X',
      hostMatch: ['twitter.com', 'x.com'],
      composeSelector: '[role="textbox"]',
      sendBtnSelector: '[data-testid="tweetButtonInline"]',
    },
    instagram: {
      name: 'Instagram',
      hostMatch: 'www.instagram.com',
      composeSelector: 'textarea, div[contenteditable="true"]',
      sendBtnSelector: 'button[type="submit"]',
    },
  };

  let config = null;
  let isEnabled = true;
  let bypassNextSend = false;

  function detectPlatform() {
    const host = location.hostname;
    for (const cfg of Object.values(PLATFORMS)) {
      const hosts = Array.isArray(cfg.hostMatch) ? cfg.hostMatch : [cfg.hostMatch];
      if (hosts.some(h => host.includes(h))) {
        config = cfg;
        console.log('[SafeChat] Platform:', cfg.name);
        return true;
      }
    }
    return false;
  }

  function getText(el) {
    return el?.value || el?.innerText || el?.textContent || '';
  }

  function findCompose() {
    const elements = document.querySelectorAll(config.composeSelector);
    for (let el of elements) {
      if (el.offsetParent !== null) return el;
    }
    return null;
  }

  function checkOutgoing(text) {
    const tox = SafeChatToxicity.analyze(text);
    const scam = SafeChatScam.analyzeMessage(text);

    if (tox.toxic && tox.severity !== 'low') return true;
    if (scam.isScam && scam.riskLevel !== 'low') return true;

    return false;
  }

  // 🔥 REAL-TIME TYPING DETECTION + AI
  function monitorTyping() {
    let lastCall = 0;

    document.addEventListener("input", (e) => {
      if (!isEnabled) return;

      const text = getText(e.target);
      if (!text || text.length < 3) return;

      // ⚡ Rule-based (fast)
      if (checkOutgoing(text)) {
        showToast("⚠️ Risky message detected", "error");
        return;
      }

      // 🔥 AI (throttled)
      const now = Date.now();
      if (now - lastCall < 1500) return;
      lastCall = now;

      chrome.runtime.sendMessage(
        { type: "AI_CHECK", text },
        (res) => {
          if (!res) return;

          if (res.toxicity > 0.7 || res.scam > 0.7) {
            showToast("🔥 AI detected harmful message!", "error");
          }
        }
      );
    });
  }

  function interceptOutgoing() {
    document.addEventListener('keydown', (e) => {
      if (!isEnabled || bypassNextSend) return;

      if (e.key === 'Enter' && !e.shiftKey) {
        const compose = findCompose();
        if (!compose) return;

        const text = getText(compose);

        // ⚡ Rule-based
        if (checkOutgoing(text)) {
          e.preventDefault();
          showWarningModal(compose);
          return;
        }

        // 🔥 AI check
        chrome.runtime.sendMessage(
          { type: "AI_CHECK", text },
          (res) => {
            if (!res) return;

            if (res.toxicity > 0.7 || res.scam > 0.7) {
              e.preventDefault();
              showWarningModal(compose);
            }
          }
        );
      }
    }, true);

    document.addEventListener('click', (e) => {
      if (!isEnabled || bypassNextSend) return;

      const btn = e.target.closest(config.sendBtnSelector);
      if (!btn) return;

      const compose = findCompose();
      if (!compose) return;

      const text = getText(compose);

      // ⚡ Rule-based
      if (checkOutgoing(text)) {
        e.preventDefault();
        showWarningModal(compose);
        return;
      }

      // 🔥 AI check
      chrome.runtime.sendMessage(
        { type: "AI_CHECK", text },
        (res) => {
          if (!res) return;

          if (res.toxicity > 0.7 || res.scam > 0.7) {
            e.preventDefault();
            showWarningModal(compose);
          }
        }
      );
    }, true);
  }

  function showWarningModal(compose) {
    const overlay = document.createElement('div');

    overlay.innerHTML = `
      <div style="
        position:fixed;
        top:0;left:0;width:100%;height:100%;
        background:rgba(0,0,0,0.7);
        display:flex;align-items:center;justify-content:center;
        z-index:9999;
      ">
        <div style="
          background:#1f1f2e;
          padding:25px;
          border-radius:15px;
          width:320px;
          text-align:center;
          color:white;
        ">
          <h2 style="color:#ff4757">⚠ High Risk Message</h2>
          <p>This message may be harmful.</p>

          <button id="edit">Edit</button>
          <button id="cancel">Cancel</button>
          <button id="send" style="background:#ff4757;color:white">Send Anyway</button>
        </div>
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      if (e.target.id === 'edit') overlay.remove();

      if (e.target.id === 'cancel') {
        compose.innerText = '';
        overlay.remove();
      }

      if (e.target.id === 'send') {
        bypassNextSend = true;
        overlay.remove();
        compose.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }
    });

    document.body.appendChild(overlay);
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.innerText = msg;
    toast.style = `
      position:fixed;
      bottom:20px;
      right:20px;
      background:red;
      color:white;
      padding:10px;
      border-radius:5px;
      z-index:9999;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function init() {
    if (!detectPlatform()) return;

    chrome.storage?.local?.get(['enabled'], (d) => {
      isEnabled = d?.enabled !== false;
    });

    monitorTyping();
    interceptOutgoing();
  }

  init();
})();