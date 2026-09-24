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

        public float CellSize => cellSize;
        public LevelData CurrentLevel => currentLevel;
        public IReadOnlyList<ArrowTile> ActiveArrows => activeArrows;

        private void Update()
        {
            HandleInput();
        }

        private void HandleInput()
        {
            if (Input.GetMouseButtonDown(0))
            {
                Camera cam = Camera.main;
                if (cam == null) return;

                Vector3 worldPoint = cam.ScreenToWorldPoint(Input.mousePosition);
                worldPoint.z = 0f;

                // 1. Raycast check against cell colliders (multi-cell hitboxes)
                RaycastHit2D hit = Physics2D.Raycast(new Vector2(worldPoint.x, worldPoint.y), Vector2.zero);
                if (hit.collider != null)
                {
                    ArrowTile tile = hit.collider.GetComponent<ArrowTile>() ?? hit.collider.GetComponentInParent<ArrowTile>();
                    if (tile != null)
                    {
                        HandleArrowTapped(tile);
                        return;
                    }
                }

                // 2. Spatial grid coordinate fallback for robust touch hit detection
                if (currentLevel != null)
                {
                    float offsetX = -(currentLevel.cols - 1) * cellSize * 0.5f;
                    float offsetY = -(currentLevel.rows - 1) * cellSize * 0.5f;

                    int col = Mathf.RoundToInt((worldPoint.x - offsetX) / cellSize);
                    int row = Mathf.RoundToInt((worldPoint.y - offsetY) / cellSize);

                    ArrowTile tile = GetArrowAtCell(row, col);
                    if (tile != null)
                    {
                        HandleArrowTapped(tile);
                    }
                }
            }
        }

        public void LoadLevel(LevelData level)
        {
            currentLevel = level;
            movesCount = 0;
            comboCount = 0;

            // Clear previous grid
            foreach (var arrow in activeArrows)
            {
                if (arrow != null)
                {
                    arrow.OnTapped -= HandleArrowTapped;
                    Destroy(arrow.gameObject);
                }
            }
            activeArrows.Clear();

            // Center grid offset
            float offsetX = -(level.cols - 1) * cellSize * 0.5f;
            float offsetY = -(level.rows - 1) * cellSize * 0.5f;

            // Spawn arrows without any square background frames or boxes
            foreach (var arrowData in level.arrows)
            {
                Vector3 headWorldPos = new Vector3(
                    offsetX + arrowData.col * cellSize,
                    offsetY + arrowData.row * cellSize,
                    0f
                );

                GameObject go;
                if (arrowPrefab != null)
                {
                    go = Instantiate(arrowPrefab, headWorldPos, Quaternion.identity, gridParent != null ? gridParent : transform);
                }
                else
                {
                    go = new GameObject($"Arrow_{arrowData.id}");
                    go.transform.SetParent(gridParent != null ? gridParent : transform, false);
                    go.transform.position = headWorldPos;
                }

                ArrowTile tile = go.GetComponent<ArrowTile>();
                if (tile == null)
                {
                    tile = go.AddComponent<ArrowTile>();
                }

                tile.Initialize(arrowData, cellSize);
                tile.OnTapped += HandleArrowTapped;
                activeArrows.Add(tile);
            }

            OnMovesChanged?.Invoke(movesCount);
            OnComboChanged?.Invoke(comboCount);
        }

        public void HandleArrowTapped(ArrowTile tapped)
        {
            if (tapped == null || tapped.IsRemoving) return;

            ClearHighlights();

            // Collision & escape verification
            if (CanArrowEscape(tapped, out ArrowTile blocker))
            {
                // Escape Success!
                comboCount++;
                movesCount++;
                OnComboChanged?.Invoke(comboCount);
                OnMovesChanged?.Invoke(movesCount);

                SoundManager.Instance?.PlayWhoosh(comboCount);

                List<Vector3> escapePath = CalculateEscapePath(tapped);
                tapped.LaunchEscapeWaypoints(escapePath, 0.38f, () =>
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

        public bool CanArrowEscape(ArrowTile arrow, out ArrowTile blocker)
        {
            blocker = null;
            if (arrow == null || currentLevel == null) return false;

            // Build multi-cell occupancy lookup map
            Dictionary<Vector2Int, ArrowTile> occupancy = new Dictionary<Vector2Int, ArrowTile>();
            foreach (var a in activeArrows)
            {
                if (a == null || a == arrow || a.IsRemoving) continue;
                if (a.OccupiedCells != null)
                {
                    foreach (var cell in a.OccupiedCells)
                    {
                        occupancy[new Vector2Int(cell.col, cell.row)] = a;
                    }
                }
                else
                {
                    occupancy[new Vector2Int(a.Col, a.Row)] = a;
                }
            }

            // Deflectors lookup
            Dictionary<Vector2Int, string> deflectors = new Dictionary<Vector2Int, string>();
            if (currentLevel.deflectors != null)
            {
                foreach (var d in currentLevel.deflectors)
                {
                    deflectors[new Vector2Int(d.col, d.row)] = d.redirectDirection;
                }
            }

            Vector2Int delta = arrow.Direction.GetGridDelta();
            int currCol = arrow.Col + delta.x;
            int currRow = arrow.Row + delta.y;
            HashSet<string> visited = new HashSet<string>();

            while (currCol >= 0 && currCol < currentLevel.cols && currRow >= 0 && currRow < currentLevel.rows)
            {
                Vector2Int key = new Vector2Int(currCol, currRow);
                string stateKey = $"{currCol},{currRow}:{delta}";
                if (visited.Contains(stateKey))
                {
                    // Deflector infinite loop cycle
                    return false;
                }
                visited.Add(stateKey);

                if (occupancy.TryGetValue(key, out ArrowTile foundBlocker))
                {
                    blocker = foundBlocker;
                    return false;
                }

                if (deflectors.TryGetValue(key, out string redirectDir))
                {
                    delta = ArrowDirectionExtensions.FromString(redirectDir).GetGridDelta();
                }

                currCol += delta.x;
                currRow += delta.y;
            }

            return true;
        }

        public List<Vector3> CalculateEscapePath(ArrowTile arrow, float escapeDistance = 10f)
        {
            List<Vector3> waypoints = new List<Vector3>();
            Vector3 headWorldPos = arrow.transform.position;
            waypoints.Add(headWorldPos);

            if (currentLevel == null)
            {
                Vector2Int d = arrow.Direction.GetGridDelta();
                waypoints.Add(headWorldPos + new Vector3(d.x, d.y, 0f).normalized * escapeDistance);
                return waypoints;
            }

            float offsetX = -(currentLevel.cols - 1) * cellSize * 0.5f;
            float offsetY = -(currentLevel.rows - 1) * cellSize * 0.5f;

            Dictionary<Vector2Int, string> deflectors = new Dictionary<Vector2Int, string>();
            if (currentLevel.deflectors != null)
            {
                foreach (var defl in currentLevel.deflectors)
                {
                    deflectors[new Vector2Int(defl.col, defl.row)] = defl.redirectDirection;
                }
            }

            Vector2Int delta = arrow.Direction.GetGridDelta();
            int currCol = arrow.Col + delta.x;
            int currRow = arrow.Row + delta.y;
            HashSet<string> visited = new HashSet<string>();

            while (currCol >= 0 && currCol < currentLevel.cols && currRow >= 0 && currRow < currentLevel.rows)
            {
                Vector2Int cellPos = new Vector2Int(currCol, currRow);
                string stateKey = $"{currCol},{currRow}:{delta}";
                if (visited.Contains(stateKey)) break;
                visited.Add(stateKey);

                if (deflectors.TryGetValue(cellPos, out string redirectDir))
                {
                    Vector3 deflWorldPos = new Vector3(offsetX + currCol * cellSize, offsetY + currRow * cellSize, 0f);
                    waypoints.Add(deflWorldPos);
                    delta = ArrowDirectionExtensions.FromString(redirectDir).GetGridDelta();
                }

                currCol += delta.x;
                currRow += delta.y;
            }

            Vector3 lastPoint = waypoints[waypoints.Count - 1];
            Vector3 finalDir = new Vector3(delta.x, delta.y, 0f).normalized;
            waypoints.Add(lastPoint + finalDir * escapeDistance);

            return waypoints;
        }

        public ArrowTile GetArrowAtCell(int row, int col)
        {
            foreach (var arrow in activeArrows)
            {
                if (arrow == null || arrow.IsRemoving) continue;
                if (arrow.OccupiesCell(row, col)) return arrow;
            }
            return null;
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
                List<Vector3> path = CalculateEscapePath(arrow);
                arrow.LaunchEscapeWaypoints(path, 0.38f, () =>
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

        public void HighlightHintArrow()
        {
            ClearHighlights();
            var unblocked = GetUnblockedArrows();
            if (unblocked.Count > 0)
            {
                unblocked[0].SetHighlighted(true);
            }
        }

        public void ClearHighlights()
        {
            foreach (var a in activeArrows)
            {
                if (a != null && a.IsHighlighted)
                {
                    a.SetHighlighted(false);
                }
            }
        }

        private void CheckVictoryCondition()
        {
            if (activeArrows.Count == 0)
            {
                SoundManager.Instance?.PlayVictory();
                OnLevelComplete?.Invoke(movesCount, currentLevel != null ? currentLevel.parMoves : 0);
            }
        }
    }
}
