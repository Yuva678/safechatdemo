/**
 * SafeChat Scam & Phishing Detection Engine
 * Detects suspicious URLs, fake domains, brand impersonation, and scam patterns.
 */
const SafeChatScam = (() => {
  'use strict';

  const BRAND_DOMAINS = {
    'google.com': ['gogle.com','googl.com','g00gle.com','gooogle.com','google-login.com'],
    'facebook.com': ['faceb00k.com','faceboook.com','fb-login.com','facebok.com'],
    'instagram.com': ['instagran.com','lnstagram.com','instagram-login.com'],
    'twitter.com': ['twiter.com','tvvitter.com','tw1tter.com'],
    'amazon.com': ['amaz0n.com','amazom.com','amazon-deals.com'],
    'paypal.com': ['paypa1.com','paypai.com','paypal-verify.com'],
    'netflix.com': ['netfllx.com','netfl1x.com','netflix-login.com'],
    'apple.com': ['app1e.com','appie.com','apple-id-verify.com'],
    'whatsapp.com': ['whatsap.com','whatsapp-verify.com','wh4tsapp.com'],
    'sbi.co.in': ['sbi-online.com','sbi-verify.com','onlinesbi-login.com'],
    'paytm.com': ['paytm-verify.com','paytm-offer.com','pay-tm.com'],
  };

  const SUSPICIOUS_TLDS = ['.xyz','.tk','.ml','.ga','.cf','.gq','.top','.loan','.win','.bid','.click','.icu','.buzz','.monster'];

  const URL_SHORTENERS = ['bit.ly','tinyurl.com','goo.gl','t.co','ow.ly','is.gd','cutt.ly','rb.gy'];

  const SCAM_PATTERNS = [
    { pattern: /\b(?:you(?:'ve| have)?\s*won|congratulations?\s*!?\s*you|winner)\b/gi, label: 'Prize/Lottery Scam', weight: 0.7 },
    { pattern: /\b(?:claim\s*(?:your|now)|redeem\s*(?:your|now))\b/gi, label: 'Claim Urgency', weight: 0.6 },
    { pattern: /\b(?:urgent|immediately|act\s*now|limited\s*time|expires?\s*(?:today|soon))\b/gi, label: 'Urgency Pressure', weight: 0.4 },
    { pattern: /\b(?:verify\s*(?:your|account)|confirm\s*(?:your|identity)|update\s*(?:your\s*)?(?:payment|account))\b/gi, label: 'Account Phishing', weight: 0.7 },
    { pattern: /\b(?:account\s*(?:suspended|locked|compromised)|unauthorized\s*(?:access|login))\b/gi, label: 'Account Scare', weight: 0.7 },
    { pattern: /\b(?:earn\s*(?:money|cash|₹|rs|\$)\s*(?:from\s*home|daily|online))\b/gi, label: 'Money Scam', weight: 0.5 },
    { pattern: /\b(?:invest(?:ment)?\s*(?:opportunity|guaranteed)|double\s*your\s*money)\b/gi, label: 'Investment Fraud', weight: 0.7 },
    { pattern: /\b(?:free\s*(?:bitcoin|crypto|eth)|crypto\s*airdrop)\b/gi, label: 'Crypto Scam', weight: 0.65 },
    { pattern: /\b(?:send\s*(?:your|me)\s*(?:otp|password|pin|cvv|card\s*number))\b/gi, label: 'Credential Theft', weight: 0.9 },
    { pattern: /\b(?:kyc\s*(?:update|verification|pending)|pan\s*(?:link|verify)|aadhaar\s*(?:link|update))\b/gi, label: 'KYC Scam (India)', weight: 0.7 },
    { pattern: /\b(?:forward\s*(?:this|to\s*\d+\s*(?:people|friends)))\b/gi, label: 'Chain Message', weight: 0.4 },
  ];

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
  }

  function extractURLs(text) {
    const re = /https?:\/\/[^\s<>"')\]]+|www\.[^\s<>"')\]]+/gi;
    return (text.match(re) || []).map(u => {
      if (!u.startsWith('http')) u = 'http://' + u;
      try { return new URL(u); } catch { return null; }
    }).filter(Boolean);
  }

  function analyzeURL(url) {
    const reasons = [];
    let riskScore = 0;
    const hostname = url.hostname.toLowerCase();
    const fullURL = url.href.toLowerCase();

    for (const [legit, fakes] of Object.entries(BRAND_DOMAINS)) {
      if (fakes.some(f => hostname.includes(f.replace('.com','')))) {
        riskScore += 0.85;
        reasons.push('Possible impersonation of ' + legit);
      }
      const domain = hostname.replace(/^www\./,'').split('.')[0];
      const brand = legit.split('.')[0];
      const dist = levenshtein(domain, brand);
      if (dist > 0 && dist <= 2 && domain !== brand) {
        riskScore += 0.7;
        reasons.push('Domain "' + hostname + '" similar to ' + legit + ' (typosquatting)');
      }
    }

    for (const tld of SUSPICIOUS_TLDS) {
      if (hostname.endsWith(tld)) { riskScore += 0.3; reasons.push('Suspicious TLD: ' + tld); break; }
    }
    for (const s of URL_SHORTENERS) {
      if (hostname === s || hostname === 'www.' + s) { riskScore += 0.25; reasons.push('URL shortener (hidden destination)'); break; }
    }
    if (hostname.split('.').length > 3) { riskScore += 0.2; reasons.push('Excessive subdomains'); }
    if (/\d{4,}/.test(hostname)) { riskScore += 0.15; reasons.push('IP-like domain'); }
    if (fullURL.includes('@')) { riskScore += 0.3; reasons.push('@ symbol redirect trick'); }
    if (/login|verify|secure|account|update|confirm|banking/i.test(url.pathname)) {
      riskScore += 0.25; reasons.push('Suspicious path keywords');
    }

    riskScore = Math.min(1, riskScore);
    let riskLevel = 'safe';
    if (riskScore >= 0.6) riskLevel = 'high';
    else if (riskScore >= 0.3) riskLevel = 'medium';
    else if (riskScore > 0.05) riskLevel = 'low';

    return { url: url.href, hostname, isScam: riskScore >= 0.3, riskScore: +riskScore.toFixed(3), riskLevel, reasons };
  }

  function analyzeMessage(text) {
    if (!text || text.trim().length < 5)
      return { isScam: false, score: 0, riskLevel: 'safe', patterns: [], urlResults: [], reasoning: '' };

    let totalScore = 0;
    const matchedPatterns = [];
    const reasonParts = [];

    for (const sp of SCAM_PATTERNS) {
      sp.pattern.lastIndex = 0;
      const m = text.match(sp.pattern);
      if (m) {
        totalScore += sp.weight;
        matchedPatterns.push({ label: sp.label, weight: sp.weight });
        reasonParts.push(sp.label);
      }
    }

    const urlResults = extractURLs(text).map(u => analyzeURL(u));
    for (const ur of urlResults) {
      if (ur.isScam) { totalScore += ur.riskScore; reasonParts.push('Suspicious URL: ' + ur.hostname); }
    }

    totalScore = Math.min(1, totalScore);
    let riskLevel = 'safe';
    if (totalScore >= 0.6) riskLevel = 'high';
    else if (totalScore >= 0.3) riskLevel = 'medium';
    else if (totalScore > 0.05) riskLevel = 'low';

    return {
      isScam: totalScore >= 0.2, score: +totalScore.toFixed(3), riskLevel,
      patterns: matchedPatterns, urlResults,
      reasoning: reasonParts.length ? reasonParts.join('; ') : 'No scam indicators found.',
    };
  }

  return { analyzeURL, analyzeMessage, extractURLs };
})();
