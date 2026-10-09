const assert = require('node:assert');
const test = require('node:test');
const { parseDomain, parseEmailUser, generatePassword } = require('../shared/pattern-generator');

test('parseDomain extracts domain strings correctly across standard and modern TLDs', () => {
  // Standard TLDs
  assert.strictEqual(parseDomain('https://www.upwork.com/login').domainString, 'upwork');
  assert.strictEqual(parseDomain('https://example.com/').domainString, 'example');

  // Subdomains (isolated)
  assert.strictEqual(parseDomain('https://app.example.com/dashboard').domainString, 'app.example');
  assert.strictEqual(parseDomain('admin.portal.example.com').domainString, 'admin.portal.example');

  // Two-part ccTLDs (.co.uk, .com.bd, .gov.bd, etc.)
  assert.strictEqual(parseDomain('my-site.co.uk').domainString, 'my-site');
  assert.strictEqual(parseDomain('https://motobyk.com.bd').domainString, 'motobyk');
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
  assert.deepStrictEqual(parseEmailUser('nhsajolbd@gmail.com'), {
    username: 'nhsajolbd',
    firstChar: 'n',
    lastChar: 'd'
  });

  // Capitalized email (e.g. mobile auto-cap "Nhsajolbd@gmail.com")
  assert.deepStrictEqual(parseEmailUser('Nhsajolbd@gmail.com'), {
    username: 'nhsajolbd',
    firstChar: 'n',
    lastChar: 'd'
  });

  // 1-character username
  assert.deepStrictEqual(parseEmailUser('a@gmail.com'), {
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
    urlOrHostname: 'https://www.upwork.com/',
    emailOrUser: 'nhsajolbd@gmail.com',
    secret: 'Saj',
    symbol: '!'
  });

  const upper = generatePassword({
    urlOrHostname: 'https://www.upwork.com/',
    emailOrUser: 'Nhsajolbd@gmail.com',
    secret: 'Saj',
    symbol: '!'
  });

  // Both MUST be SajUknd6!
  assert.strictEqual(lower, 'SajUknd6!');
  assert.strictEqual(upper, 'SajUknd6!');
});

test('generatePassword handles subdomains and two-part ccTLDs deterministically', () => {
  // Upwork
  assert.strictEqual(generatePassword({
    urlOrHostname: 'https://www.upwork.com/',
    emailOrUser: 'nhsajolbd@gmail.com',
    secret: 'Saj',
    symbol: '!'
  }), 'SajUknd6!');

  // Subdomain (app.example.com)
  assert.strictEqual(generatePassword({
    urlOrHostname: 'https://app.example.com/feed',
    emailOrUser: 'nhsajolbd@gmail.com',
    secret: 'Saj',
    symbol: '!'
  }), 'SajAend11!');

  // Apex domain (example.com)
  assert.strictEqual(generatePassword({
    urlOrHostname: 'https://example.com/',
    emailOrUser: 'nhsajolbd@gmail.com',
    secret: 'Saj',
    symbol: '!'
  }), 'SajEend7!');

  // Bangladesh ccTLD (.com.bd)
  assert.strictEqual(generatePassword({
    urlOrHostname: 'https://motobyk.com.bd',
    emailOrUser: 'nhsajolbd@gmail.com',
    secret: 'Saj',
    symbol: '!'
  }), 'SajMknd7!');

  // Modern TLD (.design)
  assert.strictEqual(generatePassword({
    urlOrHostname: 'https://studio.design',
    emailOrUser: 'nhsajolbd@gmail.com',
    secret: 'Saj',
    symbol: '!'
  }), 'SajSond6!');
});
