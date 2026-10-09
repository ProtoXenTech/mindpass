/**
 * MindPass Chrome Storage Helper
 * Wraps chrome.storage.sync (with fallback to chrome.storage.local or memory)
 */

const DEFAULT_SETTINGS = {
  secret: 'Saj',
  symbol: '!',
  enableBadge: true,
  enableShortcut: true
};

function getStorageArea() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return chrome.storage.sync || chrome.storage.local;
  }
  // Mock storage for local test environment
  return {
    _data: {},
    get(keys, cb) {
      const res = {};
      const keyList = Array.isArray(keys) ? keys : [keys];
      keyList.forEach(k => { res[k] = this._data[k]; });
      if (cb) cb(res);
      return Promise.resolve(res);
    },
    set(obj, cb) {
      Object.assign(this._data, obj);
      if (cb) cb();
      return Promise.resolve();
    }
  };
}

/**
 * Gets master settings
 * @returns {Promise<{ secret: string, symbol: string, enableBadge: boolean, enableShortcut: boolean }>}
 */
async function getSettings() {
  const storage = getStorageArea();
  return new Promise((resolve) => {
    storage.get(['masterSettings'], (result) => {
      resolve({ ...DEFAULT_SETTINGS, ...(result.masterSettings || {}) });
    });
  });
}

/**
 * Saves master settings
 * @param {Object} settings 
 */
async function saveSettings(settings) {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  const storage = getStorageArea();
  return new Promise((resolve) => {
    storage.set({ masterSettings: updated }, resolve);
  });
}

/**
 * Retrieves saved email/username list for a given domain string
 * @param {string} domainString 
 * @returns {Promise<string[]>}
 */
async function getAccountsForDomain(domainString) {
  if (!domainString) return [];
  const storage = getStorageArea();
  return new Promise((resolve) => {
    storage.get(['domainAccounts'], (result) => {
      const allDomains = result.domainAccounts || {};
      resolve(allDomains[domainString] || []);
    });
  });
}

/**
 * Adds an email/username to a domain account list
 * @param {string} domainString 
 * @param {string} email 
 */
async function addAccountForDomain(domainString, email) {
  if (!domainString || !email || !email.trim()) return;
  const cleanEmail = email.trim();
  const storage = getStorageArea();

  return new Promise((resolve) => {
    storage.get(['domainAccounts'], async (result) => {
      const allDomains = result.domainAccounts || {};
      const currentList = allDomains[domainString] || [];

      if (!currentList.includes(cleanEmail)) {
        allDomains[domainString] = [...currentList, cleanEmail];
        await storage.set({ domainAccounts: allDomains });
      }
      resolve(allDomains[domainString]);
    });
  });
}

/**
 * Removes an email/username from a domain
 * @param {string} domainString 
 * @param {string} email 
 */
async function removeAccountForDomain(domainString, email) {
  if (!domainString || !email) return;
  const storage = getStorageArea();

  return new Promise((resolve) => {
    storage.get(['domainAccounts'], async (result) => {
      const allDomains = result.domainAccounts || {};
      if (allDomains[domainString]) {
        allDomains[domainString] = allDomains[domainString].filter(e => e !== email);
        if (allDomains[domainString].length === 0) {
          delete allDomains[domainString];
        }
        await storage.set({ domainAccounts: allDomains });
      }
      resolve(allDomains[domainString] || []);
    });
  });
}

/**
 * Gets all saved domain accounts
 * @returns {Promise<Record<string, string[]>>}
 */
async function getAllDomainAccounts() {
  const storage = getStorageArea();
  return new Promise((resolve) => {
    storage.get(['domainAccounts'], (result) => {
      resolve(result.domainAccounts || {});
    });
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_SETTINGS,
    getSettings,
    saveSettings,
    getAccountsForDomain,
    addAccountForDomain,
    removeAccountForDomain,
    getAllDomainAccounts
  };
}
