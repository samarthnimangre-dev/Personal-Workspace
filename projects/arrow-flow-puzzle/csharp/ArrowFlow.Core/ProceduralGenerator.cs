using System;
using System.Collections.Generic;

namespace ArrowFlow.Core
{
    public static class ProceduralGenerator
    {
        private static readonly string[] Directions = new[]
        {
            "up", "down", "left", "right", "up-left", "up-right", "down-left", "down-right"
        };

        private static readonly string[] NeonColors = new[]
        {
            "#06b6d4", "#3b82f6", "#10b981", "#ec4899", "#8b5cf6", "#f59e0b"
        };

        public static LevelData GenerateLevel(int levelId, int rows = 5, int cols = 5, int seed = 42)
        {
            var random = new Random(seed);
            int totalCells = rows * cols;
            int targetArrows = Math.Max(4, Math.Min(totalCells - 2, (int)(totalCells * 0.65f)));

            var allPositions = new List<(int r, int c)>(totalCells);
            for (int r = 0; r < rows; r++)
            {
                for (int c = 0; c < cols; c++)
                {
                    allPositions.Add((r, c));
                }
            }

            // Fisher-Yates shuffle
            for (int i = allPositions.Count - 1; i > 0; i--)
            {
                int j = random.Next(i + 1);
                var temp = allPositions[i];
                allPositions[i] = allPositions[j];
                allPositions[j] = temp;
            }

            var chosenPositions = allPositions.GetRange(0, targetArrows);
            var arrows = new List<ArrowData>(targetArrows);

            for (int i = 0; i < chosenPositions.Count; i++)
            {
                var (r, c) = chosenPositions[i];
                string chosenDir;

                // Edge positions bias towards escape
                if (r == 0 && random.NextDouble() > 0.3) chosenDir = "up";
                else if (r == rows - 1 && random.NextDouble() > 0.3) chosenDir = "down";
                else if (c == 0 && random.NextDouble() > 0.3) chosenDir = "left";
                else if (c == cols - 1 && random.NextDouble() > 0.3) chosenDir = "right";
                else chosenDir = Directions[random.Next(Directions.Length)];

                arrows.Add(new ArrowData
                {
                    Id = $"cs-gen-{levelId}-{i}",
                    Row = r,
                    Col = c,
                    Direction = chosenDir,
                    Color = NeonColors[i % NeonColors.Length]
                });
            }

            var level = new LevelData
            {
                Id = levelId,
                Title = $"Sector {levelId}",
                Subtitle = "C# Procedural Vector Sector",
                Difficulty = rows <= 4 ? "easy" : rows <= 5 ? "medium" : "hard",
                Rows = rows,
                Cols = cols,
                ParMoves = arrows.Count,
                RewardCoins = 50 + levelId * 10,
                RewardGems = 10 + levelId * 2,
                Arrows = arrows
            };

            return level;
        }
    }
}
