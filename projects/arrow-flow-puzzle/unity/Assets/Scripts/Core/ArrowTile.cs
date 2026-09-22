using System;
using System.Collections;
using UnityEngine;

namespace ArrowFlow.Core
{
    public class ArrowTile : MonoBehaviour
    {
        public string Id { get; private set; }
        public int Row { get; private set; }
        public int Col { get; private set; }
        public ArrowDirection Direction { get; private set; }

        [Header("Visual Components")]
        [SerializeField] private SpriteRenderer arrowRenderer;
        [SerializeField] private SpriteRenderer backgroundRenderer;
        [SerializeField] private TrailRenderer trailRenderer;
        [SerializeField] private ParticleSystem disintegrateParticles;

        private Color originalColor = Color.white;
        private Vector3 initialLocalPos;
        public bool IsRemoving { get; private set; }

        public void Initialize(ArrowData data, float cellSize)
        {
            Id = data.id;
            Row = data.row;
            Col = data.col;
            Direction = ArrowDirectionExtensions.FromString(data.direction);
            IsRemoving = false;

            // Apply rotation
            transform.localRotation = Quaternion.Euler(0f, 0f, Direction.GetAngle());
            initialLocalPos = transform.localPosition;

            // Apply color
            if (ColorUtility.TryParseHtmlString(data.color, out Color parsedColor))
            {
                originalColor = parsedColor;
                if (arrowRenderer != null) arrowRenderer.color = originalColor;
            }
        }

        public void LaunchEscape(float escapeDistance, float duration, Action onComplete)
        {
            if (IsRemoving) return;
            IsRemoving = true;

            if (trailRenderer != null) trailRenderer.emitting = true;
            StartCoroutine(AnimateLaunchCoroutine(escapeDistance, duration, onComplete));
        }

        private IEnumerator AnimateLaunchCoroutine(float distance, float duration, Action onComplete)
        {
            Vector3 startPos = transform.position;
            Vector3 moveDir = transform.right; // Facing direction based on rotation
            Vector3 targetPos = startPos + moveDir * distance;

            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                // Ease out cubic
                float ease = 1f - Mathf.Pow(1f - t, 3f);

                transform.position = Vector3.Lerp(startPos, targetPos, ease);
                transform.localScale = Vector3.Lerp(Vector3.one, Vector3.one * 0.4f, ease);

                yield return null;
            }

            onComplete?.Invoke();
            Destroy(gameObject);
        }

        public void PlayBlockedShake()
        {
            StartCoroutine(ShakeCoroutine());
        }

        private IEnumerator ShakeCoroutine()
        {
            float duration = 0.3f;
            float elapsed = 0f;
            float magnitude = 0.12f;

            if (arrowRenderer != null) arrowRenderer.color = Color.red;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float x = UnityEngine.Random.Range(-1f, 1f) * magnitude;
                float y = UnityEngine.Random.Range(-1f, 1f) * magnitude;
                transform.localPosition = initialLocalPos + new Vector3(x, y, 0f);
                yield return null;
            }

            transform.localPosition = initialLocalPos;
            if (arrowRenderer != null) arrowRenderer.color = originalColor;
        }

        public void DisintegrateHammer(Action onComplete)
        {
            if (IsRemoving) return;
            IsRemoving = true;

            if (disintegrateParticles != null)
            {
                disintegrateParticles.Play();
            }

            if (arrowRenderer != null) arrowRenderer.enabled = false;
            if (backgroundRenderer != null) backgroundRenderer.enabled = false;

            StartCoroutine(DelayedDestroy(0.4f, onComplete));
        }

        private IEnumerator DelayedDestroy(float delay, Action onComplete)
        {
            yield return new WaitForSeconds(delay);
            onComplete?.Invoke();
            Destroy(gameObject);
        }
    }
}
