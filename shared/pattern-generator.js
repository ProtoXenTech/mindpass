/**
 * MindPass Core Pattern Generator
 * Implementation of Pattern 2 ("The Bookend Sandwich")
 * Formula: [Secret] + [Domain First (UPPER)] + [Domain Last (lower)] + [Email First] + [Email Last] + [Domain Length] + [Symbol]
 */

const TLD_REGEX = /\.(com|org|net|gov|edu|mil|int|io|co|ai|me|info|biz|bd|uk|ca|de|fr|jp|au|cn|app|dev|xyz|tech|online|store|site|club|vip|page|cloud|link)\.[a-z]{2,3}$|\.(com|org|net|gov|edu|mil|int|io|co|ai|me|info|biz|bd|uk|ca|de|fr|jp|au|cn|app|dev|xyz|tech|online|store|site|club|vip|page|cloud|link)$/i;

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

  // Remove port if present
  str = str.split(':')[0].toLowerCase();

  // Handle localhost / IP
  if (str === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(str)) {
    return { fullHost: str, domainString: str };
  }

  // Remove leading www.
  if (str.startsWith('www.')) {
    str = str.slice(4);
  }

  const fullHost = str;

  // Strip TLD suffix
  let domainString = str.replace(TLD_REGEX, '');
  if (!domainString) {
    domainString = str;
  }

  return { fullHost, domainString };
}

/**
 * Extracts first and last character of email/username before @ symbol
 * @param {string} emailOrUser 
 * @returns {{ username: string, firstChar: string, lastChar: string }}
 */
function parseEmailUser(emailOrUser) {
  if (!emailOrUser || typeof emailOrUser !== 'string') {
    return { username: 'user', firstChar: 'u', lastChar: 'r' };
  }

  const trimmed = emailOrUser.trim();
  const username = trimmed.split('@')[0] || trimmed;

  if (username.length === 0) {
    return { username: 'user', firstChar: 'u', lastChar: 'r' };
  }

  const firstChar = username.charAt(0);
  const lastChar = username.charAt(username.length - 1);

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
