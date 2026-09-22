using System;
using System.Collections.Generic;
using UnityEngine;
using ArrowFlow.Audio;

namespace ArrowFlow.Core
{
    public class ArrowGridManager : MonoBehaviour
    {
        [Header("Configuration")]
        [SerializeField] private GameObject arrowPrefab;
        [SerializeField] private float cellSize = 1.2f;
        [SerializeField] private Transform gridParent;

        [Header("Runtime State")]
        private List<ArrowTile> activeArrows = new List<ArrowTile>();
        private LevelData currentLevel;
        private int movesCount;
        private int comboCount;

        public event Action<int, int> OnLevelComplete; // moves, parMoves
        public event Action<int> OnComboChanged;
        public event Action<int> OnMovesChanged;

        public void LoadLevel(LevelData level)
        {
            currentLevel = level;
            movesCount = 0;
            comboCount = 0;

            // Clear previous grid
            foreach (var arrow in activeArrows)
            {
                if (arrow != null) Destroy(arrow.gameObject);
            }
            activeArrows.Clear();

            // Center grid offset
            float offsetX = -(level.cols - 1) * cellSize * 0.5f;
            float offsetY = -(level.rows - 1) * cellSize * 0.5f;

            // Spawn arrows
            foreach (var arrowData in level.arrows)
            {
                Vector3 worldPos = new Vector3(
                    offsetX + arrowData.col * cellSize,
                    offsetY + arrowData.row * cellSize,
                    0f
                );

                GameObject go = Instantiate(arrowPrefab, worldPos, Quaternion.identity, gridParent != null ? gridParent : transform);
                ArrowTile tile = go.GetComponent<ArrowTile>();
                tile.Initialize(arrowData, cellSize);
                activeArrows.Add(tile);
            }

            OnMovesChanged?.Invoke(movesCount);
            OnComboChanged?.Invoke(comboCount);
        }

        public void HandleArrowTapped(ArrowTile tapped)
        {
            if (tapped == null || tapped.IsRemoving) return;

            // Raycast check
            if (CanArrowEscape(tapped, out ArrowTile blocker))
            {
                // Escape Success!
                comboCount++;
                movesCount++;
                OnComboChanged?.Invoke(comboCount);
                OnMovesChanged?.Invoke(movesCount);

                SoundManager.Instance?.PlayWhoosh(comboCount);

                tapped.LaunchEscape(8f, 0.35f, () =>
                {
                    activeArrows.Remove(tapped);
                    CheckVictoryCondition();
                });
            }
            else
            {
                // Collision Blocked
                comboCount = 0;
                OnComboChanged?.Invoke(comboCount);
                SoundManager.Instance?.PlayBlocked();

                tapped.PlayBlockedShake();
                if (blocker != null) blocker.PlayBlockedShake();
            }
        }

        private bool CanArrowEscape(ArrowTile arrow, out ArrowTile blocker)
        {
            blocker = null;
            Vector2Int delta = arrow.Direction.GetGridDelta();

            // Build coordinate lookup map
            Dictionary<Vector2Int, ArrowTile> map = new Dictionary<Vector2Int, ArrowTile>();
            foreach (var a in activeArrows)
            {
                if (a != arrow && !a.IsRemoving)
                {
                    map[new Vector2Int(a.Col, a.Row)] = a;
                }
            }

            int currCol = arrow.Col + delta.x;
            int currRow = arrow.Row + delta.y;

            while (currCol >= 0 && currCol < currentLevel.cols && currRow >= 0 && currRow < currentLevel.rows)
            {
                Vector2Int key = new Vector2Int(currCol, currRow);
                if (map.TryGetValue(key, out ArrowTile foundBlocker))
                {
                    blocker = foundBlocker;
                    return false;
                }
                currCol += delta.x;
                currRow += delta.y;
            }

            return true;
        }

        public void UseHammer(ArrowTile target)
        {
            if (target == null || target.IsRemoving) return;

            SoundManager.Instance?.PlayHammer();
            target.DisintegrateHammer(() =>
            {
                activeArrows.Remove(target);
                CheckVictoryCondition();
            });
        }

        public void UseSuperMagnet()
        {
            List<ArrowTile> unblocked = GetUnblockedArrows();
            if (unblocked.Count == 0)
            {
                SoundManager.Instance?.PlayBlocked();
                return;
            }

            SoundManager.Instance?.PlayMagnet();
            foreach (var arrow in unblocked)
            {
                arrow.LaunchEscape(8f, 0.35f, () =>
                {
                    activeArrows.Remove(arrow);
                    CheckVictoryCondition();
                });
            }
        }

        public List<ArrowTile> GetUnblockedArrows()
        {
            List<ArrowTile> list = new List<ArrowTile>();
            foreach (var a in activeArrows)
            {
                if (!a.IsRemoving && CanArrowEscape(a, out _))
                {
                    list.Add(a);
                }
            }
            return list;
        }

        private void CheckVictoryCondition()
        {
            if (activeArrows.Count == 0)
            {
                SoundManager.Instance?.PlayVictory();
                OnLevelComplete?.Invoke(movesCount, currentLevel.parMoves);
            }
        }
    }
}
