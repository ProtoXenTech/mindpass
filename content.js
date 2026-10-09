/**
 * MindPass Content Script (Hardened with Password Reveal & Action Card)
 * Detects email/password fields, injects interactive MindPass badges & reveal toggle,
 * and manages non-dismissing in-page action menus.
 */

(function () {
  if (window.__mindpassInjected) return;
  window.__mindpassInjected = true;

  let activeEmailField = null;
  let activePasswordField = null;
  let dropdownMenu = null;
  let scanTimeout = null;

  const currentDomain = parseDomain(window.location.href).domainString;
  const SESSION_KEY = `mindpass_last_email_${currentDomain}`;

  // SVG Icon: MindPass Neural Keymark
  const MINDPASS_ICON_SVG = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4.5" stroke="#818CF8" stroke-width="2" fill="none"/>
      <circle cx="12" cy="8" r="1.5" fill="#38BDF8"/>
      <path d="M12 12.5V20" stroke="#818CF8" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 16H15.5" stroke="#818CF8" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 18.5H14.5" stroke="#818CF8" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;

  // SVG Icon: Eye Open (Show Password)
  const EYE_OPEN_SVG = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  `;

  // SVG Icon: Eye Closed (Hide Password)
  const EYE_CLOSED_SVG = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#818CF8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  `;

  // Debounced scan function to protect performance on dynamic SPAs
  function requestScan() {
    if (scanTimeout) clearTimeout(scanTimeout);
    scanTimeout = setTimeout(scanAndAttach, 200);
  }

  // Scan & observe input fields
  function scanAndAttach() {
    const inputs = document.querySelectorAll('input:not([data-mindpass-attached])');
    inputs.forEach(input => {
      // Ignore hidden or non-interactive fields
      if (input.type === 'hidden' || input.style.display === 'none' || input.disabled || input.readOnly) {
        return;
      }

      const type = (input.getAttribute('type') || 'text').toLowerCase();
      const name = (input.getAttribute('name') || '').toLowerCase();
      const id = (input.getAttribute('id') || '').toLowerCase();
      const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();
      const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase();

      const isPassword = type === 'password';
      const isEmail = type === 'email' || 
                      autocomplete.includes('username') || 
                      autocomplete.includes('email') || 
                      name.includes('email') || 
                      name.includes('user') || 
                      id.includes('email') || 
                      id.includes('user') || 
                      placeholder.includes('email') || 
                      placeholder.includes('username');

      if (isPassword || isEmail) {
        attachControls(input, isPassword ? 'password' : 'email');
      }
    });
  }

  // Attach floating controls (Badge and Reveal Eye)
  function attachControls(input, fieldType) {
    input.setAttribute('data-mindpass-attached', 'true');

    if (fieldType === 'email') {
      activeEmailField = input;
      const saveInputToSession = () => {
        if (input.value.trim()) {
          sessionStorage.setItem(SESSION_KEY, input.value.trim());
        }
      };
      input.addEventListener('input', saveInputToSession);
      input.addEventListener('change', saveInputToSession);
    }

    if (fieldType === 'password') {
      activePasswordField = input;
    }

    // Track active fields on focus
    input.addEventListener('focus', () => {
      if (fieldType === 'email') activeEmailField = input;
      if (fieldType === 'password') activePasswordField = input;
    });

    const parent = input.parentNode;
    if (!parent) return;

    // Safeguard parent positioning for absolute child
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.position === 'static') {
      parent.style.position = 'relative';
    }

    // 1. For Password fields: Attach dedicated Password Reveal Eye button
    if (fieldType === 'password') {
      const revealBtn = document.createElement('button');
      revealBtn.type = 'button';
      revealBtn.className = 'mindpass-reveal-btn';
      revealBtn.innerHTML = EYE_OPEN_SVG;
      revealBtn.title = 'Show / Hide Password';

      revealBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (input.type === 'password') {
          input.type = 'text';
          revealBtn.innerHTML = EYE_CLOSED_SVG;
          revealBtn.classList.add('revealed');
          revealBtn.title = 'Hide Password';
        } else {
          input.type = 'password';
          revealBtn.innerHTML = EYE_OPEN_SVG;
          revealBtn.classList.remove('revealed');
          revealBtn.title = 'Show Password';
        }
      });

      parent.appendChild(revealBtn);
    }

    // 2. Attach MindPass Badge
    const badge = document.createElement('button');
    badge.type = 'button';
    badge.className = `mindpass-badge mindpass-badge-${fieldType}`;
    badge.innerHTML = MINDPASS_ICON_SVG;
    badge.title = fieldType === 'password' 
      ? 'MindPass: Generate & Autofill Password' 
      : 'MindPass: Select Saved Account';

    badge.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (fieldType === 'password') {
        handlePasswordMenu(input, badge);
      } else {
        handleEmailDropdown(input, badge);
      }
    });

    parent.appendChild(badge);
  }

  // Find the most appropriate email for the password field
  async function resolveEmailForPassword(passwordInput) {
    // 1. Check active focused email field
    if (activeEmailField && activeEmailField.value.trim()) {
      return activeEmailField.value.trim();
    }

    // 2. Check within the SAME form ancestor first
    const form = passwordInput.closest('form');
    if (form) {
      const formEmailInput = form.querySelector('input[type="email"], input[autocomplete*="username"], input[name*="user"], input[name*="email"]');
      if (formEmailInput && formEmailInput.value.trim()) {
        return formEmailInput.value.trim();
      }
    }

    // 3. Check document-wide email inputs
    const pageEmailInput = document.querySelector('input[type="email"], input[name*="user"], input[name*="email"]');
    if (pageEmailInput && pageEmailInput.value.trim()) {
      return pageEmailInput.value.trim();
    }

    // 4. Check sessionStorage for multi-step login continuity
    const sessionEmail = sessionStorage.getItem(SESSION_KEY);
    if (sessionEmail && sessionEmail.trim()) {
      return sessionEmail.trim();
    }

    // 5. Check saved domain accounts: if only 1 account exists, use it automatically!
    const savedAccounts = await getAccountsForDomain(currentDomain);
    if (savedAccounts.length > 0) {
      return savedAccounts[0];
    }

    // 6. Default fallback placeholder
    return 'user@' + currentDomain + '.com';
  }

  // Handle password menu on password fields (stays open until user interacts)
  async function handlePasswordMenu(passwordInput, badgeEl) {
    // Toggle: if menu is already open, close it
    if (dropdownMenu) {
      closeDropdown();
      return;
    }

    let emailVal = await resolveEmailForPassword(passwordInput);
    const settings = await getSettings();

    const generateCurrent = (user) => {
      return generatePassword({
        urlOrHostname: window.location.href,
        emailOrUser: user,
        secret: settings.secret,
        symbol: settings.symbol
      });
    };

    let generatedPass = generateCurrent(emailVal);
    let isMasked = true;

    dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'mindpass-dropdown';

    // Prevent any clicks inside the menu from closing it
    dropdownMenu.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // 1. Header
    const header = document.createElement('div');
    header.className = 'mindpass-dropdown-header';
    header.innerHTML = `
      <span>MindPass · ${currentDomain}</span>
      <button type="button" class="mindpass-dropdown-close" title="Close">✕</button>
    `;
    header.querySelector('.mindpass-dropdown-close').addEventListener('click', (e) => {
      e.stopPropagation();
      closeDropdown();
    });
    dropdownMenu.appendChild(header);

    // 2. Card Body
    const body = document.createElement('div');
    body.className = 'mindpass-card-body';

    // Account row
    const accountRow = document.createElement('div');
    accountRow.className = 'mindpass-account-row';
    accountRow.innerHTML = `
      <span class="mindpass-label">Target Account</span>
      <div class="mindpass-account-display">👤 ${emailVal}</div>
    `;
    body.appendChild(accountRow);

    // Password Preview row
    const previewBox = document.createElement('div');
    previewBox.className = 'mindpass-preview-box';
    previewBox.innerHTML = `
      <span class="mindpass-preview-text masked">•••••••••</span>
      <div class="mindpass-btn-group">
        <button type="button" class="mindpass-icon-btn preview-toggle-btn" title="Reveal Password">👁️</button>
        <button type="button" class="mindpass-icon-btn copy-pass-btn" title="Copy to Clipboard">📋</button>
      </div>
    `;

    const previewText = previewBox.querySelector('.mindpass-preview-text');
    const previewToggleBtn = previewBox.querySelector('.preview-toggle-btn');
    const copyPassBtn = previewBox.querySelector('.copy-pass-btn');

    previewToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isMasked = !isMasked;
      if (isMasked) {
        previewText.innerText = '•••••••••';
        previewText.classList.add('masked');
        previewToggleBtn.innerText = '👁️';
        previewToggleBtn.title = 'Reveal Password';
      } else {
        previewText.innerText = generatedPass;
        previewText.classList.remove('masked');
        previewToggleBtn.innerText = '🙈';
        previewToggleBtn.title = 'Hide Password';
      }
    });

    copyPassBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(generatedPass).then(() => {
        copyPassBtn.innerText = '✓';
        setTimeout(() => copyPassBtn.innerText = '📋', 1200);
        showToast('Password copied to clipboard!');
      });
    });

    body.appendChild(previewBox);

    // Autofill Action Button
    const autofillBtn = document.createElement('button');
    autofillBtn.type = 'button';
    autofillBtn.className = 'mindpass-action-btn primary';
    autofillBtn.innerHTML = `⚡ Autofill Password`;
    autofillBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      setNativeInputValue(passwordInput, generatedPass);
      sessionStorage.setItem(SESSION_KEY, emailVal);
      await addAccountForDomain(currentDomain, emailVal);
      showToast(`Autofilled for ${emailVal}!`);
      closeDropdown();
    });
    body.appendChild(autofillBtn);

    // Save Account Button
    const saveAccountBtn = document.createElement('button');
    saveAccountBtn.type = 'button';
    saveAccountBtn.className = 'mindpass-action-btn secondary';
    saveAccountBtn.innerHTML = `💾 Save Account for ${currentDomain}`;
    saveAccountBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await addAccountForDomain(currentDomain, emailVal);
      saveAccountBtn.innerText = '✓ Account Saved';
      setTimeout(() => closeDropdown(), 800);
    });
    body.appendChild(saveAccountBtn);

    dropdownMenu.appendChild(body);
    document.body.appendChild(dropdownMenu);

    // Position menu relative to badge
    positionMenu(dropdownMenu, badgeEl);

    // Safe outside click listener attached after opening tick
    setTimeout(() => {
      document.addEventListener('click', onOutsideClick);
    }, 100);
  }

  // Handle email dropdown menu
  async function handleEmailDropdown(emailInput, badgeEl) {
    if (dropdownMenu) {
      closeDropdown();
      return;
    }

    const savedAccounts = await getAccountsForDomain(currentDomain);

    dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'mindpass-dropdown';

    dropdownMenu.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    const header = document.createElement('div');
    header.className = 'mindpass-dropdown-header';
    header.innerHTML = `
      <span>Saved Accounts (${currentDomain})</span>
      <button type="button" class="mindpass-dropdown-close" title="Close">✕</button>
    `;
    header.querySelector('.mindpass-dropdown-close').addEventListener('click', (e) => {
      e.stopPropagation();
      closeDropdown();
    });
    dropdownMenu.appendChild(header);

    if (savedAccounts.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'mindpass-dropdown-item empty';
      emptyItem.innerText = 'No saved accounts yet. Type email and autofill password to save it automatically!';
      dropdownMenu.appendChild(emptyItem);
    } else {
      savedAccounts.forEach(account => {
        const item = document.createElement('div');
        item.className = 'mindpass-dropdown-item';
        item.innerHTML = `<span class="mindpass-email-text">👤 ${account}</span>`;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          setNativeInputValue(emailInput, account);
          sessionStorage.setItem(SESSION_KEY, account);
          closeDropdown();
          
          // Focus password field if present
          const pagePasswordInput = document.querySelector('input[type="password"]');
          if (pagePasswordInput) pagePasswordInput.focus();
        });
        dropdownMenu.appendChild(item);
      });
    }

    document.body.appendChild(dropdownMenu);

    // Position menu relative to badge
    positionMenu(dropdownMenu, badgeEl);

    setTimeout(() => {
      document.addEventListener('click', onOutsideClick);
    }, 100);
  }

  // Position dropdown menu cleanly within viewport
  function positionMenu(menu, anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const top = window.scrollY + rect.bottom + 6;
    const left = Math.max(12, Math.min(window.scrollX + rect.right - 280, window.innerWidth - 300));
    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
  }

  // Close dropdown and remove outside click listener
  function closeDropdown() {
    if (dropdownMenu && dropdownMenu.parentNode) {
      dropdownMenu.parentNode.removeChild(dropdownMenu);
    }
    dropdownMenu = null;
    document.removeEventListener('click', onOutsideClick);
  }

  // Safe outside click handler
  function onOutsideClick(e) {
    if (!dropdownMenu) return;
    if (dropdownMenu.contains(e.target)) return;
    if (e.target.closest && (e.target.closest('.mindpass-badge') || e.target.closest('.mindpass-reveal-btn'))) {
      return;
    }
    closeDropdown();
  }

  // Fire input/change events for modern reactive frontend frameworks (React, Vue, Angular, Svelte)
  function setNativeInputValue(element, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value);
    } else if (valueSetter) {
      valueSetter.call(element, value);
    } else {
      element.value = value;
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Toast notification
  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'mindpass-toast';
    toast.innerHTML = `<span>🧠</span> <span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // Keyboard shortcut message handler (Ctrl+Shift+P / Cmd+Shift+P)
  chrome.runtime.onMessage.addListener(async (request) => {
    if (request.action === 'TRIGGER_AUTOFILL') {
      const activeEl = document.activeElement;
      let targetPassField = (activeEl && activeEl.tagName === 'INPUT' && activeEl.type === 'password')
        ? activeEl
        : document.querySelector('input[type="password"]');

      if (targetPassField) {
        const email = await resolveEmailForPassword(targetPassField);
        const settings = await getSettings();
        const pass = generatePassword({
          urlOrHostname: window.location.href,
          emailOrUser: email,
          secret: settings.secret,
          symbol: settings.symbol
        });
        setNativeInputValue(targetPassField, pass);
        await addAccountForDomain(currentDomain, email);
        showToast(`Autofilled password for ${email}!`);
      }
    }
  });

  // Initial scan & debounced MutationObserver
  requestScan();
  const observer = new MutationObserver(requestScan);
  observer.observe(document.body, { childList: true, subtree: true });
})();
