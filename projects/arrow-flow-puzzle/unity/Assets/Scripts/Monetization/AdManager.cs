using System;
using UnityEngine;

namespace ArrowFlow.Monetization
{
    public class AdManager : MonoBehaviour
    {
        public static AdManager Instance { get; private set; }

        [Header("Ad Network Config")]
        [SerializeField] private bool testMode = true;
        [SerializeField] private string maxSdkKey = "YOUR_APPLOVIN_MAX_KEY";
        [SerializeField] private string rewardedAdUnitId = "YOUR_REWARDED_AD_UNIT_ID";
        [SerializeField] private string interstitialAdUnitId = "YOUR_INTERSTITIAL_AD_UNIT_ID";

        private Action currentRewardCallback;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAds();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializeAds()
        {
            Debug.Log("[AdManager] Initializing Mobile Ad Mediation (AppLovin MAX / Unity Ads / AdMob)");
            // In live Unity project, call:
            // MaxSdk.SetSdkKey(maxSdkKey);
            // MaxSdk.InitializeSdk();
        }

        public void ShowRewardedAd(Action onRewardSuccess, string placement = "DoubleRewards")
        {
            currentRewardCallback = onRewardSuccess;

            if (testMode)
            {
                Debug.Log($"[AdManager] Simulated Rewarded Ad completed for placement: {placement}");
                currentRewardCallback?.Invoke();
                currentRewardCallback = null;
                return;
            }

            // In live build with AppLovin MAX SDK:
            // if (MaxSdk.IsRewardedAdReady(rewardedAdUnitId))
            // {
            //     MaxSdk.ShowRewardedAd(rewardedAdUnitId);
            // }
            // else
            // {
            //     Debug.LogWarning("[AdManager] Rewarded Ad not ready");
            // }
        }

        public void ShowInterstitial(string placement = "LevelTransition")
        {
            if (testMode)
            {
                Debug.Log($"[AdManager] Simulated Interstitial Ad shown for placement: {placement}");
                return;
            }

            // In live build:
            // if (MaxSdk.IsInterstitialReady(interstitialAdUnitId))
            // {
            //     MaxSdk.ShowInterstitial(interstitialAdUnitId);
            // }
        }
    }
}
