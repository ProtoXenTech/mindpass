/**
 * MindPass Content Script (Hardened)
 * Detects email/password fields, injects interactive MindPass badges & dropdown menus.
 * Includes safeguards against flexbox layout distortion, eye-icon collisions, and SPA mutation lag.
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

  // SVG Icon for MindPass Badge (Neural Keymark)
  const MINDPASS_ICON_SVG = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4.5" stroke="#818CF8" stroke-width="2" fill="none"/>
      <circle cx="12" cy="8" r="1.5" fill="#38BDF8"/>
      <path d="M12 12.5V20" stroke="#818CF8" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 16H15.5" stroke="#818CF8" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 18.5H14.5" stroke="#818CF8" stroke-width="2" stroke-linecap="round"/>
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
        attachBadge(input, isPassword ? 'password' : 'email');
      }
    });
  }

  // Attach floating badge without disrupting parent flexbox/grid layout
  function attachBadge(input, fieldType) {
    input.setAttribute('data-mindpass-attached', 'true');

    if (fieldType === 'email') {
      activeEmailField = input;
      // Track entered email to session storage for multi-step logins
      input.addEventListener('input', () => {
        if (input.value.trim()) {
          sessionStorage.setItem(SESSION_KEY, input.value.trim());
        }
      });
      input.addEventListener('change', () => {
        if (input.value.trim()) {
          sessionStorage.setItem(SESSION_KEY, input.value.trim());
        }
      });
    }

    if (fieldType === 'password') {
      activePasswordField = input;
    }

    // Track last focused fields
    input.addEventListener('focus', () => {
      if (fieldType === 'email') activeEmailField = input;
      if (fieldType === 'password') activePasswordField = input;
    });

    const parent = input.parentNode;
    if (!parent) return;

    // Detect if parent or siblings contain password eye toggle
    const hasSiblingButton = !!parent.querySelector('button, [role="button"], .toggle-password, .eye');

    const badge = document.createElement('button');
    badge.type = 'button';
    badge.className = `mindpass-badge mindpass-badge-${fieldType} ${hasSiblingButton && fieldType === 'password' ? 'mindpass-offset-eye' : ''}`;
    badge.innerHTML = MINDPASS_ICON_SVG;
    badge.title = fieldType === 'password' 
      ? 'Click to Autofill MindPass Password (Ctrl+Shift+P)' 
      : 'Select Saved Username/Email';

    badge.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (fieldType === 'password') {
        handlePasswordAutofill(input);
      } else {
        handleEmailDropdown(input, badge);
      }
    });

    // Safeguard parent positioning for absolute child without breaking layout
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.position === 'static') {
      parent.style.position = 'relative';
    }

    parent.appendChild(badge);
  }

  // Find the most appropriate email for the password field
  async function resolveEmailForPassword(passwordInput) {
    // 1. Check active focused email field
    if (activeEmailField && activeEmailField.value.trim()) {
      return activeEmailField.value.trim();
    }

    // 2. Check within the SAME form ancestor first (prevents wrong-form capture)
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

    // 4. Check sessionStorage for multi-step login continuity (e.g. Google, Upwork, Microsoft)
    const sessionEmail = sessionStorage.getItem(SESSION_KEY);
    if (sessionEmail && sessionEmail.trim()) {
      return sessionEmail.trim();
    }

    // 5. Check saved domain accounts: if only 1 account exists, use it automatically!
    const savedAccounts = await getAccountsForDomain(currentDomain);
    if (savedAccounts.length === 1) {
      return savedAccounts[0];
    }

    // 6. Fallback prompt
    return prompt('Enter your Username or Email for MindPass generation:');
  }

  // Handle password generation and autofill
  async function handlePasswordAutofill(passwordInput) {
    const emailVal = await resolveEmailForPassword(passwordInput);
    if (!emailVal || !emailVal.trim()) return;

    const cleanEmail = emailVal.trim();
    sessionStorage.setItem(SESSION_KEY, cleanEmail);

    const settings = await getSettings();
    const generatedPass = generatePassword({
      urlOrHostname: window.location.href,
      emailOrUser: cleanEmail,
      secret: settings.secret,
      symbol: settings.symbol
    });

    // Set password field value & trigger reactive events
    setNativeInputValue(passwordInput, generatedPass);
    showToast(`MindPass autofilled! (${cleanEmail})`);

    // Save account for domain in sync storage
    await addAccountForDomain(currentDomain, cleanEmail);
  }

  // Handle email dropdown menu
  async function handleEmailDropdown(emailInput, badgeEl) {
    closeDropdown();

    const savedAccounts = await getAccountsForDomain(currentDomain);

    dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'mindpass-dropdown';

    const header = document.createElement('div');
    header.className = 'mindpass-dropdown-header';
    header.innerText = `MindPass Accounts (${currentDomain})`;
    dropdownMenu.appendChild(header);

    if (savedAccounts.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'mindpass-dropdown-item empty';
      emptyItem.innerText = 'No saved emails for this domain yet. Type one and autofill password!';
      dropdownMenu.appendChild(emptyItem);
    } else {
      savedAccounts.forEach(account => {
        const item = document.createElement('div');
        item.className = 'mindpass-dropdown-item';
        item.innerHTML = `<span class="mindpass-email-text">👤 ${account}</span>`;
        item.addEventListener('click', () => {
          setNativeInputValue(emailInput, account);
          sessionStorage.setItem(SESSION_KEY, account);
          closeDropdown();
          
          // Focus password field if available
          const pagePasswordInput = document.querySelector('input[type="password"]');
          if (pagePasswordInput) pagePasswordInput.focus();
        });
        dropdownMenu.appendChild(item);
      });
    }

    document.body.appendChild(dropdownMenu);

    // Position dropdown relative to badge
    const rect = badgeEl.getBoundingClientRect();
    dropdownMenu.style.top = `${window.scrollY + rect.bottom + 4}px`;
    dropdownMenu.style.left = `${Math.max(10, window.scrollX + rect.left - 180)}px`;

    setTimeout(() => {
      document.addEventListener('click', onOutsideClick);
    }, 50);
  }

  function closeDropdown() {
    if (dropdownMenu && dropdownMenu.parentNode) {
      dropdownMenu.parentNode.removeChild(dropdownMenu);
      dropdownMenu = null;
    }
    document.removeEventListener('click', onOutsideClick);
  }

  function onOutsideClick(e) {
    if (dropdownMenu && !dropdownMenu.contains(e.target)) {
      closeDropdown();
    }
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
    toast.innerText = `🧠 ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // Keyboard shortcut message handler (Ctrl+Shift+P / Cmd+Shift+P)
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'TRIGGER_AUTOFILL') {
      const activeEl = document.activeElement;
      if (activeEl && activeEl.tagName === 'INPUT' && activeEl.type === 'password') {
        handlePasswordAutofill(activeEl);
      } else {
        const passField = document.querySelector('input[type="password"]');
        if (passField) handlePasswordAutofill(passField);
      }
    }
  });

  // Initial scan & debounced MutationObserver
  requestScan();
  const observer = new MutationObserver(requestScan);
  observer.observe(document.body, { childList: true, subtree: true });
})();
