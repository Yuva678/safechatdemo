/**
 * SafeChat Legal Awareness Layer (India-focused)
 * Provides simplified legal references for detected harmful behavior.
 * DISCLAIMER: This does NOT constitute legal advice.
 */
const SafeChatLegal = (() => {
  'use strict';

  const LAWS = {
    cyberbullying: {
      title: 'Cyberbullying & Online Harassment',
      sections: [
        { law: 'Information Technology Act, 2000 — Section 66A*', note: 'Sending offensive messages through communication services (*struck down by Supreme Court in Shreya Singhal v. UOI, but awareness remains relevant).' },
        { law: 'IT Act — Section 67', note: 'Publishing or transmitting obscene material in electronic form. Punishable with up to 3 years imprisonment.' },
        { law: 'IPC Section 507', note: 'Criminal intimidation by anonymous communication.' },
        { law: 'IPC Section 509', note: 'Word, gesture or act intended to insult the modesty of a woman.' },
      ],
      warning: 'Repeated online harassment may violate multiple provisions of the IT Act and Indian Penal Code.',
    },
    threats: {
      title: 'Criminal Threats & Intimidation',
      sections: [
        { law: 'IPC Section 503', note: 'Criminal intimidation — threatening with injury to person, reputation, or property.' },
        { law: 'IPC Section 506', note: 'Punishment for criminal intimidation. Up to 2 years imprisonment, or 7 years for death threats.' },
        { law: 'IT Act — Section 66E', note: 'Punishment for violation of privacy.' },
      ],
      warning: 'Online threats could fall under criminal intimidation provisions and may be reported to cyber police.',
    },
    defamation: {
      title: 'Defamation',
      sections: [
        { law: 'IPC Section 499', note: 'Defamation — making or publishing any imputation concerning any person, intending to harm reputation.' },
        { law: 'IPC Section 500', note: 'Punishment for defamation — up to 2 years imprisonment and fine.' },
      ],
      warning: 'False or harmful statements about individuals online may constitute defamation under Indian law.',
    },
    scam: {
      title: 'Online Fraud & Scams',
      sections: [
        { law: 'IT Act — Section 66D', note: 'Cheating by personation using computer resource. Punishable up to 3 years imprisonment and fine up to ₹1 lakh.' },
        { law: 'IT Act — Section 66C', note: 'Identity theft — using electronic signature, password or unique identification of another person.' },
        { law: 'IPC Section 420', note: 'Cheating and dishonestly inducing delivery of property. Up to 7 years imprisonment.' },
        { law: 'IPC Section 419', note: 'Cheating by personation.' },
      ],
      warning: 'Phishing, impersonation, and online fraud are serious offenses under Indian cyber law.',
    },
    hate_speech: {
      title: 'Hate Speech & Discrimination',
      sections: [
        { law: 'IPC Section 153A', note: 'Promoting enmity between different groups on grounds of religion, race, etc.' },
        { law: 'IPC Section 295A', note: 'Deliberate act to outrage religious feelings.' },
        { law: 'IT Act — Section 67', note: 'Publishing or transmitting obscene material electronically.' },
      ],
      warning: 'Hate speech online may violate provisions against promoting enmity and could lead to criminal prosecution.',
    },
    sexual_harassment: {
      title: 'Sexual Harassment Online',
      sections: [
        { law: 'IT Act — Section 67A', note: 'Publishing sexually explicit material electronically. Up to 5 years imprisonment on first conviction.' },
        { law: 'IT Act — Section 67B', note: 'Publishing material depicting children in sexually explicit act.' },
        { law: 'IPC Section 354D', note: 'Stalking, including cyberstalking.' },
        { law: 'POSH Act, 2013', note: 'Prevention of Sexual Harassment at workplace (extends to online workspaces).' },
      ],
      warning: 'Online sexual harassment is a punishable offense and may be reported to both cyber police and the National Commission for Women.',
    },
  };

  const RESOURCES = {
    cyberCrimePortal: { name: 'National Cyber Crime Reporting Portal', url: 'https://cybercrime.gov.in', phone: '1930' },
    womenHelpline: { name: 'Women Helpline', phone: '181' },
    childHelpline: { name: 'Childline India', phone: '1098' },
    policeEmergency: { name: 'Police Emergency', phone: '112' },
  };

  function getLegalInfo(categories) {
    const relevant = new Map();
    for (const cat of categories) {
      const key = mapCategoryToLaw(cat);
      if (key && LAWS[key] && !relevant.has(key)) {
        relevant.set(key, LAWS[key]);
      }
    }
    if (relevant.size === 0 && categories.length > 0) {
      relevant.set('cyberbullying', LAWS.cyberbullying);
    }
    return {
      laws: Array.from(relevant.values()),
      resources: RESOURCES,
      disclaimer: 'This information is for awareness only and does not constitute legal advice. Consult a qualified legal professional for specific guidance.',
    };
  }

  function mapCategoryToLaw(category) {
    const map = {
      'profanity': 'cyberbullying',
      'threats': 'threats',
      'harassment': 'cyberbullying',
      'hate_speech': 'hate_speech',
      'sexual_harassment': 'sexual_harassment',
      'intimidation': 'threats',
      'manipulation': 'cyberbullying',
      'defamation': 'defamation',
    };
    return map[category] || map[category.toLowerCase()] || null;
  }

  function getScamLegalInfo() {
    return {
      laws: [LAWS.scam],
      resources: RESOURCES,
      disclaimer: 'This information is for awareness only and does not constitute legal advice.',
    };
  }

  return { getLegalInfo, getScamLegalInfo, LAWS, RESOURCES };
})();
