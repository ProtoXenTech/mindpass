/**
 * MindPass Content Script
 * Detects email/password fields, injects interactive MindPass badges & dropdown menus.
 */

(function () {
  if (window.__mindpassInjected) return;
  window.__mindpassInjected = true;

  let activeEmailField = null;
  let activePasswordField = null;
  let dropdownMenu = null;

  const currentDomain = parseDomain(window.location.href).domainString;

  // SVG Icon for MindPass Badge
  const MINDPASS_ICON_SVG = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2ZM9 21C9 21.55 9.45 22 10 22H14C14.55 22 15 21.55 15 21V20H9V21Z" fill="#6366F1"/>
      <path d="M12 6V11M10 8H14" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `;

  // Scan & observe input fields
  function scanAndAttach() {
    const inputs = document.querySelectorAll('input:not([data-mindpass-attached])');
    inputs.forEach(input => {
      const type = (input.getAttribute('type') || 'text').toLowerCase();
      const name = (input.getAttribute('name') || '').toLowerCase();
      const id = (input.getAttribute('id') || '').toLowerCase();
      const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();

      const isPassword = type === 'password';
      const isEmail = type === 'email' || name.includes('email') || name.includes('user') || id.includes('email') || id.includes('user') || placeholder.includes('email') || placeholder.includes('username');

      if (isPassword || isEmail) {
        attachBadge(input, isPassword ? 'password' : 'email');
      }
    });
  }

  // Attach floating badge inside field wrapper
  function attachBadge(input, fieldType) {
    input.setAttribute('data-mindpass-attached', 'true');

    if (fieldType === 'email') activeEmailField = input;
    if (fieldType === 'password') activePasswordField = input;

    // Track last focused fields
    input.addEventListener('focus', () => {
      if (fieldType === 'email') activeEmailField = input;
      if (fieldType === 'password') activePasswordField = input;
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'mindpass-badge-wrapper';
    
    // Position relative wrapper context
    const parent = input.parentNode;
    if (!parent) return;

    // Insert wrapper trigger
    const badge = document.createElement('button');
    badge.type = 'button';
    badge.className = `mindpass-badge mindpass-badge-${fieldType}`;
    badge.innerHTML = MINDPASS_ICON_SVG;
    badge.title = fieldType === 'password' ? 'Click to Autofill MindPass Password (Ctrl+Shift+P)' : 'Select Saved Username/Email';

    badge.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (fieldType === 'password') {
        handlePasswordAutofill(input);
      } else {
        handleEmailDropdown(input, badge);
      }
    });

    // Position badge over input
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    parent.appendChild(badge);
  }

  // Handle password generation and autofill
  async function handlePasswordAutofill(passwordInput) {
    // Determine email/username
    let emailVal = '';

    if (activeEmailField && activeEmailField.value.trim()) {
      emailVal = activeEmailField.value.trim();
    } else {
      // Find any email or text input on the page with a value
      const pageEmailInput = document.querySelector('input[type="email"], input[name*="user"], input[name*="email"]');
      if (pageEmailInput && pageEmailInput.value.trim()) {
        emailVal = pageEmailInput.value.trim();
      }
    }

    if (!emailVal) {
      emailVal = prompt('Enter your Username or Email for MindPass generation:');
      if (!emailVal) return;
    }

    const settings = await getSettings();
    const generatedPass = generatePassword({
      urlOrHostname: window.location.href,
      emailOrUser: emailVal,
      secret: settings.secret,
      symbol: settings.symbol
    });

    // Set password field value & trigger input events
    setNativeInputValue(passwordInput, generatedPass);
    showToast(`MindPass autofilled! (${emailVal})`);

    // Save account for domain
    await addAccountForDomain(currentDomain, emailVal);
  }

  // Handle email dropdown menu
  async function handleEmailDropdown(emailInput, badgeEl) {
    closeDropdown();

    const savedAccounts = await getAccountsForDomain(currentDomain);

    dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'mindpass-dropdown';

    const header = document.createElement('div');
    header.className = 'mindpass-dropdown-header';
    header.innerText = `MindPass Saved Accounts (${currentDomain})`;
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
    dropdownMenu.style.left = `${window.scrollX + rect.left - 180}px`;

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

  // Fire input/change events for modern frontend frameworks (React, Vue, Angular)
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

  // Keyboard shortcut message handler
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

  // Initial scan & MutationObserver for dynamic forms
  scanAndAttach();
  const observer = new MutationObserver(() => scanAndAttach());
  observer.observe(document.body, { childList: true, subtree: true });
})();
