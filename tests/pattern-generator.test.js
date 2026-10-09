const assert = require('node:assert');
const test = require('node:test');
const { parseDomain, parseEmailUser, generatePassword } = require('../shared/pattern-generator');

test('parseDomain extracts domain strings correctly', () => {
  assert.strictEqual(parseDomain('https://www.upwork.com/login').domainString, 'upwork');
  assert.strictEqual(parseDomain('https://app.example.com/dashboard').domainString, 'app.example');
  assert.strictEqual(parseDomain('https://example.com/').domainString, 'example');
  assert.strictEqual(parseDomain('my-site.co.uk').domainString, 'my-site');
  assert.strictEqual(parseDomain('localhost:3000').domainString, 'localhost');
});

test('parseEmailUser extracts username bookends correctly', () => {
  assert.deepStrictEqual(parseEmailUser('nhsajolbd@gmail.com'), {
    username: 'nhsajolbd',
    firstChar: 'n',
    lastChar: 'd'
  });
  assert.deepStrictEqual(parseEmailUser('john.doe@domain.com'), {
    username: 'john.doe',
    firstChar: 'j',
    lastChar: 'e'
  });
  assert.deepStrictEqual(parseEmailUser('admin'), {
    username: 'admin',
    firstChar: 'a',
    lastChar: 'n'
  });
});

test('generatePassword creates correct Pattern 2 output', () => {
  // Upwork example
  const upworkPass = generatePassword({
    urlOrHostname: 'https://www.upwork.com/',
    emailOrUser: 'nhsajolbd@gmail.com',
    secret: 'Saj',
    symbol: '!'
  });
  // Saj + U + k + n + d + 6 + ! = SajUknd6!
  assert.strictEqual(upworkPass, 'SajUknd6!');

  // Subdomain example (app.example.com)
  const appExamplePass = generatePassword({
    urlOrHostname: 'https://app.example.com/feed',
    emailOrUser: 'nhsajolbd@gmail.com',
    secret: 'Saj',
    symbol: '!'
  });
  // Saj + A + e + n + d + 11 + ! = SajAend11!
  assert.strictEqual(appExamplePass, 'SajAend11!');

  // Apex domain example (example.com)
  const examplePass = generatePassword({
    urlOrHostname: 'https://example.com/',
    emailOrUser: 'nhsajolbd@gmail.com',
    secret: 'Saj',
    symbol: '!'
  });
  // Saj + E + e + n + d + 7 + ! = SajEend7!
  assert.strictEqual(examplePass, 'SajEend7!');

  // Custom secret and symbol
  const customPass = generatePassword({
    urlOrHostname: 'github.com',
    emailOrUser: 'nhsajolbd@gmail.com',
    secret: 'Hell0',
    symbol: '#'
  });
  // Hell0 + G + b + n + d + 6 + # = Hell0Gbnd6#
  assert.strictEqual(customPass, 'Hell0Gbnd6#');
});
