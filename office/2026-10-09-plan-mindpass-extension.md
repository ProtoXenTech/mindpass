---
date: 2026-10-09
type: plan
status: active
title: MindPass Extension Architecture & Roadmap
---

# MindPass - Deterministic Password Generator & Manager (Chrome Extension)

## 1. Executive Summary & Philosophy
MindPass is a lightweight, zero-cloud Chrome Browser Extension (Manifest V3) that generates deterministic, reproducible passwords on-the-fly using a clean mental algorithm: **Pattern 2 ("The Bookend Sandwich")**.

### Core Value Proposition
- **Zero-Password Storage**: No actual passwords ever touch persistent storage, disk, or the network. Only non-sensitive user metadata (Master Secret prefix, default symbol, and saved username strings) are kept locally.
- **Mental Math Reproducibility**: Users can calculate any password in their mind in under 3 seconds without needing their phone, password manager app, or internet connection.
- **Frictionless UX**: In-page interactive badges auto-detect inputs, prevent collisions with native browser controls, and support 1-click autofill with keyboard shortcut support.

---

## 2. Deterministic Algorithm: Pattern 2 ("The Bookend Sandwich")

### Formula Specification
```
[Secret] + [Domain First (UPPER)] + [Domain Last (lower)] + [Email First (lower)] + [Email Last (lower)] + [Domain Length] + [Symbol]
```

### Component Normalization Rules (Preventing Calculation Mismatches)
| Component | Source | Normalization & Rule | Example (`vaultflow.com` + `Alex.Dev@domain.com`) |
| :--- | :--- | :--- | :--- |
| **`Secret`** | Extension Settings | Master prefix string (default: `Mnd`). Preserves set casing. | `Mnd` |
| **`Domain First`** | Parsed Domain String | 1st character converted to **UPPERCASE**. | `V` |
| **`Domain Last`** | Parsed Domain String | Last character converted to **lowercase**. | `w` |
| **`Email First`** | Username Part (before `@`) | 1st character converted to **lowercase** (prevents mobile/OS auto-cap bugs). | `a` |
| **`Email Last`** | Username Part (before `@`) | Last character converted to **lowercase** before `@`. | `v` |
| **`Domain Length`** | Length of clean domain string | String representation of domain string character count. | `9` (`vaultflow` has 9 chars) |
| **`Symbol`** | Extension Settings | Special character (default: `!`). | `!` |

**Final Generated Password:** `MndVwav9!` (9 characters)

### Subdomain Separation Matrix
MindPass deliberately treats subdomains as distinct domains so credentials remain partitioned across separate services:

| Full URL | Hostname | Clean Domain String | Calculation Elements | Generated Password |
| :--- | :--- | :--- | :--- | :--- |
| `https://vaultflow.com/login` | `vaultflow.com` | `vaultflow` | `Mnd` + `V` + `w` + `a` + `v` + `9` + `!` | **`MndVwav9!`** |
| `https://example.com/` | `example.com` | `example` | `Mnd` + `E` + `e` + `a` + `v` + `7` + `!` | **`MndEeav7!`** |
| `https://app.example.com/` | `app.example.com` | `app.example` | `Mnd` + `A` + `e` + `a` + `v` + `11` + `!` | **`MndAeav11!`** |
| `https://admin.portal.example.com/`| `admin.portal.example.com`| `admin.portal.example` | `Mnd` + `A` + `e` + `a` + `v` + `20` + `!` | **`MndAeav20!`** |
| `https://cloudportal.com.bd/` | `cloudportal.com.bd` | `cloudportal` | `Mnd` + `C` + `l` + `a` + `v` + `11` + `!` | **`MndClav11!`** |
| `https://studio.design/` | `studio.design` | `studio` | `Mnd` + `S` + `o` + `a` + `v` + `6` + `!` | **`MndSoav6!`** |

---

## 3. Domain & Username Parsing Engine

### Domain Stripping Pipeline
1. **Protocol & Port Removal**: Strip `http://`, `https://`, port numbers (`:3000`), credentials, paths (`/login`), query strings (`?ref=...`), and hash fragments.
2. **IP & Localhost Protection**: If host is `localhost` or an IPv4/IPv6 address, preserve verbatim.
3. **Leading `www.` Removal**: Always strip `www.`.
4. **Multi-Part & Modern TLD Stripping**:
   - First check against known two-part ccTLDs: `.co.uk`, `.com.bd`, `.org.bd`, `.gov.bd`, `.edu.bd`, `.com.au`, `.net.au`, `.co.jp`, `.co.nz`, `.co.za`, etc.
   - If not a two-part ccTLD, strip the last segment after the final dot (`.com`, `.net`, `.org`, `.io`, `.app`, `.dev`, `.ai`, `.design`, `.solutions`, etc.).
   - Remaining string is the `domainString`.

### Email / Username Pipeline
1. Trim whitespace.
2. Strip any subaddress tags if configured or extract username portion prior to `@`.
3. If username has length 1 (e.g. `a@gmail.com`), `firstChar` and `lastChar` are both `'a'`.
4. Enforce strict lowercase conversion on both bookend characters.

---

## 4. In-Page DOM Interaction & Conflict Prevention Strategy

### Critical Conflict Safeguards
1. **Flexbox & Grid Layout Protection**:
   - *Problem*: Inserting the badge button as a sibling inside a flexbox parent can push inputs, shrink buttons, or break CSS layouts.
   - *Fix*: Do not alter parent display or add intrusive flex items. Inject a lightweight absolute wrapper or attach the badge with `position: absolute; right: 8px; pointer-events: auto;` without shifting parent flex flow.
2. **Password Reveal (Eye Icon) Collision Avoidance**:
   - *Problem*: Native browser eye icons (Microsoft Edge / Chromium) or custom website toggle buttons sit at `right: 8px` inside password fields.
   - *Fix*: Detect if a password reveal button exists (or if input is in Edge/Chrome) and offset the MindPass badge to `right: 36px` on password fields, ensuring both icons are clickable with zero overlap.
3. **Form-Scoped Input Association**:
   - *Problem*: Pages with multiple forms (e.g. search bar + login modal) can cause document-wide `querySelector` to grab the wrong email.
   - *Fix*: Always search for the associated email field **within the closest `<form>` ancestor** first before falling back to document scope.
4. **Multi-Step Login State Continuity (Google / Upwork / Microsoft flow)**:
   - *Problem*: On 2-step login flows, Step 1 (email input) is unmounted before Step 2 (password input) appears.
   - *Fix*: MindPass caches the last entered email for the host in `sessionStorage` and sync storage. When the user reaches Step 2, MindPass auto-populates or offers the remembered email seamlessly.
5. **MutationObserver Throttling**:
   - *Problem*: Heavy Single-Page Applications (SPAs) fire dozens of DOM mutations per second. Unthrottled DOM scans cause UI lag.
   - *Fix*: Debounce all `scanAndAttach` calls with a 200ms timer and maintain a `WeakSet` of processed input elements.
6. **Reactive Framework Compatibility**:
   - *Problem*: Direct `input.value = ...` does not trigger state updates in React, Vue, Svelte, or Angular.
   - *Fix*: Use `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set` followed by synthetic `input` and `change` events.

---

## 5. Security & Privacy Architecture

1. **Zero-Password Storage**:
   - The extension stores only:
     - `masterSettings`: `{ secret: "Mnd", symbol: "!", maskSecret: true }`
     - `domainAccounts`: `{ "vaultflow": ["alex.dev@domain.com"] }`
   - No passwords, hashes, or encrypted password blobs are ever stored.
2. **Master Secret Masking**:
   - The popup includes an eye toggle (Show/Hide) for the Master Secret input to prevent shoulder-surfing and accidental screen-share leaks.
3. **Local/Sync Only**:
   - Uses `chrome.storage.sync` with automatic fallback to `chrome.storage.local`. No external APIs, telemetry, or remote servers.
4. **Manifest V3 Scoping**:
   - Minimal permissions: `storage`, `activeTab`, `scripting`. No broad network interception permissions.

---

## 6. Project Architecture & File Map

```
mindpass/
├── manifest.json            # Manifest V3 configuration & permissions
├── shared/
│   ├── pattern-generator.js # Core calculation logic, TLD engine & domain parser
│   └── storage.js           # Chrome sync storage helper
├── background.js           # Service worker (shortcuts, command dispatch)
├── content.js              # DOM scanner, badge injection, form association, autofill
├── content.css             # Floating badge, dropdown menu, and toast notifications
├── popup/
│   ├── popup.html          # Extension dashboard (Settings, Mental Trainer, Accounts)
│   ├── popup.js            # Controller (tabs, trainer breakdown, secret masking)
│   └── popup.css           # Modern dark-mode popup styles
├── icons/                  # High-res extension icons (16px, 48px, 128px)
├── tests/
│   └── pattern-generator.test.js # Node test runner unit tests (all edge cases)
├── office/
│   ├── INDEX.md            # Work artifacts index
│   └── 2026-10-09-plan-mindpass-extension.md # This architecture & roadmap
├── PLAN.md                 # Project root plan reference
├── README.md               # User guide, formula breakdown, install instructions
└── package.json            # Scripts & project metadata
```

---

## 7. Phased Implementation & Verification Checklist

- [x] **Phase 1: Foundation & Core Math Engine**
  - [x] Manifest V3 config with `storage`, `activeTab`, `scripting`.
  - [x] Pattern 2 implementation in `shared/pattern-generator.js`.
  - [x] Unit test suite via Node.js native test runner (`npm test`).
  - [x] Directory renaming compliance (`office/` instead of reserved `_office`).

- [ ] **Phase 2: Robust Edge-Case Hardening (Current Sprint)**
  - [ ] Enforce lowercase normalization in `parseEmailUser` (preventing casing mismatch).
  - [ ] Comprehensive multi-part TLD & modern generic TLD parser in `parseDomain`.
  - [ ] Add unit tests for 1-char emails, mixed-case emails, `.com.bd`, `.co.uk`, `.design`, and subdomains.

- [ ] **Phase 3: DOM Injection & Layout Conflict Defense**
  - [ ] Debounce `MutationObserver` scan in `content.js` (200ms).
  - [ ] Form-scoped email search for password inputs.
  - [ ] Eye-icon collision offset (`right: 36px` on password fields).
  - [ ] Multi-step login memory via `sessionStorage` fallback.

- [ ] **Phase 4: Popup Enhancements & Security Polish**
  - [ ] Add Show/Hide toggle for Master Secret in `popup.html`.
  - [ ] Live breakdown in Mental Trainer with instant feedback.
  - [ ] End-to-end verification and test suite run.
