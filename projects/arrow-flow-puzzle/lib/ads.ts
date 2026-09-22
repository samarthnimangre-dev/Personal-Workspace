// Unified Web Game Ad SDK Wrapper (CrazyGames + Poki + Fallback Simulator)

export type AdType = 'rewarded' | 'interstitial';

declare global {
  interface Window {
    CrazyGames?: {
      SDK: {
        ad: {
          requestAd: (type: 'rewarded' | 'midgame', callbacks: {
            adStarted?: () => void;
            adFinished?: () => void;
            adError?: (error: unknown) => void;
          }) => void;
        };
      };
    };
    PokiSDK?: {
      rewardedBreak: () => Promise<boolean>;
      commercialBreak: () => Promise<void>;
    };
  }
}

export class WebGameAdManager {
  private static instance: WebGameAdManager;

  public static getInstance(): WebGameAdManager {
    if (!WebGameAdManager.instance) {
      WebGameAdManager.instance = new WebGameAdManager();
    }
    return WebGameAdManager.instance;
  }

  // Check if third-party SDK is loaded
  public isThirdPartySdkAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.CrazyGames?.SDK || window.PokiSDK);
  }

  // Request Rewarded Video Ad
  public async requestRewardedAd(
    onRewardEarned: () => void,
    onFallbackSimulation: () => void
  ): Promise<void> {
    if (typeof window === 'undefined') {
      onFallbackSimulation();
      return;
    }

    // 1. Try CrazyGames SDK
    if (window.CrazyGames?.SDK) {
      try {
        window.CrazyGames.SDK.ad.requestAd('rewarded', {
          adFinished: () => onRewardEarned(),
          adError: () => onFallbackSimulation(),
        });
        return;
      } catch (err) {
        console.warn('CrazyGames ad error, falling back to simulator:', err);
      }
    }

    // 2. Try Poki SDK
    if (window.PokiSDK) {
      try {
        const success = await window.PokiSDK.rewardedBreak();
        if (success) {
          onRewardEarned();
          return;
        }
      } catch (err) {
        console.warn('Poki ad error, falling back to simulator:', err);
      }
    }

    // 3. Fallback to built-in rewarded ad simulator
    onFallbackSimulation();
  }

  // Request Interstitial Ad (Between levels)
  public async requestInterstitialAd(): Promise<void> {
    if (typeof window === 'undefined') return;

    if (window.CrazyGames?.SDK) {
      try {
        window.CrazyGames.SDK.ad.requestAd('midgame', {});
        return;
      } catch (err) {
        console.warn('CrazyGames interstitial error:', err);
      }
    }

    if (window.PokiSDK) {
      try {
        await window.PokiSDK.commercialBreak();
      } catch (err) {
        console.warn('Poki interstitial error:', err);
      }
    }
  }
}

export const adManager = WebGameAdManager.getInstance();
