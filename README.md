# MindPass 🧠 key

**MindPass** is a Chrome Browser Extension (Manifest V3) that generates deterministic, reproducible passwords on-the-fly using a mental algorithm ("Pattern 2: The Bookend Sandwich"). 

It allows you to compute your passwords in your head in seconds without storing actual passwords in any database or cloud server!

---

## 🔑 Pattern 2 Formula ("The Bookend Sandwich")

```
[Secret] + [Domain First (UPPER)] + [Domain Last (lower)] + [Email First] + [Email Last-Before-@] + [Domain Length] + [Symbol]
```

### Examples
- **VaultFlow** (`vaultflow.com`) + `alex.dev@domain.com` (Secret: `Mnd`, Symbol: `!`):
  - Secret: `Mnd`
  - Domain Upper/Lower bookends: `V` + `w` (`vaultflow` = length 9)
  - Username bookends: `a` + `v` (`alex.dev`)
  - Domain Length: `9`
  - Symbol: `!`
  - ➡️ Password: **`MndVwav9!`** (9 characters)

- **Apex Domain vs Subdomain**:
  - `example.com` ➡️ **`MndEeav7!`**
  - `app.example.com` ➡️ **`MndAeav11!`** *(Separate, unique passwords!)*

---

## ✨ Features

1. **Zero Password Storage**:
   - Only your Master Secret and saved usernames are stored locally. Zero passwords touch disk or network.

2. **Inline Input Badge & Dropdown**:
   - Floating badge icon appears inside email & password fields on web pages.
   - Click badge on Email field to pick from saved accounts.
   - Click badge on Password field to generate & autofill password instantly.

3. **Subdomain Isolation**:
   - `app.example.com` and `example.com` generate distinct passwords and keep distinct account lists.

4. **Mental Trainer 🧠 (Practice Mode)**:
   - Interactive UI inside the extension popup to practice your mental math calculations and check step-by-step breakdowns.

5. **Keyboard Shortcut**:
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) anywhere on a webpage to trigger autofill.

---

## 🛠️ Installation Instructions

1. Clone or download this repository:
   ```bash
   git clone https://github.com/ProtoXenTech/mindpass.git
   ```
2. Open Chrome/Chromium and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the `mindpass` directory.
5. MindPass is ready to use!

---

## 🧪 Testing

Run unit tests using Node.js:
```bash
npm test
```

---

## 📜 License

MIT © [ProtoXen](https://github.com/ProtoXenTech)
