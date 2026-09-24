using System;
using System.Collections.Generic;
using UnityEngine;

namespace ArrowFlow.Core
{
    public static class LevelImporter
    {
        public const int TotalLevels = 40;

        public static LevelData LoadLevelFromResources(int levelId)
        {
            int clampedId = Mathf.Clamp(levelId, 1, TotalLevels);
            TextAsset textAsset = Resources.Load<TextAsset>($"Levels/level_{clampedId}");

            if (textAsset == null)
            {
                Debug.LogWarning($"[LevelImporter] Level {clampedId} not found in Resources/Levels, falling back to default level 1.");
                textAsset = Resources.Load<TextAsset>("Levels/level_1");
            }

            if (textAsset != null)
            {
                return ParseFromJson(textAsset.text);
            }

            Debug.LogError($"[LevelImporter] Could not load level {levelId} or fallback level 1.");
            return null;
        }

        public static LevelData[] LoadAllLevels()
        {
            List<LevelData> all = new List<LevelData>(TotalLevels);
            for (int i = 1; i <= TotalLevels; i++)
            {
                LevelData lvl = LoadLevelFromResources(i);
                if (lvl != null)
                {
                    all.Add(lvl);
                }
            }
            return all.ToArray();
        }

        public static int GetTotalLevelsCount()
        {
            return TotalLevels;
        }

        public static LevelData ParseFromJson(string jsonText)
        {
            try
            {
                return JsonUtility.FromJson<LevelData>(jsonText);
            }
            catch (Exception e)
            {
                Debug.LogError($"[LevelImporter] Failed to parse level JSON: {e.Message}");
                return null;
            }
        }
    }
}
