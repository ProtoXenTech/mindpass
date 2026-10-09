---
date: 2026-10-09
type: design
status: active
title: MindPass Modern Brand Identity & Visual Design System
---

# MindPass - Brand Identity & Visual Design System

## 1. Brand Narrative & Positioning

### Essence
**"The password manager that lives entirely in your mind."**

### Core Philosophy
Traditional password managers store your life in an encrypted cloud vault or on your local disk. If the database leaks or the device is lost, access is compromised. 
**MindPass** introduces a zero-storage paradigm: the vault does not exist on any machine. By combining a personal mental anchor with site-specific deterministic transforms, MindPass transforms passwords into predictable mental math.

### Brand Voice
- **Intelligent & Sovereign**: Gives the user full mathematical sovereignty over their credentials.
- **Minimalist & Precise**: No bloated features, zero tracking, razor-sharp execution.
- **Cyber-Modern**: Futuristic dark glass aesthetic inspired by high-end developer tools.

---

## 2. Visual Identity & Color System

MindPass uses a **"Midnight Cyber & Neural Glow"** palette engineered for deep dark modes, crisp text contrast, and focused micro-interactions.

### Color Tokens

| Token Name | Hex Code | Role | Usage |
| :--- | :--- | :--- | :--- |
| **Midnight Void** | `#090D16` | Foundation Background | Global background, popup body, deep dark layers |
| **Onyx Slate** | `#131B2E` | Container Surface | Cards, modals, floating dropdown containers |
| **Slate Elevation** | `#1E293B` | Interactive Elements | Input fields, inactive tabs, subtle panels |
| **Cyber Indigo** | `#6366F1` | Primary Brand | Active badges, primary action buttons, key highlights |
| **Electric Violet** | `#8B5CF6` | Secondary Accent | Gradients, brand badge tags, hover transitions |
| **Neural Cyan** | `#38BDF8` | Informational Glow | Formula variables, code values, mental math breakdown |
| **Matrix Mint** | `#10B981` | Success / Match | Correct mental calculation banner, autofill toast |
| **Crimson Pulse** | `#EF4444` | Warning / Error | Calculation mismatch, remove action, invalid format |
| **Polar White** | `#F8FAFC` | Primary Typography | Headings, focused text, high-contrast labels |
| **Ghost Slate** | `#94A3B8` | Secondary Typography | Explanations, input labels, formulas, hints |

---

## 3. Logo & Icon Specification: "The Neural Keymark"

### Symbolism
The MindPass icon merges two timeless symbols:
1. **The Human Brain / Synaptic Node**: Symbolizes mental math, memory, and cognitive calculation.
2. **The Modern Vault Key**: Symbolizes cryptographic access, security, and authorization.

### Geometric Construction
```
        .-------------------.
       /    .-----------.    \
      /    /   ( O )     \    \   <-- Synaptic Ring (The Mind)
     |    |      |        |    |
     |    |   ===+===     |    |
      \    \     |       /    /   <-- Precision Key Shaft
       \    `----+------'    /
        `--------|----------'
                 |-- [bit]
```

- **Shape Geometry**: Continuous rounded squircle base (smooth 24% corner radius).
- **Primary Gradient**: Linear 135° diagonal from **Cyber Indigo (`#6366F1`)** to **Electric Violet (`#8B5CF6`)** with a subtle rim illumination (`#38BDF8`).
- **Foreground Glyphs**:
  - Upper node: Circular keyhead / cerebral loop.
  - Stem: Central precision shaft with dual security teeth angled at 45°.
- **Scale Optimizations**:
  - **128px (Store / High-DPI)**: Full squircle gradient backing, dual-tone key glyph, subtle inner rim shadow.
  - **48px (Extension Shelf)**: High-contrast glyph with enhanced stroke weight for crisp visibility on browser toolbars.
  - **16px (Favicon / Tab)**: Pure simplified key glyph with maximum contrast for instant legibility.

---

## 4. Typography & Layout Architecture

- **Primary Font Stack**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif`
- **Monospace Font Stack**: `ui-monospace, "SF Mono", "Cascadia Code", "Roboto Mono", Consolas, monospace`
- **Typographic Scale**:
  - `Header Title`: 18px / Semi-bold (700)
  - `Card Header`: 14px / Semi-bold (600)
  - `Body / Inputs`: 13px / Regular (400)
  - `Labels & Tags`: 11px / Medium (600) / Uppercase with 0.5px letter-spacing
  - `Formula Code`: 12px / Monospace (500)

---

## 5. In-Page Injected Component Specifications

### Floating Input Badge
- **Dimensions**: 28px × 28px square with 6px border radius.
- **Positioning**: Absolute right alignment inside input wrapper.
  - Standard fields: `right: 10px`
  - Password fields with native browser/site reveal toggles: `right: 38px` (avoids eye-icon overlap).
- **Resting State**: Translucent indigo background `rgba(99, 102, 241, 0.08)`, border `rgba(99, 102, 241, 0.2)`.
- **Hover State**: Elevates with `rgba(99, 102, 241, 0.25)` fill, vibrant `#6366F1` border, and subtle 1.08x scale transform.

### Dropdown Menu
- **Backdrop**: `#131B2E` with 1px border `#334155` and a multi-stage box shadow (`0 10px 25px -5px rgba(0,0,0,0.5)`).
- **Header**: `#090D16` with uppercase Ghost Slate typography.
- **Interactive Rows**: Smooth `#1E293B` hover highlight with Polar White text.

### Toast Notification
- **Appearance**: Fixed bottom-right pill notification (`#090D16` backdrop with `#6366F1` neon border).
- **Duration**: 2000ms display with smooth cubic-bezier exit fade.

---

## 6. Implementation & Asset Roadmap

1. **Brand Vector & PNG Icon Assets**: Generate high-precision icons (16px, 48px, 128px) with the neural keymark emblem and modern gradient squircle.
2. **Popup UI Refresh**: Align popup styling with Midnight Void, Onyx Slate, and Cyber Indigo tokens.
3. **In-Page Component Alignment**: Ensure inline badges and dropdown menus strictly conform to the color architecture.
