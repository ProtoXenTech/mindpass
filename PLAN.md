# MindPass - Development Plan & Architecture

> **Quick Reference**: See `office/2026-10-09-plan-mindpass-extension.md` for the official office artifact.

## 1. Goal & Core Formula
Deterministic password generator and Chrome Extension (Manifest V3) based on **Pattern 2 ("The Bookend Sandwich")**:
```
[Secret] + [Domain First (UPPER)] + [Domain Last (lower)] + [Email First (lower)] + [Email Last (lower)] + [Domain Length] + [Symbol]
```
Example: `vaultflow.com` + `alex.dev@domain.com` with secret `Mnd` and symbol `!` ➡️ **`MndVwav9!`** (9 chars)

## 2. Key Architectural Guarantees
1. **Zero Password Storage**: No passwords saved on disk, database, or network.
2. **Subdomain Isolation**: `app.example.com` and `example.com` produce separate, unique passwords.
3. **Case Normalization**: Email first & last letters are strictly lowercased to prevent auto-capitalization bugs.
4. **Conflict-Free DOM Injection**:
   - Debounced `MutationObserver` (200ms) to prevent tab freeze on SPAs.
   - Password eye-icon collision offset (`right: 38px`).
   - Form-scoped input lookup to prevent grabbing the wrong email.
   - Multi-step login memory (`sessionStorage`).
5. **Master Secret Masking**: Show/Hide toggle in popup to prevent shoulder-surfing.

## 3. Implementation Checklist
- [x] Create project structure and Git repo under `ProtoXenTech/mindpass`.
- [x] Build core Pattern 2 algorithm with tests.
- [x] Fix Chrome `_office` reserved directory naming (renamed to `office/`).
- [x] Upgrade TLD engine & lowercase normalization in `shared/pattern-generator.js`.
- [x] Add comprehensive test coverage in `tests/pattern-generator.test.js`.
- [x] Harden `content.js` (debounced scanning, eye offset, form-scoped search, multi-step login).
- [x] Add Master Secret visibility toggle in `popup/`.
- [x] Modern brand identity and icon suite design.
- [x] Verify complete test suite.
