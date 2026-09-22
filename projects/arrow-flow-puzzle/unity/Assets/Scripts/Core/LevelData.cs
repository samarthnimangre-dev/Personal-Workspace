using System;
using UnityEngine;

namespace ArrowFlow.Core
{
    [Serializable]
    public class ArrowData
    {
        public string id;
        public int row;
        public int col;
        public string direction;
        public string color;
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
    }

    [Serializable]
    public class LevelCollection
    {
        public LevelData[] levels;
    }
}
