# ArrowFlow: Tangled Direction Puzzle & Monetization Stack 🏹⚡

> **Hyper-casual ASMR arrow puzzle game with procedural solvable labyrinths, Web Audio synthesis, Stripe in-app microtransactions, rewarded ad engine, and turnkey commercial licensing.**

---

## 🎯 Executive Overview

**ArrowFlow** is a complete, production-ready web and mobile puzzle game engineered to capture the viral hyper-casual arrow puzzle craze (e.g., *Arrow Out*, *Arrows Away*, *Tangled Path*). 

Built with modern 2026 web standards (**Next.js 16**, **React 19**, **Tailwind CSS v4**, and native **Web Audio API**), the app eliminates external asset dependencies while packing three distinct monetization channels:

1. **Web Game Ad Portals (CrazyGames / Poki / GameDistribution)**:
   - Built-in rewarded ad simulator and SDK hooks.
   - Earns **$2.50 to $5.50 CPM** when players watch 5-second ads to double coins or claim free hammers.
2. **Mobile App Store & Google Play (Capacitor Ready)**:
   - 100% responsive, touch-native interface with zero layout shift (CLS).
   - In-App Purchases for Coins, Gems, and the **$4.99 VIP Founder Pass** (Ad-free + infinite boosters).
3. **Turnkey White-Label Commercial Licensing**:
   - Sell the complete template to indie developers, agencies, and publishers on **CodeCanyon, Gumroad, and Itch.io** for **$49 – $149 / license**.

---

## 🕹️ Core Game Mechanics

- **Raycast Collision Engine**:
  - Each arrow points in 1 of 8 vectors (`up`, `down`, `left`, `right`, `up-left`, `up-right`, `down-left`, `down-right`).
  - Raycasting checks if another tile blocks its trajectory to the board edge.
  - If clear: supersonic whoosh launch animation + combo streak multiplier + ascending harmonic bell chime!
  - If blocked: tactile thud sound, red warning indicator on the blocker, and vibration shake.
- **30+ Hand-Crafted Campaign Levels**:
  - Escalating difficulty from beginner 3x3 intersections to 7x7 master labyrinths.
- **Infinite Procedural Solvable Generator**:
  - Algorithm uses reverse-construction logic starting from board perimeter inwards.
  - Every procedural puzzle is mathematically guaranteed solvable without guessing.
- **4 Interactive Power-Up Boosters**:
  - 🔨 **Hammer**: Disintegrates any single blocking arrow instantly with particle burst.
  - 💡 **Smart Hint**: Scans board state and illuminates a guaranteed escape route.
  - ⏪ **Undo**: Reverts miscalculated moves.
  - 🧲 **Super Magnet**: Pulls out all currently free arrows simultaneously in a cascade.
- **Procedural Web Audio Engine**:
  - 100% generated in real-time using the browser's native `AudioContext`.
  - Zero external `.mp3` or `.wav` files — loads in < 50ms, works completely offline.
  - Pentatonic scale pitch shifting as combo multipliers increase (`1x`, `2x`, `3x`...).

---

## 💎 Monetization & Economy System

### 1. In-Game Virtual Currency & Store
- **Coins & Gems**:
  - Earned via level completions and daily streaks.
  - Spendable on themes and booster refills (Hammers, Hints, Magnets).
- **Stripe Integration (`/api/checkout`)**:
  - **Starter Bag ($0.99)**: 500 Coins.
  - **Master Vault ($2.99)**: 2,500 Coins + 200 Gems + Boosters.
  - **VIP Founder Pass ($4.99)**: No ads forever + 10x all boosters + exclusive skins.
  - Includes instant sandbox demo simulation mode for testing without API keys.

### 2. Rewarded Video Ads
- Built-in 5-second countdown rewarded video simulator.
- Pre-wired hooks for CrazyGames SDK (`window.CrazyGames.SDK.ad.requestAd('rewarded')`).
- Automatically credits players with +100 Gems and +1 Free Hammer upon completion.

### 3. Visual Themes & Skin Wardrobe
- **Cyber Neon**: Electric cyan and magenta glow.
- **Zen Sakura**: Tranquil jade and cherry blossom pink.
- **Gold Obsidian**: High-roller molten gold on volcanic glass.
- **Sunset Synth**: 1984 retro synthwave horizon.
- **Matrix Cyber**: Green phosphor CRT terminal.

---

## 🚀 Quickstart & Development

### Prerequisites
- Node.js v20+ or v24+
- `pnpm` (recommended) or `npm`

### Installation & Launch
```bash
# Navigate to project folder
cd projects/arrow-flow-puzzle

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm run build

# Start production server
pnpm start
```
Open [http://localhost:3000](http://localhost:3000) to play and test the store.

---

## 📱 Publishing to Mobile (iOS & Android via Capacitor)

Transform this Next.js web game into native mobile apps for Apple App Store and Google Play:

```bash
# 1. Install Capacitor
pnpm add @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

# 2. Initialize Capacitor
npx cap init "ArrowFlow" "com.arrowflow.puzzle" --web-dir "out"

# 3. Build static export and sync
pnpm run build
npx cap add android
npx cap add ios
npx cap copy

# 4. Open in native IDEs
npx cap open android   # Launches Android Studio (ready to build APK / AAB)
npx cap open ios       # Launches Xcode (ready to archive for TestFlight)
```

---

## 🌐 Publishing to Web Game Portals (CrazyGames & Poki)

1. **CrazyGames**:
   - Register on [CrazyGames Developer Portal](https://developer.crazygames.com/).
   - Add the CrazyGames SDK script to [app/layout.tsx](file:///workspaces/Personal-Workspace/projects/arrow-flow-puzzle/app/layout.tsx).
   - Hook into `onWatchAdDouble` and `RewardedAdModal` to trigger `CrazyGames.SDK.ad.requestAd('rewarded')`.
2. **Poki**:
   - Submit game build to [Poki for Developers](https://developers.poki.com/).
   - Hook into Poki rewarded video callbacks.

---

## 📜 Commercial White-Label License

This project includes full commercial redistribution rights. You are authorized to:
- Re-skin, re-brand, and deploy on your own domain.
- Monetize via Stripe, AdMob, CrazyGames, Poki, or direct paywalls.
- Sell packaged source code licenses on marketplaces like Gumroad or CodeCanyon.
