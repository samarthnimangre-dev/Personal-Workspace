using System;
using UnityEngine;

namespace ArrowFlow.Monetization
{
    public class IAPManager : MonoBehaviour
    {
        public static IAPManager Instance { get; private set; }

        public const string SKU_STARTER_BAG = "com.arrowflow.starter_bag";   // $0.99
        public const string SKU_MASTER_VAULT = "com.arrowflow.master_vault"; // $2.99
        public const string SKU_VIP_PASS = "com.arrowflow.vip_pass";         // $4.99 Non-consumable

        public event Action<string> OnPurchaseSuccess;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeIAP();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializeIAP()
        {
            Debug.Log("[IAPManager] Initializing Unity In-App Purchasing");
            // Setup Unity IAP ConfigurationBuilder with standard catalog
        }

        public void BuyStarterBag()
        {
            ProcessPurchase(SKU_STARTER_BAG, "Starter Bag ($0.99)");
        }

        public void BuyMasterVault()
        {
            ProcessPurchase(SKU_MASTER_VAULT, "Master Vault ($2.99)");
        }

        public void BuyVIPPass()
        {
            ProcessPurchase(SKU_VIP_PASS, "VIP Founder Pass ($4.99)");
        }

        private void ProcessPurchase(string sku, string debugTitle)
        {
            Debug.Log($"[IAPManager] Processing Purchase: {debugTitle}");
            // In Unity test mode or live build:
            OnPurchaseSuccess?.Invoke(sku);
        }

        public void RestorePurchases()
        {
            Debug.Log("[IAPManager] Restoring iOS / Android Purchases...");
        }
    }
}
