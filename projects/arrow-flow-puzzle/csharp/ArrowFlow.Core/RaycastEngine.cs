using System.Collections.Generic;

namespace ArrowFlow.Core
{
    public static class RaycastEngine
    {
        public static bool CanEscape(
            ArrowData arrow,
            IReadOnlyCollection<ArrowData> activeArrows,
            int rows,
            int cols,
            out ArrowData? blocker)
        {
            blocker = null;
            GridDelta delta = arrow.ParsedDirection.GetGridDelta();

            // Spatial hash table for O(1) lookup
            var grid = new Dictionary<(int row, int col), ArrowData>(activeArrows.Count);
            foreach (var a in activeArrows)
            {
                if (a.Id != arrow.Id)
                {
                    grid[(a.Row, a.Col)] = a;
                }
            }

            int currRow = arrow.Row + delta.DRow;
            int currCol = arrow.Col + delta.DCol;

            while (currRow >= 0 && currRow < rows && currCol >= 0 && currCol < cols)
            {
                if (grid.TryGetValue((currRow, currCol), out var foundBlocker))
                {
                    blocker = foundBlocker;
                    return false;
                }
                currRow += delta.DRow;
                currCol += delta.DCol;
            }

            // Exited grid boundary without collision
            return true;
        }

        public static List<ArrowData> FindUnblockedArrows(
            IReadOnlyCollection<ArrowData> activeArrows,
            int rows,
            int cols)
        {
            var unblocked = new List<ArrowData>();
            foreach (var arrow in activeArrows)
            {
                if (CanEscape(arrow, activeArrows, rows, cols, out _))
                {
                    unblocked.Add(arrow);
                }
            }
            return unblocked;
        }

        /// <summary>
        /// Solvability simulator: Solves the board iteratively to prove whether it can be completely cleared.
        /// </summary>
        public static bool IsSolvable(LevelData level)
        {
            var remaining = new List<ArrowData>(level.Arrows);

            while (remaining.Count > 0)
            {
                var freeMoves = FindUnblockedArrows(remaining, level.Rows, level.Cols);
                if (freeMoves.Count == 0)
                {
                    // Deadlocked: No arrows can escape
                    return false;
                }

                // Remove the first free arrow and continue
                remaining.Remove(freeMoves[0]);
            }

            return true;
        }
    }
}
