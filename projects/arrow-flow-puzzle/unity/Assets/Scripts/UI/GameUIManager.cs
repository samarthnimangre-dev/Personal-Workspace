using System;
using UnityEngine;
using UnityEngine.UI;
using ArrowFlow.Core;
using ArrowFlow.Monetization;
using ArrowFlow.Audio;

namespace ArrowFlow.UI
{
    public class GameUIManager : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private ArrowGridManager gridManager;

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

        private PlayerSaveData saveData;
        private int currentLevelIndex = 1;
        private bool isHammerActive = false;

        private void Start()
        {
            saveData = SaveSystem.Load();
            UpdateWalletUI();

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
            currentLevelIndex = levelId;
            if (levelTitleText != null) levelTitleText.text = $"Level {levelId}";
            if (victoryPanel != null) victoryPanel.SetActive(false);

            LevelData level = LevelImporter.LoadLevelFromResources(levelId);
            if (level != null)
            {
                gridManager.LoadLevel(level);
            }
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
            int earnedCoins = 50 + currentLevelIndex * 15;
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
                    victoryStatsText.text = $"Solved in {moves} moves!\n+{earnedCoins} Coins | +{earnedGems} Gems";
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

            var unblocked = gridManager.GetUnblockedArrows();
            if (unblocked.Count > 0)
            {
                SoundManager.Instance?.PlayTap();
                unblocked[0].PlayBlockedShake(); // Highlights candidate
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
                // Double rewards callback
                int bonusCoins = 50 + currentLevelIndex * 15;
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
