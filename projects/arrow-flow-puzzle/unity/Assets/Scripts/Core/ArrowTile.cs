using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace ArrowFlow.Core
{
    public class ArrowTile : MonoBehaviour
    {
        public string Id { get; private set; }
        public int Row { get; private set; }
        public int Col { get; private set; }
        public CellCoord[] OccupiedCells { get; private set; }
        public ArrowDirection Direction { get; private set; }
        public bool IsRemoving { get; private set; }
        public bool IsHighlighted { get; private set; }
        public bool IsFrozen { get; private set; }
        public int FrozenHits { get; private set; }
        public bool IsPivot { get; private set; }
        public bool IsBomb { get; private set; }

        public event Action<ArrowTile> OnTapped;

        [Header("Visual Components")]
        [SerializeField] private LineRenderer lineRenderer;
        [SerializeField] private SpriteRenderer arrowRenderer;
        [SerializeField] private TrailRenderer trailRenderer;
        [SerializeField] private ParticleSystem disintegrateParticles;

        private Color originalColor = Color.white;
        private Color blockedColor = new Color(0.937f, 0.267f, 0.267f, 1f); // #ef4444
        private Color hintColor = new Color(0.024f, 0.714f, 0.831f, 1f);   // #06b6d4 cyan
        private Vector3 initialLocalPos;
        private float currentCellSize = 1.2f;

        private static Sprite cachedArrowHeadSprite;

        public void Initialize(ArrowData data, float cellSize)
        {
            Id = data.id;
            Row = data.row;
            Col = data.col;
            OccupiedCells = data.GetOccupiedCells();
            Direction = ArrowDirectionExtensions.FromString(data.direction);
            IsRemoving = false;
            IsHighlighted = false;
            IsFrozen = data.isFrozen;
            FrozenHits = data.frozenHits;
            IsPivot = data.isPivot;
            IsBomb = data.isBomb;
            currentCellSize = cellSize;

            // Keep root transform unrotated so local space coordinates align with grid axes
            transform.localRotation = Quaternion.identity;
            initialLocalPos = transform.localPosition;

            // Resolve original color
            if (!string.IsNullOrEmpty(data.color) && ColorUtility.TryParseHtmlString(data.color, out Color parsedColor))
            {
                originalColor = parsedColor;
            }
            else
            {
                originalColor = new Color(0.024f, 0.714f, 0.831f, 1f); // Default neon cyan
            }

            SetupLineRenderer();
            SetupArrowhead();
            SetupTouchHitboxes();
        }

        private void SetupLineRenderer()
        {
            if (lineRenderer == null)
            {
                lineRenderer = GetComponent<LineRenderer>();
                if (lineRenderer == null)
                {
                    lineRenderer = gameObject.AddComponent<LineRenderer>();
                }
            }

            lineRenderer.useWorldSpace = false;
            lineRenderer.textureMode = LineTextureMode.Tile;
            lineRenderer.alignment = LineAlignment.TransformZ;
            lineRenderer.numCornerVertices = 6;
            lineRenderer.numCapVertices = 6;

            float tubeWidth = currentCellSize * 0.38f;
            lineRenderer.startWidth = tubeWidth;
            lineRenderer.endWidth = tubeWidth;

            // Ensure material has transparent/additive or standard unlit sprite shader
            if (lineRenderer.material == null || lineRenderer.material.shader.name == "Standard")
            {
                Shader shader = Shader.Find("Sprites/Default");
                if (shader != null)
                {
                    lineRenderer.material = new Material(shader);
                }
            }

            lineRenderer.startColor = originalColor;
            lineRenderer.endColor = originalColor;

            // Compute spine points in local coordinates relative to the head cell
            if (OccupiedCells != null && OccupiedCells.Length > 1)
            {
                bool isHeadFirst = (OccupiedCells[0].row == Row && OccupiedCells[0].col == Col);
                int count = OccupiedCells.Length;
                lineRenderer.positionCount = count;

                // Build spine line from tail toward head
                for (int i = 0; i < count; i++)
                {
                    int index = isHeadFirst ? (count - 1 - i) : i;
                    var cell = OccupiedCells[index];
                    float lx = (cell.col - Col) * currentCellSize;
                    float ly = (cell.row - Row) * currentCellSize;
                    lineRenderer.SetPosition(i, new Vector3(lx, ly, 0f));
                }
            }
            else
            {
                // Single-cell arrow: draw a straight conduit stem pointing in Direction
                Vector2Int delta = Direction.GetGridDelta();
                lineRenderer.positionCount = 2;
                lineRenderer.SetPosition(0, new Vector3(-delta.x * currentCellSize * 0.28f, -delta.y * currentCellSize * 0.28f, 0f));
                lineRenderer.SetPosition(1, new Vector3(delta.x * currentCellSize * 0.12f, delta.y * currentCellSize * 0.12f, 0f));
            }
        }

        private void SetupArrowhead()
        {
            if (arrowRenderer == null)
            {
                Transform headChild = transform.Find("ArrowHead");
                if (headChild != null)
                {
                    arrowRenderer = headChild.GetComponent<SpriteRenderer>();
                }
                else
                {
                    GameObject headObj = new GameObject("ArrowHead");
                    headObj.transform.SetParent(transform, false);
                    arrowRenderer = headObj.AddComponent<SpriteRenderer>();
                }
            }

            Vector2Int delta = Direction.GetGridDelta();
            Vector3 headOffset = new Vector3(delta.x * currentCellSize * 0.15f, delta.y * currentCellSize * 0.15f, -0.02f);
            arrowRenderer.transform.localPosition = headOffset;
            arrowRenderer.transform.localRotation = Quaternion.Euler(0f, 0f, Direction.GetAngle());
            arrowRenderer.transform.localScale = Vector3.one * (currentCellSize * 0.42f);

            if (arrowRenderer.sprite == null)
            {
                arrowRenderer.sprite = GetOrCreateArrowHeadSprite();
            }

            arrowRenderer.color = originalColor;
        }

        private void SetupTouchHitboxes()
        {
            // Clear prior BoxCollider2D components
            var colliders = GetComponents<BoxCollider2D>();
            for (int i = 0; i < colliders.Length; i++)
            {
                Destroy(colliders[i]);
            }

            // Create a collider for each occupied cell (generous multi-cell hitbox)
            if (OccupiedCells != null && OccupiedCells.Length > 0)
            {
                foreach (var cell in OccupiedCells)
                {
                    BoxCollider2D box = gameObject.AddComponent<BoxCollider2D>();
                    box.offset = new Vector2((cell.col - Col) * currentCellSize, (cell.row - Row) * currentCellSize);
                    box.size = new Vector2(currentCellSize * 0.94f, currentCellSize * 0.94f);
                    box.isTrigger = true;
                }
            }
            else
            {
                BoxCollider2D box = gameObject.AddComponent<BoxCollider2D>();
                box.offset = Vector2.zero;
                box.size = new Vector2(currentCellSize * 0.94f, currentCellSize * 0.94f);
                box.isTrigger = true;
            }
        }

        public bool OccupiesCell(int r, int c)
        {
            if (OccupiedCells == null || OccupiedCells.Length == 0)
            {
                return Row == r && Col == c;
            }

            for (int i = 0; i < OccupiedCells.Length; i++)
            {
                if (OccupiedCells[i].row == r && OccupiedCells[i].col == c)
                {
                    return true;
                }
            }
            return false;
        }

        public void SetSpineColor(Color color)
        {
            if (lineRenderer != null)
            {
                lineRenderer.startColor = color;
                lineRenderer.endColor = color;
            }
            if (arrowRenderer != null)
            {
                arrowRenderer.color = color;
            }
        }

        public void SetHighlighted(bool highlighted)
        {
            IsHighlighted = highlighted;
            SetSpineColor(highlighted ? hintColor : originalColor);
        }

        public void PlayBlockedShake()
        {
            StartCoroutine(ShakeCoroutine());
        }

        private IEnumerator ShakeCoroutine()
        {
            float duration = 0.32f;
            float elapsed = 0f;
            float magnitude = currentCellSize * 0.10f;

            SetSpineColor(blockedColor);

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float x = UnityEngine.Random.Range(-1f, 1f) * magnitude;
                float y = UnityEngine.Random.Range(-1f, 1f) * magnitude;
                transform.localPosition = initialLocalPos + new Vector3(x, y, 0f);
                yield return null;
            }

            transform.localPosition = initialLocalPos;
            SetSpineColor(IsHighlighted ? hintColor : originalColor);
        }

        public void LaunchEscape(float escapeDistance, float duration, Action onComplete)
        {
            if (IsRemoving) return;
            IsRemoving = true;

            if (trailRenderer != null) trailRenderer.emitting = true;
            Vector2Int delta = Direction.GetGridDelta();
            Vector3 moveDir = new Vector3(delta.x, delta.y, 0f).normalized;

            StartCoroutine(AnimateLaunchCoroutine(moveDir * escapeDistance, duration, onComplete));
        }

        public void LaunchEscapeWaypoints(List<Vector3> waypoints, float duration, Action onComplete)
        {
            if (IsRemoving) return;
            IsRemoving = true;

            if (trailRenderer != null) trailRenderer.emitting = true;
            if (waypoints == null || waypoints.Count <= 1)
            {
                LaunchEscape(8f, duration, onComplete);
                return;
            }

            StartCoroutine(AnimateWaypointLaunchCoroutine(waypoints, duration, onComplete));
        }

        private IEnumerator AnimateLaunchCoroutine(Vector3 deltaPos, float duration, Action onComplete)
        {
            Vector3 startPos = transform.position;
            Vector3 targetPos = startPos + deltaPos;

            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                float ease = 1f - Mathf.Pow(1f - t, 3f);

                transform.position = Vector3.Lerp(startPos, targetPos, ease);
                transform.localScale = Vector3.Lerp(Vector3.one, Vector3.one * 0.35f, ease);

                yield return null;
            }

            onComplete?.Invoke();
            Destroy(gameObject);
        }

        private IEnumerator AnimateWaypointLaunchCoroutine(List<Vector3> waypoints, float duration, Action onComplete)
        {
            Vector3 startPos = transform.position;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                float ease = 1f - Mathf.Pow(1f - t, 3f);

                // Multi-segment waypoint interpolation
                float totalSegments = waypoints.Count - 1;
                float segProgress = ease * totalSegments;
                int segIndex = Mathf.Min(Mathf.FloorToInt(segProgress), waypoints.Count - 2);
                float segFraction = segProgress - segIndex;

                Vector3 p0 = waypoints[segIndex];
                Vector3 p1 = waypoints[segIndex + 1];

                transform.position = Vector3.Lerp(p0, p1, segFraction);
                transform.localScale = Vector3.Lerp(Vector3.one, Vector3.one * 0.35f, ease);

                yield return null;
            }

            onComplete?.Invoke();
            Destroy(gameObject);
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
            if (lineRenderer != null) lineRenderer.enabled = false;

            StartCoroutine(DelayedDestroy(0.35f, onComplete));
        }

        private IEnumerator DelayedDestroy(float delay, Action onComplete)
        {
            yield return new WaitForSeconds(delay);
            onComplete?.Invoke();
            Destroy(gameObject);
        }

        private void OnMouseDown()
        {
            if (IsRemoving) return;
            OnTapped?.Invoke(this);
        }

        // Procedural high-contrast sharp chevron terminal sprite generator
        public static Sprite GetOrCreateArrowHeadSprite()
        {
            if (cachedArrowHeadSprite != null) return cachedArrowHeadSprite;

            int size = 64;
            Texture2D tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            tex.filterMode = FilterMode.Bilinear;
            tex.wrapMode = TextureWrapMode.Clamp;

            Color clear = new Color(0, 0, 0, 0);
            Color white = Color.white;
            Color[] pixels = new Color[size * size];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = clear;

            // Define sharp chevron facing right: tip (56,32), barbs (16,54) & (16,10), notch (28,32)
            Vector2 tip = new Vector2(56f, 32f);
            Vector2 barbTop = new Vector2(16f, 54f);
            Vector2 notch = new Vector2(28f, 32f);
            Vector2 barbBottom = new Vector2(16f, 10f);

            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    Vector2 pt = new Vector2(x, y);
                    if (IsPointInTriangle(pt, tip, barbTop, notch) || IsPointInTriangle(pt, tip, notch, barbBottom))
                    {
                        pixels[y * size + x] = white;
                    }
                }
            }

            tex.SetPixels(pixels);
            tex.Apply();

            cachedArrowHeadSprite = Sprite.Create(
                tex,
                new Rect(0, 0, size, size),
                new Vector2(0.5f, 0.5f),
                size
            );
            return cachedArrowHeadSprite;
        }

        private static bool IsPointInTriangle(Vector2 p, Vector2 a, Vector2 b, Vector2 c)
        {
            float d1 = Sign(p, a, b);
            float d2 = Sign(p, b, c);
            float d3 = Sign(p, c, a);
            bool hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
            bool hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
            return !(hasNeg && hasPos);
        }

        private static float Sign(Vector2 p1, Vector2 p2, Vector2 p3)
        {
            return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
        }
    }
}
