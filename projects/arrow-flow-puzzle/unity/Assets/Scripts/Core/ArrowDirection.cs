using UnityEngine;

namespace ArrowFlow.Core
{
    public enum ArrowDirection
    {
        Up,
        Down,
        Left,
        Right,
        UpLeft,
        UpRight,
        DownLeft,
        DownRight
    }

    public static class ArrowDirectionExtensions
    {
        public static Vector2Int GetGridDelta(this ArrowDirection dir)
        {
            switch (dir)
            {
                case ArrowDirection.Up: return new Vector2Int(0, 1);
                case ArrowDirection.Down: return new Vector2Int(0, -1);
                case ArrowDirection.Left: return new Vector2Int(-1, 0);
                case ArrowDirection.Right: return new Vector2Int(1, 0);
                case ArrowDirection.UpLeft: return new Vector2Int(-1, 1);
                case ArrowDirection.UpRight: return new Vector2Int(1, 1);
                case ArrowDirection.DownLeft: return new Vector2Int(-1, -1);
                case ArrowDirection.DownRight: return new Vector2Int(1, -1);
                default: return Vector2Int.zero;
            }
        }

        public static float GetAngle(this ArrowDirection dir)
        {
            switch (dir)
            {
                case ArrowDirection.Right: return 0f;
                case ArrowDirection.UpRight: return 45f;
                case ArrowDirection.Up: return 90f;
                case ArrowDirection.UpLeft: return 135f;
                case ArrowDirection.Left: return 180f;
                case ArrowDirection.DownLeft: return 225f;
                case ArrowDirection.Down: return 270f;
                case ArrowDirection.DownRight: return 315f;
                default: return 0f;
            }
        }

        public static ArrowDirection FromString(string str)
        {
            switch (str.ToLowerInvariant())
            {
                case "up": return ArrowDirection.Up;
                case "down": return ArrowDirection.Down;
                case "left": return ArrowDirection.Left;
                case "right": return ArrowDirection.Right;
                case "up-left": return ArrowDirection.UpLeft;
                case "up-right": return ArrowDirection.UpRight;
                case "down-left": return ArrowDirection.DownLeft;
                case "down-right": return ArrowDirection.DownRight;
                default: return ArrowDirection.Right;
            }
        }
    }
}
