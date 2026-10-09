---
date: 2026-10-09
type: plan
status: active
title: MindPass Extension Architecture & Roadmap
---

# MindPass - Deterministic Password Generator & Manager (Chrome Extension)

## Overview
MindPass is a Chrome Browser Extension (Manifest V3) that generates deterministic, reproducible passwords on-the-fly based on a simple mental algorithm ("Pattern 2: The Bookend Sandwich"). Users can instantly generate or calculate passwords in their head without storing actual passwords in any database or cloud service.

## Core Formula: Pattern 2 ("The Bookend Sandwich")
```
[Secret] + [Domain First (UPPER)] + [Domain Last (lower)] + [Email First] + [Email Last-Before-@] + [Domain Length] + [Symbol]
```

### Calculation Parameters
1. **Secret**: Personal master prefix (e.g., `Saj`, configurable)
2. **Domain String**: Target domain host without `www.` or TLD (e.g., `upwork` from `upwork.com`, `app.example` from `app.example.com`)
   - **Domain First Upper**: 1st character converted to UPPERCASE (e.g., `U`)
   - **Domain Last Lower**: Last character converted to lowercase (e.g., `k`)
   - **Domain Length**: Length of the domain string (e.g., `6` for `upwork`, `11` for `app.example`)
3. **Email / Username String**: User's email or account identifier (e.g., `nhsajolbd@gmail.com`)
   - **Email First**: 1st character of username part (e.g., `n`)
   - **Email Last**: Last character of username part before `@` (e.g., `d`)
4. **Symbol**: Configurable special character (e.g., `!`)

### Example Outputs
* `upwork.com` + `nhsajolbd@gmail.com` -> **`SajUknd6!`** (9 chars)
* `example.com` + `nhsajolbd@gmail.com` -> **`SajEend7!`** (9 chars)
* `app.example.com` + `nhsajolbd@gmail.com` -> **`SajAend11!`** (10 chars)

## Key Extension Features

1. **Inline Field Detection & Floating Badge**:
   - Detects email/username and password input fields on active webpages.
   - Displays a sleek floating MindPass badge inside input fields.
   - On Email fields: dropdown list of saved usernames for the active domain.
   - On Password fields: auto-detects typed email, generates Pattern 2 password, and autofills in 1-click.

2. **Subdomain Separation**:
   - `app.example.com` and `example.com` produce separate, distinct passwords and saved accounts.

3. **Zero-Password Storage**:
   - Stores only master settings (secret prefix, symbol) and saved username strings per domain. Zero passwords stored on disk.

4. **Mental Trainer (Practice Mode)**:
   - Interactive UI card inside popup to practice mental calculations. Type URL and username -> guess password -> reveal to verify mental math.

5. **Keyboard Shortcut**:
   - `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) triggers quick autofill on focused inputs.

## Technical Architecture
```
/home/sajol/Server/Tool/Extension/mindpass/
├── manifest.json            # Manifest V3 setup
├── shared/
│   ├── pattern-generator.js # Core calculation logic & domain parser
│   └── storage.js           # Chrome sync storage helper
├── background.js           # Extension service worker
├── content.js              # DOM listener, field detector, inline UI badge & dropdown
├── content.css             # Floating badge & dropdown menu styles
├── popup/
│   ├── popup.html          # Extension popup UI
│   ├── popup.js            # Popup controller (settings, account manager, mental trainer)
│   └── popup.css           # Popup modern styling
├── icons/                  # SVG/PNG app icons (16, 48, 128)
└── tests/
    └── pattern-generator.test.js # Node unit tests
```
