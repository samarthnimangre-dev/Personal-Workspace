# ArrowFlow — Unity 6 Cross-Platform Engine Integration Guide
## Bridging the Next.js ArrowFlow Web Engine with Unity 6 for iOS, Android & Steam

---

## 🎯 Architecture Overview

The **ArrowFlow Unity Bridge** bridges the core mathematical raycast logic, level definitions, and audio-monetization architecture into a native C# Unity 6 project.

```
┌───────────────────────────────────────┐
│     Next.js / TypeScript Core        │
│  - Handcrafted Campaign Levels 1–10   │
│  - Procedural Reverse-Solver Algorithm │
└──────────────────┬────────────────────┘
                   │ Exported as JSON via `export-levels-to-unity.ts`
                   ▼
┌───────────────────────────────────────┐
│          Unity 6 Project              │
│  - Assets/Resources/Levels/*.json     │
│  - ArrowGridManager.cs                │
│  - ArrowTile.cs                       │
│  - AdManager.cs (AppLovin MAX / AdMob)│
│  - IAPManager.cs (Unity In-App Purchase)│
└──────────────────┬────────────────────┘
                   │ Multi-Platform Build Pipeline
     ┌─────────────┼─────────────┬─────────────┐
     ▼             ▼             ▼             ▼
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│   iOS   │   │ Android │   │  Steam  │   │  WebGL  │
│App Store│   │GooglePlay│  │(PC/Mac) │   │ (Itch)  │
└─────────┘   └─────────┘   └─────────┘   └─────────┘
```

---

## 📁 Unity Asset Directory Structure

```
projects/arrow-flow-puzzle/unity/
└── Assets/
    ├── Resources/
    │   └── Levels/
    │       ├── level_1.json ... level_10.json
    ├── Scripts/
    │   ├── Core/
    │   │   ├── ArrowDirection.cs      (8-vector math & angle mapping)
    │   │   ├── ArrowTile.cs           (Tile GameObject with launch, shake, & particles)
    │   │   ├── ArrowGridManager.cs    (Spatial hash raycast solver & grid coordinator)
    │   │   ├── LevelData.cs           (Serializable JSON data models)
    │   │   └── LevelImporter.cs       (Dynamic runtime JSON level loader)
    │   ├── Monetization/
    │   │   ├── AdManager.cs           (AppLovin MAX / Unity Ads / AdMob mediation wrapper)
    │   │   └── IAPManager.cs          (Unity IAP integration for Starter Bag, Vault, VIP Pass)
    │   └── Audio/
    │       └── SoundManager.cs        (Combo streak pitch scaling & sfx triggers)
```

---

## 🚀 Setup Steps in Unity 6

### 1. Import Assets into Unity
1. Open **Unity Hub** and create or open a **2D (Universal Render Pipeline - URP)** project in **Unity 6**.
2. Drag and drop the `unity/Assets/` folder into your Unity Project window.

### 2. Scene Setup
1. **Camera:** Set Main Camera to **Orthographic** (`Size = 6`).
2. **Game Manager:**
   - Create an empty GameObject named `_GameManager`.
   - Attach `ArrowGridManager.cs`, `SoundManager.cs`, `AdManager.cs`, and `IAPManager.cs`.
3. **Arrow Prefab:**
   - Create a 2D Sprite GameObject named `ArrowPrefab`.
   - Attach `ArrowTile.cs` and a `BoxCollider2D` (or `CircleCollider2D`).
   - Add child objects for the Sprite Arrow icon and Trail Renderer.
   - Drag `ArrowPrefab` into `ArrowGridManager`'s **Arrow Prefab** slot in the Inspector.

### 3. Loading Levels
In any controller script or `Start()` method:
```csharp
LevelData level1 = LevelImporter.LoadLevelFromResources(1);
arrowGridManager.LoadLevel(level1);
```

---

## 💰 Monetization SDK Configuration

### 1. Mobile Ads (AppLovin MAX / Google AdMob)
- Open `AdManager.cs` and set your SDK Keys:
  - Rewarded Ad Unit ID for the **2X Double Coins** and **Free Hammer** reward callbacks.
  - Interstitial Ad Unit ID for level transitions.
- In Unity, install the **AppLovin MAX Unity Plugin** or **Google Mobile Ads Unity Plugin**.

### 2. In-App Purchases (Unity IAP)
- Enable **In-App Purchasing** in Unity Project Settings (`Services > In-App Purchasing`).
- The SKUs in `IAPManager.cs` map directly to our store:
  - `com.arrowflow.starter_bag`: **$0.99** (Consumable)
  - `com.arrowflow.master_vault`: **$2.99** (Consumable)
  - `com.arrowflow.vip_pass`: **$4.99** (Non-Consumable, removes ads and unlocks VIP theme)

---

## 📱 One-Click Platform Exports

| Platform | Target Setting | Key Requirements |
| :--- | :--- | :--- |
| **iOS (App Store)** | Switch to iOS platform | Xcode, Apple Developer Account ($99/yr), CocoaPods |
| **Android (Google Play)** | Switch to Android platform | Android SDK 34+, Keystore signing, AAB format |
| **WebGL (CrazyGames / Poki)** | Switch to WebGL | WebAssembly build, gzip compression, responsive canvas |
| **PC / Steam** | Switch to Standalone (Win/Mac) | Steamworks.NET SDK integration, 16:9 border letterboxing |
