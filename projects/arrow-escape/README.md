# Arrow Escape — Production Mobile Puzzle Game

> **Download Native Android APK:** [arrow-escape-debug.apk (v2.0.0)](https://github.com/samarthnimangre-dev/Personal-Workspace/releases/download/v2.0.0/arrow-escape-debug.apk)  
> **GitHub Release Page:** [Release v2.0.0](https://github.com/samarthnimangre-dev/Personal-Workspace/releases/tag/v2.0.0)

A production-quality, tactile mobile-first arrow escape puzzle game built with **React 19**, **TypeScript 6**, **Vite 8**, **Tailwind CSS v4**, and **Capacitor 8**.

---

## Direct APK Download & Sideloading

| Property | Details |
| :--- | :--- |
| **Download URL** | [arrow-escape-debug.apk (4.1 MB)](https://github.com/samarthnimangre-dev/Personal-Workspace/releases/download/v2.0.0/arrow-escape-debug.apk) |
| **Repository File** | [`projects/arrow-escape/arrow-escape-debug.apk`](./arrow-escape-debug.apk) |
| **Version** | `v2.0.0` (VersionCode: `1`) |
| **Target Platforms** | Android 7.0+ (API 24 to API 36) |
| **Package ID** | `com.samarthbuilds.arrowescape` |

### Sideloading via ADB
```bash
adb install -r arrow-escape-debug.apk
adb shell am start -n com.samarthbuilds.arrowescape/.MainActivity
```

---

## Key Features

1. **Resolution-Independent SVG Vector Rendering:** Crisp rendering at any device pixel ratio with 3D drop shadows and tactile pill tiles.
2. **Smooth 60fps Hardware-Accelerated Animations:** Trajectory-aligned escape flyouts and directional blocked recoil shakes.
3. **Procedural Web Audio Sound Synthesizer:** Zero external audio files (0 KB network footprint), responsive procedural sound effects with master mute control.
4. **W3C Touch Haptics:** Custom tactile vibration patterns for tap, escape, collision, life lost, and victory.
5. **Deterministic Procedural Level Generator:** Mulberry32 PRNG + reverse construction with 100% solver verification across all 50 campaign levels.
6. **Mobile Ergonomics:** Safe area insets (`env(safe-area-inset-top/bottom)`), 44×44px touch targets, and iOS Safari auto-zoom prevention.
7. **Offline-First Persistence:** Campaign progress and settings persisted via LocalStorage with in-memory fallback.

---

## Local Development & Testing

```bash
# Install dependencies
pnpm install

# Run unit tests (75 passing tests across 5 suites)
pnpm test

# Run code linter
pnpm run lint

# Build web assets
pnpm run build

# Sync and build native Android APK
npx cap sync android
cd android && ./gradlew assembleDebug
```

---

## Unity CLI & UnityHub Setup

The environment includes both the official **Unity CLI** and **Unity Hub (with headless support)**:

1. **Unity CLI (`unity`):**
   - Version: `1.0.0-beta.11`
   - Location: `/usr/local/bin/unity` (`~/.local/bin/unity`)
   - Non-interactive usage:
     ```bash
     unity --version
     unity editors list --non-interactive
     unity --help
     ```

2. **Unity Hub (`unityhub` & `unityhub-headless`):**
   - Installed via official Unity Debian APT repository (`https://hub.unity3d.com/linux/repos/deb`).
   - Binary: `/usr/bin/unityhub`
   - Headless runner (virtual framebuffer via Xvfb with filtered IPC logs): `/usr/local/bin/unityhub-headless`
   - Usage:
     ```bash
     unityhub-headless help
     unityhub-headless editors -i
     ```

