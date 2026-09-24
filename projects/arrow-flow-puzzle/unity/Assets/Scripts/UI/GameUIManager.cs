using System;
using UnityEngine;
using UnityEngine.UI;
using ArrowFlow.Core;
using ArrowFlow.Monetization;
using ArrowFlow.Audio;

namespace ArrowFlow.UI
{
    public enum GameTheme
    {
        CyberDark,
        MinimalWhite,
        EyeComfort
    }

    public class GameUIManager : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private ArrowGridManager gridManager;
        [SerializeField] private Camera gameCamera;

        [Header("HUD Text Elements")]
        [SerializeField] private Text levelTitleText;
        [SerializeField] private Text movesText;
        [SerializeField] private Text comboText;
        [SerializeField] private Text coinsText;
        [SerializeField] private Text gemsText;

        [Header("Booster Badges")]
        [SerializeField] private Text hammerCountText;
        [SerializeField] private Text hintCountText;
        [SerializeField] private Text undoCountText;
        [SerializeField] private Text magnetCountText;

        [Header("Panels")]
        [SerializeField] private GameObject victoryPanel;
        [SerializeField] private GameObject shopPanel;
        [SerializeField] private Text victoryStatsText;
        [SerializeField] private Image uiBackgroundImage;
        [SerializeField] private Text themeToggleText;

        [Header("Appearance & Themes")]
        [SerializeField] private GameTheme currentTheme = GameTheme.CyberDark;

        private PlayerSaveData saveData;
        private int currentLevelIndex = 1;
        private bool isHammerActive = false;

        public GameTheme CurrentTheme => currentTheme;

        private void Start()
        {
            saveData = SaveSystem.Load();
            UpdateWalletUI();

            // Load and apply theme
            if (!string.IsNullOrEmpty(saveData.currentTheme) &&
                Enum.TryParse(saveData.currentTheme, out GameTheme savedTheme))
            {
                currentTheme = savedTheme;
            }
            ApplyTheme(currentTheme, false);

            if (gridManager != null)
            {
                gridManager.OnMovesChanged += HandleMovesChanged;
                gridManager.OnComboChanged += HandleComboChanged;
                gridManager.OnLevelComplete += HandleLevelComplete;
                LoadLevel(currentLevelIndex);
            }
        }

        private void OnDestroy()
        {
            if (gridManager != null)
            {
                gridManager.OnMovesChanged -= HandleMovesChanged;
                gridManager.OnComboChanged -= HandleComboChanged;
                gridManager.OnLevelComplete -= HandleLevelComplete;
            }
        }

        public void LoadLevel(int levelId)
        {
            if (levelId > LevelImporter.TotalLevels)
            {
                levelId = 1; // Campaign loop or completion
            }

            currentLevelIndex = levelId;
            if (victoryPanel != null) victoryPanel.SetActive(false);

            LevelData level = LevelImporter.LoadLevelFromResources(levelId);
            if (level != null)
            {
                if (levelTitleText != null)
                {
                    levelTitleText.text = $"Level {levelId}: {level.title}";
                }
                gridManager.LoadLevel(level);
            }
        }

        public void ApplyTheme(GameTheme theme, bool save = true)
        {
            currentTheme = theme;
            Camera cam = gameCamera != null ? gameCamera : Camera.main;

            Color bgColor;
            Color primaryTextColor;
            Color accentColor;
            Color panelColor;
            string themeLabel;

            switch (theme)
            {
                case GameTheme.MinimalWhite:
                    // Crisp pure canvas with obsidian typography
                    bgColor = Color.white;
                    primaryTextColor = new Color(0.059f, 0.090f, 0.165f, 1f); // #0f172a
                    accentColor = new Color(0.008f, 0.518f, 0.780f, 1f);      // #0284c7
                    panelColor = new Color(0.973f, 0.980f, 0.988f, 0.95f);
                    themeLabel = "⚪ Minimal White";
                    break;

                case GameTheme.EyeComfort:
                    // Warm soothing cream with espresso typography
                    bgColor = new Color(0.980f, 0.961f, 0.929f, 1f);          // #faf5ed
                    primaryTextColor = new Color(0.290f, 0.208f, 0.145f, 1f); // #4a3525
                    accentColor = new Color(0.851f, 0.467f, 0.024f, 1f);      // #d97706
                    panelColor = new Color(0.961f, 0.941f, 0.902f, 0.95f);
                    themeLabel = "🍵 Eye Comfort";
                    break;

                case GameTheme.CyberDark:
                default:
                    // Deep abyss dark canvas with neon laser typography
                    bgColor = new Color(0.035f, 0.051f, 0.086f, 1f);          // #090d16
                    primaryTextColor = new Color(0.973f, 0.980f, 0.988f, 1f); // #f8fafc
                    accentColor = new Color(0.024f, 0.714f, 0.831f, 1f);      // #06b6d4
                    panelColor = new Color(0.059f, 0.090f, 0.165f, 0.92f);
                    themeLabel = "🌌 Cyber Dark";
                    break;
            }

            if (cam != null)
            {
                cam.backgroundColor = bgColor;
            }

            if (uiBackgroundImage != null)
            {
                uiBackgroundImage.color = panelColor;
            }

            if (themeToggleText != null)
            {
                themeToggleText.text = themeLabel;
                themeToggleText.color = accentColor;
            }

            // Apply primary colors to HUD elements
            if (levelTitleText != null) levelTitleText.color = primaryTextColor;
            if (movesText != null) movesText.color = primaryTextColor;
            if (coinsText != null) coinsText.color = primaryTextColor;
            if (gemsText != null) gemsText.color = primaryTextColor;
            if (hammerCountText != null) hammerCountText.color = primaryTextColor;
            if (hintCountText != null) hintCountText.color = primaryTextColor;
            if (undoCountText != null) undoCountText.color = primaryTextColor;
            if (magnetCountText != null) magnetCountText.color = primaryTextColor;
            if (victoryStatsText != null) victoryStatsText.color = primaryTextColor;

            if (save)
            {
                saveData.currentTheme = theme.ToString();
                SaveSystem.Save(saveData);
            }
        }

        public void CycleTheme()
        {
            GameTheme next = currentTheme switch
            {
                GameTheme.CyberDark => GameTheme.MinimalWhite,
                GameTheme.MinimalWhite => GameTheme.EyeComfort,
                _ => GameTheme.CyberDark
            };
            ApplyTheme(next, true);
        }

        public void OnClickToggleTheme()
        {
            CycleTheme();
            SoundManager.Instance?.PlayTap();
        }

        private void HandleMovesChanged(int moves)
        {
            if (movesText != null) movesText.text = $"Moves: {moves}";
        }

        private void HandleComboChanged(int combo)
        {
            if (comboText != null)
            {
                comboText.gameObject.SetActive(combo > 1);
                comboText.text = $"🔥 {combo}x COMBO";
            }
        }

        private void HandleLevelComplete(int moves, int parMoves)
        {
            // Award Level Rewards
            int earnedCoins = 50 + currentLevelIndex * 25;
            int earnedGems = 10 + currentLevelIndex * 2;

            saveData.coins += earnedCoins;
            saveData.gems += earnedGems;
            saveData.highestCompletedLevel = Mathf.Max(saveData.highestCompletedLevel, currentLevelIndex + 1);
            SaveSystem.Save(saveData);

            UpdateWalletUI();

            if (victoryPanel != null)
            {
                victoryPanel.SetActive(true);
                if (victoryStatsText != null)
                {
                    victoryStatsText.text = $"Level {currentLevelIndex} Solved in {moves} moves!\n+{earnedCoins} Coins | +{earnedGems} Gems";
                }
            }
        }

        // Booster Actions
        public void OnClickHammerBooster()
        {
            if (saveData.hammers <= 0)
            {
                OpenShop();
                return;
            }

            isHammerActive = !isHammerActive;
            Debug.Log($"[GameUI] Hammer mode: {isHammerActive}");
        }

        public void OnClickHintBooster()
        {
            if (saveData.hints <= 0)
            {
                OpenShop();
                return;
            }

            saveData.hints--;
            SaveSystem.Save(saveData);
            UpdateWalletUI();

            if (gridManager != null)
            {
                SoundManager.Instance?.PlayTap();
                gridManager.HighlightHintArrow();
            }
        }

        public void OnClickMagnetBooster()
        {
            if (saveData.magnets <= 0)
            {
                OpenShop();
                return;
            }

            saveData.magnets--;
            SaveSystem.Save(saveData);
            UpdateWalletUI();

            gridManager.UseSuperMagnet();
        }

        // Monetization & Ads
        public void OnClickWatchAdDoubleCoins()
        {
            AdManager.Instance?.ShowRewardedAd(() =>
            {
                int bonusCoins = 50 + currentLevelIndex * 25;
                saveData.coins += bonusCoins;
                SaveSystem.Save(saveData);
                UpdateWalletUI();
                Debug.Log($"[GameUI] 2X Coins awarded: +{bonusCoins}");
                if (victoryPanel != null) victoryPanel.SetActive(false);
                LoadNextLevel();
            }, "VictoryDoubleCoins");
        }

        public void LoadNextLevel()
        {
            LoadLevel(currentLevelIndex + 1);
        }

        public void OpenShop()
        {
            if (shopPanel != null) shopPanel.SetActive(true);
        }

        public void CloseShop()
        {
            if (shopPanel != null) shopPanel.SetActive(false);
        }

        private void UpdateWalletUI()
        {
            if (coinsText != null) coinsText.text = saveData.coins.ToString();
            if (gemsText != null) gemsText.text = saveData.gems.ToString();
            if (hammerCountText != null) hammerCountText.text = saveData.hammers.ToString();
            if (hintCountText != null) hintCountText.text = saveData.hints.ToString();
            if (undoCountText != null) undoCountText.text = saveData.undos.ToString();
            if (magnetCountText != null) magnetCountText.text = saveData.magnets.ToString();
        }
    }
}
