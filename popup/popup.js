/**
 * MindPass Popup Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Settings tab elements
  const secretInput = document.getElementById('secret-input');
  const toggleSecretBtn = document.getElementById('toggle-secret-btn');
  const symbolInput = document.getElementById('symbol-input');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const settingsSavedMsg = document.getElementById('settings-saved-msg');

  // Trainer tab elements
  const trainerUrl = document.getElementById('trainer-url');
  const trainerEmail = document.getElementById('trainer-email');
  const trainerGuess = document.getElementById('trainer-guess');
  const trainerCheckBtn = document.getElementById('trainer-check-btn');
  const trainerCopyBtn = document.getElementById('trainer-copy-btn');
  const trainerResultBox = document.getElementById('trainer-result-box');
  const trainerMatchBanner = document.getElementById('trainer-match-banner');

  const bkSecret = document.getElementById('bk-secret');
  const bkDf = document.getElementById('bk-df');
  const bkDl = document.getElementById('bk-dl');
  const bkEf = document.getElementById('bk-ef');
  const bkEl = document.getElementById('bk-el');
  const bkLen = document.getElementById('bk-len');
  const bkSym = document.getElementById('bk-sym');
  const bkFinalPass = document.getElementById('bk-final-pass');

  // Accounts tab elements
  const addDomainInput = document.getElementById('add-domain-input');
  const addEmailInput = document.getElementById('add-email-input');
  const addAccountBtn = document.getElementById('add-account-btn');
  const accountsListContainer = document.getElementById('accounts-list-container');

  // 1. Tab Switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetTab = document.getElementById(btn.dataset.tab);
      if (targetTab) targetTab.classList.add('active');

      if (btn.dataset.tab === 'accounts-tab') {
        renderAccountsList();
      }
    });
  });

  // 2. Load Settings
  const settings = await getSettings();
  secretInput.value = settings.secret || 'Mnd';
  symbolInput.value = settings.symbol || '!';

  // Toggle secret visibility
  toggleSecretBtn.addEventListener('click', () => {
    if (secretInput.type === 'password') {
      secretInput.type = 'text';
      toggleSecretBtn.innerText = '🙈';
    } else {
      secretInput.type = 'password';
      toggleSecretBtn.innerText = '👁️';
    }
  });

  saveSettingsBtn.addEventListener('click', async () => {
    const secret = secretInput.value.trim() || 'Mnd';
    const symbol = symbolInput.value.trim() || '!';

    await saveSettings({ secret, symbol });
    settingsSavedMsg.classList.remove('hidden');
    setTimeout(() => settingsSavedMsg.classList.add('hidden'), 2000);
  });

  // 3. Mental Trainer
  trainerCheckBtn.addEventListener('click', async () => {
    const currentSettings = await getSettings();
    const urlVal = trainerUrl.value.trim();
    const emailVal = trainerEmail.value.trim();
    const guessVal = trainerGuess.value.trim();

    const { domainString } = parseDomain(urlVal);
    const { firstChar: ef, lastChar: el } = parseEmailUser(emailVal);

    const df = domainString.charAt(0).toUpperCase();
    const dl = domainString.charAt(domainString.length - 1).toLowerCase();
    const dLen = domainString.length;
    const secret = currentSettings.secret || 'Mnd';
    const symbol = currentSettings.symbol || '!';

    const actualPass = generatePassword({
      urlOrHostname: urlVal,
      emailOrUser: emailVal,
      secret,
      symbol
    });

    bkSecret.innerText = secret;
    bkDf.innerText = df;
    bkDl.innerText = dl;
    bkEf.innerText = ef;
    bkEl.innerText = el;
    bkLen.innerText = dLen.toString();
    bkSym.innerText = symbol;
    bkFinalPass.innerText = actualPass;

    if (guessVal) {
      if (guessVal === actualPass) {
        trainerMatchBanner.className = 'match-banner correct';
        trainerMatchBanner.innerText = '🎯 Perfect Match! Your Mental Math is Spot On!';
      } else {
        trainerMatchBanner.className = 'match-banner incorrect';
        trainerMatchBanner.innerText = `❌ Mismatch. Yours: "${guessVal}" | Correct: "${actualPass}"`;
      }
    } else {
      trainerMatchBanner.className = 'match-banner correct';
      trainerMatchBanner.innerText = '💡 Mental Formula Breakdown Below:';
    }

    trainerResultBox.classList.remove('hidden');
  });

  trainerCopyBtn.addEventListener('click', async () => {
    const currentSettings = await getSettings();
    const actualPass = generatePassword({
      urlOrHostname: trainerUrl.value.trim(),
      emailOrUser: trainerEmail.value.trim(),
      secret: currentSettings.secret,
      symbol: currentSettings.symbol
    });

    navigator.clipboard.writeText(actualPass).then(() => {
      trainerCopyBtn.innerText = 'Copied!';
      setTimeout(() => trainerCopyBtn.innerText = 'Copy Password', 1500);
    });
  });

  // 4. Saved Accounts List
  async function renderAccountsList() {
    const allAccounts = await getAllDomainAccounts();
    accountsListContainer.innerHTML = '';

    const domainKeys = Object.keys(allAccounts);
    if (domainKeys.length === 0) {
      accountsListContainer.innerHTML = '<p class="subtitle">No domain accounts saved yet.</p>';
      return;
    }

    domainKeys.forEach(domain => {
      const emails = allAccounts[domain];
      emails.forEach(email => {
        const item = document.createElement('div');
        item.className = 'account-item';
        item.innerHTML = `
          <div class="account-info">
            <span class="account-domain">${domain}</span>
            <span class="account-email">${email}</span>
          </div>
          <button class="btn btn-danger delete-btn" data-domain="${domain}" data-email="${email}">Remove</button>
        `;
        accountsListContainer.appendChild(item);
      });
    });

    // Attach delete listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const domain = e.target.dataset.domain;
        const email = e.target.dataset.email;
        await removeAccountForDomain(domain, email);
        renderAccountsList();
      });
    });
  }

  addAccountBtn.addEventListener('click', async () => {
    const domain = addDomainInput.value.trim();
    const email = addEmailInput.value.trim();

    if (domain && email) {
      const { domainString } = parseDomain(domain);
      await addAccountForDomain(domainString, email);
      addDomainInput.value = '';
      addEmailInput.value = '';
      renderAccountsList();
    }
  });
});
