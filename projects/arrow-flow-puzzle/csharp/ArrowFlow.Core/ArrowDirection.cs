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

    public readonly struct GridDelta
    {
        public int DRow { get; }
        public int DCol { get; }

        public GridDelta(int dRow, int dCol)
        {
            DRow = dRow;
            DCol = dCol;
        }
    }

    public static class ArrowDirectionExtensions
    {
        public static GridDelta GetGridDelta(this ArrowDirection dir)
        {
            return dir switch
            {
                ArrowDirection.Up => new GridDelta(-1, 0),
                ArrowDirection.Down => new GridDelta(1, 0),
                ArrowDirection.Left => new GridDelta(0, -1),
                ArrowDirection.Right => new GridDelta(0, 1),
                ArrowDirection.UpLeft => new GridDelta(-1, -1),
                ArrowDirection.UpRight => new GridDelta(-1, 1),
                ArrowDirection.DownLeft => new GridDelta(1, -1),
                ArrowDirection.DownRight => new GridDelta(1, 1),
                _ => new GridDelta(0, 0)
            };
        }

        public static float GetAngle(this ArrowDirection dir)
        {
            return dir switch
            {
                ArrowDirection.Right => 0f,
                ArrowDirection.DownRight => 45f,
                ArrowDirection.Down => 90f,
                ArrowDirection.DownLeft => 135f,
                ArrowDirection.Left => 180f,
                ArrowDirection.UpLeft => 225f,
                ArrowDirection.Up => 270f,
                ArrowDirection.UpRight => 315f,
                _ => 0f
            };
        }
    }
}
