using System;
using UnityEngine;

namespace ArrowFlow.Core
{
    [Serializable]
    public struct CellCoord
    {
        public int row;
        public int col;

        public CellCoord(int r, int c)
        {
            row = r;
            col = c;
        }

        public Vector2Int ToVector2Int() => new Vector2Int(col, row);
    }

    [Serializable]
    public class ArrowData
    {
        public string id;
        public int row;
        public int col;
        public string direction;
        public string color;
        public CellCoord[] occupiedCells;
        public bool isFrozen;
        public int frozenHits;
        public bool isPivot;
        public bool isBomb;

        public CellCoord[] GetOccupiedCells()
        {
            if (occupiedCells != null && occupiedCells.Length > 0)
                return occupiedCells;
            return new CellCoord[] { new CellCoord(row, col) };
        }
    }

    [Serializable]
    public class DeflectorData
    {
        public int row;
        public int col;
        public string redirectDirection;
    }

    [Serializable]
    public class LevelData
    {
        public int id;
        public string title;
        public string subtitle;
        public string difficulty;
        public int rows;
        public int cols;
        public int parMoves;
        public int rewardCoins;
        public int rewardGems;
        public ArrowData[] arrows;
        public DeflectorData[] deflectors;
    }

    [Serializable]
    public class LevelCollection
    {
        public LevelData[] levels;
    }
}
