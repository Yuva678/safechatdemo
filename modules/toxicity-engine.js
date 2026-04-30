/**
 * SafeChat Toxicity Detection Engine
 * Heuristic-based NLP engine for detecting cyberbullying, hate speech, threats, and harassment.
 * Uses weighted pattern matching with category-level scoring and explanation generation.
 */

// eslint-disable-next-line no-unused-vars
const SafeChatToxicity = (() => {
  'use strict';

  /* ─── Category Definitions with Weighted Patterns ─── */
  const CATEGORIES = {
    profanity: {
      label: 'Profanity',
      weight: 0.25,
      patterns: [
        /\b(?:fuck|f+u+c+k+|fck|fuk|fuq|f\*ck|f\*\*k)\w*/gi,
        /\b(?:shit|sh[i1!]t|sh\*t|bullshit|bs)\b/gi,
        /\b(?:ass|a[s$]{2}|asshole|arsehole)\b/gi,
        /\b(?:damn|dammit|damnit|goddam)\w*/gi,
        /\b(?:bitch|b[i1!]tch|b\*tch)\w*/gi,
        /\b(?:bastard|crap|piss|dick|cock|cunt)\w*/gi,
      ]
    },
    threats: {
      label: 'Threats & Violence',
      weight: 0.95,
      patterns: [
        /\b(?:i'?ll|i\s*will|gonna|going\s*to)\s+(?:kill|murder|destroy|end|hurt|beat|stab|shoot|burn)\s+(?:you|u|him|her|them)\b/gi,
        /\b(?:kill\s*(?:your|ur)self|kys|go\s*die)\b/gi,
        /\b(?:death\s*threat|i.*(?:bomb|gun|knife|weapon).*you)\b/gi,
        /\b(?:watch\s*(?:your|ur)\s*back|you'?re?\s*dead)\b/gi,
        /\b(?:i'?ll\s*find\s*(?:you|u|where\s*you\s*live))\b/gi,
        /\b(?:beat\s*(?:you|u)\s*up|punch\s*(?:you|u))\b/gi,
      ]
    },
    harassment: {
      label: 'Harassment & Bullying',
      weight: 0.70,
      patterns: [
        /you(?:'re|r|\s*are)\s*(?:so\s*)?(?:ugly|fat|stupid|dumb|worthless|pathetic|disgusting|useless|an?\s*loser|nobody|trash|garbage)/gi,
        /(?:no\s*one|nobody)\s*(?:likes|loves|cares?\s*(?:about)?)\s*(?:you|u)/gi,
        /everyone\s*hates\s*(?:you|u)/gi,
        /you\s*(?:should|deserve\s*to)\s*(?:die|suffer|be\s*alone)/gi,
        /\b(?:shut\s*(?:up|the\s*f))\b/gi,
        /\b(?:get\s*lost|go\s*away|nobody\s*asked\s*(?:you|u))\b/gi,
        /\b(?:cry\s*baby|wimp|weakling|coward)\b/gi,
        /\b(?:stupid|dumb|idiot|moron|loser|ugly|pathetic|worthless|disgusting|useless)\b/gi,
      ]
    },
    hate_speech: {
      label: 'Hate Speech',
      weight: 0.90,
      patterns: [
        /\b(?:nigger|nigga|n[i1!]gg[ae]r?|chink|sp[i1!]c|wetback|k[i1!]ke|f[a@]gg?[o0]t|tr[a@]nny|retard)\b/gi,
        /\b(?:go\s*back\s*to\s*(?:your|ur)\s*country)\b/gi,
        /\b(?:you\s*people|your\s*kind)\b/gi,
        /\b(?:subhuman|inferior\s*race|mongrel)\b/gi,
      ]
    },
    sexual_harassment: {
      label: 'Sexual Harassment',
      weight: 0.85,
      patterns: [
        /\b(?:send\s*(?:nudes|pics|photos)|show\s*(?:me\s*your|ur)\s*(?:body|boobs|tits))\b/gi,
        /\b(?:i'?ll\s*(?:rape|molest|grope)\s*(?:you|u))\b/gi,
        /\b(?:sexual\s*(?:favor|act)|sleep\s*with\s*me)\b/gi,
        /\b(?:wh[o0]re|sl[u\*]t|h[o0]e)\b/gi,
      ]
    },
    intimidation: {
      label: 'Intimidation & Stalking',
      weight: 0.80,
      patterns: [
        /\b(?:i\s*know\s*where\s*you\s*live)\b/gi,
        /\b(?:i'?m\s*watching\s*(?:you|u))\b/gi,
        /\b(?:i'?ll\s*(?:expose|leak|share)\s*(?:your|ur)\s*(?:photos|pics|nudes|secrets|info))\b/gi,
        /\b(?:i\s*(?:have|got)\s*(?:your|ur)\s*(?:address|number|photos|info))\b/gi,
        /\b(?:you\s*can'?t\s*(?:hide|escape|run)\s*from\s*me)\b/gi,
      ]
    },
    manipulation: {
      label: 'Emotional Manipulation',
      weight: 0.50,
      patterns: [
        /\b(?:if\s*you\s*(?:loved?|cared?\s*about)\s*me\s*you\s*(?:would|will))\b/gi,
        /\b(?:it'?s\s*(?:all\s*)?your\s*fault)\b/gi,
        /\b(?:you\s*(?:made|make)\s*me\s*(?:do|feel)\s*(?:this|that))\b/gi,
        /\b(?:nobody\s*(?:else\s*)?will\s*(?:ever\s*)?(?:love|want)\s*(?:you|u))\b/gi,
      ]
    }
  };

  /* ─── Intensity Amplifiers ─── */
  const AMPLIFIERS = [
    { pattern: /!!+/g, boost: 0.05 },
    { pattern: /[A-Z]{4,}/g, boost: 0.08 },
    { pattern: /\b(?:really|very|extremely|totally|absolutely|fucking|freaking)\b/gi, boost: 0.06 },
    { pattern: /\b(?:always|never|every\s*time)\b/gi, boost: 0.04 },
  ];

  /* ─── Analysis Function ─── */
  function analyze(text) {
    if (!text || typeof text !== 'string' || text.trim().length < 2) {
      return { toxic: false, score: 0, severity: 'safe', categories: [], explanation: '', flags: [] };
    }

    const normalized = text.trim()
      .replace(/[\u2018\u2019\u201A\u2039\u203A]/g, "'")  // smart single quotes → straight
      .replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g, '"')   // smart double quotes → straight
      .replace(/\s+/g, ' ');                                 // collapse whitespace
    let totalScore = 0;
    const matchedCategories = [];
    const flags = [];
    const explanations = [];

    // Run each category
    for (const [catKey, cat] of Object.entries(CATEGORIES)) {
      let categoryHits = 0;
      const matchedTerms = [];

      for (const pattern of cat.patterns) {
        // Reset regex state
        pattern.lastIndex = 0;
        const matches = normalized.match(pattern);
        if (matches) {
          categoryHits += matches.length;
          matchedTerms.push(...matches.map(m => m.toLowerCase()));
        }
      }

      if (categoryHits > 0) {
        // Diminishing returns for multiple hits in same category
        const hitScore = Math.min(1, categoryHits * 0.4);
        const catScore = hitScore * cat.weight;
        totalScore += catScore;

        matchedCategories.push({
          category: catKey,
          label: cat.label,
          score: parseFloat(catScore.toFixed(3)),
          hits: categoryHits,
        });

        flags.push(cat.label);
        const uniqueTerms = [...new Set(matchedTerms)].slice(0, 3);
        explanations.push(`${cat.label} detected (matched: "${uniqueTerms.join('", "')}")`);
      }
    }

    // Apply amplifiers
    let amplifierBoost = 0;
    for (const amp of AMPLIFIERS) {
      amp.pattern.lastIndex = 0;
      const m = normalized.match(amp.pattern);
      if (m) amplifierBoost += amp.boost * m.length;
    }
    totalScore += Math.min(0.15, amplifierBoost);

    // Clamp
    totalScore = Math.min(1, Math.max(0, totalScore));

    // Determine severity
    let severity = 'safe';
    if (totalScore >= 0.6) severity = 'high';
    else if (totalScore >= 0.3) severity = 'medium';
    else if (totalScore > 0.05) severity = 'low';

    // Sort categories by score
    matchedCategories.sort((a, b) => b.score - a.score);

    return {
      toxic: totalScore > 0.05,
      score: parseFloat(totalScore.toFixed(3)),
      severity,
      categories: matchedCategories,
      flags,
      explanation: explanations.length
        ? explanations.join('; ')
        : 'No harmful content detected.',
    };
  }

  /* ─── Quick Check (lightweight) ─── */
  function quickCheck(text) {
    if (!text || text.length < 3) return false;
    for (const cat of Object.values(CATEGORIES)) {
      for (const pattern of cat.patterns) {
        pattern.lastIndex = 0;
        if (pattern.test(text)) return true;
      }
    }
    return false;
  }

  return { analyze, quickCheck, CATEGORIES };
})();
