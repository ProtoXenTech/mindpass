/**
 * MindPass Background Service Worker
 */

importScripts('shared/pattern-generator.js', 'shared/storage.js');

chrome.runtime.onInstalled.addListener(() => {
  console.log('MindPass extension installed.');
});

// Handle keyboard shortcut (Ctrl+Shift+P / Cmd+Shift+P)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'autofill_password') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'TRIGGER_AUTOFILL' });
    }
  }
});

// Handle runtime messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GENERATE_PASSWORD') {
    getSettings().then(settings => {
      const password = generatePassword({
        urlOrHostname: request.urlOrHostname,
        emailOrUser: request.emailOrUser,
        secret: settings.secret,
        symbol: settings.symbol
      });
      sendResponse({ success: true, password });
    });
    return true; // Keep channel open for async response
  }

  if (request.action === 'SAVE_ACCOUNT') {
    const { domainString, email } = request;
    addAccountForDomain(domainString, email).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});
