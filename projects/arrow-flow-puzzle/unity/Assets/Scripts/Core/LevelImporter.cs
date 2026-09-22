using UnityEngine;

namespace ArrowFlow.Core
{
    public static class LevelImporter
    {
        public static LevelData LoadLevelFromResources(int levelId)
        {
            TextAsset textAsset = Resources.Load<TextAsset>($"Levels/level_{levelId}");
            if (textAsset == null)
            {
                Debug.LogWarning($"[LevelImporter] Level {levelId} not found in Resources/Levels, falling back to default level.");
                textAsset = Resources.Load<TextAsset>("Levels/level_1");
            }

            if (textAsset != null)
            {
                return JsonUtility.FromJson<LevelData>(textAsset.text);
            }

            return null;
        }

        public static LevelData ParseFromJson(string jsonText)
        {
            try
            {
                return JsonUtility.FromJson<LevelData>(jsonText);
            }
            catch (System.Exception e)
            {
                Debug.LogError($"[LevelImporter] Failed to parse level JSON: {e.Message}");
                return null;
            }
        }
    }
}
