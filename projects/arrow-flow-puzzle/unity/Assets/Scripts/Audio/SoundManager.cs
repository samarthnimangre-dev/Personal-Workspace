using UnityEngine;

namespace ArrowFlow.Audio
{
    public class SoundManager : MonoBehaviour
    {
        public static SoundManager Instance { get; private set; }

        [Header("Audio Sources")]
        [SerializeField] private AudioSource sfxSource;
        [SerializeField] private AudioSource musicSource;

        [Header("Audio Clips")]
        [SerializeField] private AudioClip tapClip;
        [SerializeField] private AudioClip whooshClip;
        [SerializeField] private AudioClip blockedClip;
        [SerializeField] private AudioClip hammerClip;
        [SerializeField] private AudioClip magnetClip;
        [SerializeField] private AudioClip victoryClip;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                if (sfxSource == null) sfxSource = gameObject.AddComponent<AudioSource>();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        public void PlayTap()
        {
            if (sfxSource == null || tapClip == null) return;
            sfxSource.pitch = 1.0f;
            sfxSource.PlayOneShot(tapClip, 0.4f);
        }

        public void PlayWhoosh(int combo = 1)
        {
            if (sfxSource == null || whooshClip == null) return;

            // Pitch scaling with combo (Pentatonic steps)
            float pitch = 1.0f + Mathf.Min(combo - 1, 8) * 0.08f;
            sfxSource.pitch = pitch;
            sfxSource.PlayOneShot(whooshClip, 0.7f);
        }

        public void PlayBlocked()
        {
            if (sfxSource == null || blockedClip == null) return;
            sfxSource.pitch = 0.9f;
            sfxSource.PlayOneShot(blockedClip, 0.6f);
        }

        public void PlayHammer()
        {
            if (sfxSource == null || hammerClip == null) return;
            sfxSource.pitch = 1.0f;
            sfxSource.PlayOneShot(hammerClip, 0.8f);
        }

        public void PlayMagnet()
        {
            if (sfxSource == null || magnetClip == null) return;
            sfxSource.pitch = 1.1f;
            sfxSource.PlayOneShot(magnetClip, 0.7f);
        }

        public void PlayVictory()
        {
            if (sfxSource == null || victoryClip == null) return;
            sfxSource.pitch = 1.0f;
            sfxSource.PlayOneShot(victoryClip, 0.85f);
        }
    }
}
