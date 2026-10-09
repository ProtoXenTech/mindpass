/**
 * MindPass Core Pattern Generator
 * Implementation of Pattern 2 ("The Bookend Sandwich")
 * Formula: [Secret] + [Domain First (UPPER)] + [Domain Last (lower)] + [Email First (lower)] + [Email Last (lower)] + [Domain Length] + [Symbol]
 */

// Common two-part country-code Second-Level Domains (ccSLDs)
const TWO_PART_TLD_REGEX = /\.(co|com|org|net|gov|edu|mil|ac|ne|gen|firm|ind|ltd|plc|me)\.([a-z]{2})$/i;

/**
 * Extracts the clean domain string from a URL or hostname.
 * Keeps subdomains (e.g. app.example.com -> app.example) while stripping TLDs and www.
 * @param {string} input - URL or hostname
 * @returns {{ fullHost: string, domainString: string }}
 */
function parseDomain(input) {
  if (!input || typeof input !== 'string') {
    return { fullHost: 'localhost', domainString: 'localhost' };
  }

  let str = input.trim();

  // Extract hostname if full URL provided
  if (str.includes('://')) {
    try {
      const parsed = new URL(str);
      str = parsed.hostname;
    } catch (e) {
      str = str.split('://')[1] || str;
      str = str.split('/')[0];
    }
  }

  // Remove port and path/query leftovers if any
  str = str.split('/')[0];
  str = str.split('?')[0];
  str = str.split('#')[0];
  str = str.split(':')[0].toLowerCase();

  // Handle localhost / IP addresses
  if (str === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(str)) {
    return { fullHost: str, domainString: str };
  }

  // Remove leading www.
  if (str.startsWith('www.')) {
    str = str.slice(4);
  }

  const fullHost = str;

  // Check for two-part ccTLDs first (e.g. .co.uk, .com.bd, .org.au)
  if (TWO_PART_TLD_REGEX.test(str)) {
    str = str.replace(TWO_PART_TLD_REGEX, '');
  } else {
    // Single-part TLD (e.g. .com, .org, .io, .design, .technology)
    const dotIndex = str.lastIndexOf('.');
    if (dotIndex > 0) {
      str = str.substring(0, dotIndex);
    }
  }

  const domainString = str || fullHost;

  return { fullHost, domainString };
}

/**
 * Extracts first and last character of email/username before @ symbol.
 * Always normalizes characters to lowercase to prevent mobile auto-capitalization bugs.
 * @param {string} emailOrUser 
 * @returns {{ username: string, firstChar: string, lastChar: string }}
 */
function parseEmailUser(emailOrUser) {
  if (!emailOrUser || typeof emailOrUser !== 'string') {
    return { username: 'user', firstChar: 'u', lastChar: 'r' };
  }

  const trimmed = emailOrUser.trim().toLowerCase();
  const username = trimmed.split('@')[0] || trimmed;

  if (username.length === 0) {
    return { username: 'user', firstChar: 'u', lastChar: 'r' };
  }

  const firstChar = username.charAt(0).toLowerCase();
  const lastChar = username.charAt(username.length - 1).toLowerCase();

  return { username, firstChar, lastChar };
}

/**
 * Generates a Pattern 2 deterministic password
 * @param {Object} options
 * @param {string} options.urlOrHostname - Target site URL or domain
 * @param {string} options.emailOrUser - User email or account username
 * @param {string} [options.secret='Saj'] - Master secret prefix
 * @param {string} [options.symbol='!'] - Special character symbol
 * @returns {string} Generated password
 */
function generatePassword({ urlOrHostname, emailOrUser, secret = 'Saj', symbol = '!' }) {
  const masterSecret = (secret && secret.trim()) ? secret.trim() : 'Saj';
  const masterSymbol = (symbol && symbol.trim()) ? symbol.trim() : '!';

  const { domainString } = parseDomain(urlOrHostname);
  const { firstChar: emailFirst, lastChar: emailLast } = parseEmailUser(emailOrUser);

  const domainFirstUpper = domainString.charAt(0).toUpperCase();
  const domainLastLower = domainString.charAt(domainString.length - 1).toLowerCase();
  const domainLength = domainString.length;

  return `${masterSecret}${domainFirstUpper}${domainLastLower}${emailFirst}${emailLast}${domainLength}${masterSymbol}`;
}

// Universal module export for Browser scripts and Node environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseDomain, parseEmailUser, generatePassword };
}
