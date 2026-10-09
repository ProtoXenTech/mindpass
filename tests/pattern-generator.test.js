const assert = require('node:assert');
const test = require('node:test');
const { parseDomain, parseEmailUser, generatePassword } = require('../shared/pattern-generator');

test('parseDomain extracts domain strings correctly across standard and modern TLDs', () => {
  // Standard TLDs
  assert.strictEqual(parseDomain('https://vaultflow.com/login').domainString, 'vaultflow');
  assert.strictEqual(parseDomain('https://example.com/').domainString, 'example');

  // Subdomains (isolated)
  assert.strictEqual(parseDomain('https://app.example.com/dashboard').domainString, 'app.example');
  assert.strictEqual(parseDomain('admin.portal.example.com').domainString, 'admin.portal.example');

  // Two-part ccTLDs (.co.uk, .com.bd, .gov.bd, etc.)
  assert.strictEqual(parseDomain('my-site.co.uk').domainString, 'my-site');
  assert.strictEqual(parseDomain('https://cloudportal.com.bd').domainString, 'cloudportal');
  assert.strictEqual(parseDomain('https://portal.service.gov.bd/form').domainString, 'portal.service');

  // Modern new gTLDs (.design, .solutions, .dev, .app, .cloud)
  assert.strictEqual(parseDomain('https://studio.design').domainString, 'studio');
  assert.strictEqual(parseDomain('https://agency.solutions').domainString, 'agency');
  assert.strictEqual(parseDomain('https://my-app.cloud:8080/home?x=1').domainString, 'my-app');

  // Localhost & IP
  assert.strictEqual(parseDomain('localhost:3000').domainString, 'localhost');
  assert.strictEqual(parseDomain('http://127.0.0.1:8080/test').domainString, '127.0.0.1');
});

test('parseEmailUser normalizes casing and handles short or complex usernames', () => {
  // Standard email
  assert.deepStrictEqual(parseEmailUser('alex.dev@domain.com'), {
    username: 'alex.dev',
    firstChar: 'a',
    lastChar: 'v'
  });

  // Capitalized email (e.g. mobile auto-cap "Alex.Dev@domain.com")
  assert.deepStrictEqual(parseEmailUser('Alex.Dev@domain.com'), {
    username: 'alex.dev',
    firstChar: 'a',
    lastChar: 'v'
  });

  // 1-character username
  assert.deepStrictEqual(parseEmailUser('a@domain.com'), {
    username: 'a',
    firstChar: 'a',
    lastChar: 'a'
  });

  // Plain username
  assert.deepStrictEqual(parseEmailUser('Admin'), {
    username: 'admin',
    firstChar: 'a',
    lastChar: 'n'
  });
});

test('generatePassword creates identical password regardless of email casing', () => {
  const lower = generatePassword({
    urlOrHostname: 'https://vaultflow.com/',
    emailOrUser: 'alex.dev@domain.com',
    secret: 'Mnd',
    symbol: '!'
  });

  const upper = generatePassword({
    urlOrHostname: 'https://vaultflow.com/',
    emailOrUser: 'Alex.Dev@domain.com',
    secret: 'Mnd',
    symbol: '!'
  });

  // Both MUST be MndVwav9!
  assert.strictEqual(lower, 'MndVwav9!');
  assert.strictEqual(upper, 'MndVwav9!');
});

test('generatePassword handles subdomains and two-part ccTLDs deterministically', () => {
  // VaultFlow
  assert.strictEqual(generatePassword({
    urlOrHostname: 'https://vaultflow.com/',
    emailOrUser: 'alex.dev@domain.com',
    secret: 'Mnd',
    symbol: '!'
  }), 'MndVwav9!');

  // Subdomain (app.example.com)
  assert.strictEqual(generatePassword({
    urlOrHostname: 'https://app.example.com/feed',
    emailOrUser: 'alex.dev@domain.com',
    secret: 'Mnd',
    symbol: '!'
  }), 'MndAeav11!');

  // Apex domain (example.com)
  assert.strictEqual(generatePassword({
    urlOrHostname: 'https://example.com/',
    emailOrUser: 'alex.dev@domain.com',
    secret: 'Mnd',
    symbol: '!'
  }), 'MndEeav7!');

  // Two-part ccTLD (.com.bd)
  assert.strictEqual(generatePassword({
    urlOrHostname: 'https://cloudportal.com.bd',
    emailOrUser: 'alex.dev@domain.com',
    secret: 'Mnd',
    symbol: '!'
  }), 'MndClav11!');

  // Modern TLD (.design)
  assert.strictEqual(generatePassword({
    urlOrHostname: 'https://studio.design',
    emailOrUser: 'alex.dev@domain.com',
    secret: 'Mnd',
    symbol: '!'
  }), 'MndSoav6!');
});
