using System;
using System.IO;
using UnityEngine;

namespace ArrowFlow.Core
{
    [Serializable]
    public class PlayerSaveData
    {
        public int coins = 200;
        public int gems = 30;
        public int hammers = 3;
        public int hints = 5;
        public int undos = 5;
        public int magnets = 2;
        public bool vipUnlocked = false;
        public int highestCompletedLevel = 1;
        public bool soundEnabled = true;
        public string currentTheme = "CyberDark";
    }

    public static class SaveSystem
    {
        private static string SavePath => Path.Combine(Application.persistentDataPath, "arrowflow_player_save.json");

        public static PlayerSaveData Load()
        {
            try
            {
                if (File.Exists(SavePath))
                {
                    string json = File.ReadAllText(SavePath);
                    return JsonUtility.FromJson<PlayerSaveData>(json);
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveSystem] Failed to load save file: {e.Message}");
            }

            return new PlayerSaveData();
        }

        public static void Save(PlayerSaveData data)
        {
            try
            {
                string json = JsonUtility.ToJson(data, true);
                File.WriteAllText(SavePath, json);
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveSystem] Failed to write save file: {e.Message}");
            }
        }
    }
}
