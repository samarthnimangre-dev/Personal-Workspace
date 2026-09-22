using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ArrowFlow.Core
{
    public class ArrowData
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("row")]
        public int Row { get; set; }

        [JsonPropertyName("col")]
        public int Col { get; set; }

        [JsonPropertyName("direction")]
        public string Direction { get; set; } = "right";

        [JsonPropertyName("color")]
        public string? Color { get; set; }

        public ArrowDirection ParsedDirection => Direction.ToLowerInvariant() switch
        {
            "up" => ArrowDirection.Up,
            "down" => ArrowDirection.Down,
            "left" => ArrowDirection.Left,
            "right" => ArrowDirection.Right,
            "up-left" => ArrowDirection.UpLeft,
            "up-right" => ArrowDirection.UpRight,
            "down-left" => ArrowDirection.DownLeft,
            "down-right" => ArrowDirection.DownRight,
            _ => ArrowDirection.Right
        };
    }

    public class LevelData
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("subtitle")]
        public string? Subtitle { get; set; }

        [JsonPropertyName("difficulty")]
        public string Difficulty { get; set; } = "easy";

        [JsonPropertyName("rows")]
        public int Rows { get; set; }

        [JsonPropertyName("cols")]
        public int Cols { get; set; }

        [JsonPropertyName("parMoves")]
        public int ParMoves { get; set; }

        [JsonPropertyName("rewardCoins")]
        public int RewardCoins { get; set; }

        [JsonPropertyName("rewardGems")]
        public int RewardGems { get; set; }

        [JsonPropertyName("arrows")]
        public List<ArrowData> Arrows { get; set; } = new List<ArrowData>();
    }
}
