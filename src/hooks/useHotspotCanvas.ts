import { useCallback, useState, useEffect, RefObject } from "react";

/**
 * useHotspotCanvas Hook
 *
 * Shared canvas logic for hotspot editors (HotspotEditor, PlanoHotspotEditor, FacadeHotspotEditor).
 *
 * Handles:
 * - Image bounds calculation with object-contain offset
 * - Coordinate conversion (client coords ↔ percentage ↔ pixel positions)
 * - Resize handling
 * - Cached bounds for performance
 *
 * @param containerRef - Ref to the container element
 * @param imgRef - Ref to the image element
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const imgRef = useRef<HTMLImageElement>(null);
 * const { getImageBounds, toPercent, toPx } = useHotspotCanvas(containerRef, imgRef);
 *
 * const handleClick = (e: React.MouseEvent) => {
 *   const { x, y } = toPercent(e.clientX, e.clientY);
 *   console.log(`Clicked at ${x}%, ${y}%`);
 * };
 * ```
 */

interface ImageBounds {
  imgW: number;
  imgH: number;
  offsetX: number;
  offsetY: number;
  cRect: DOMRect;
}

export function useHotspotCanvas(
  containerRef: RefObject<HTMLDivElement>,
  imgRef: RefObject<HTMLImageElement>
) {
  const [cachedBounds, setCachedBounds] = useState<ImageBounds | null>(null);
  const [tick, setTick] = useState(0);

  /**
   * Calculate image bounds accounting for object-contain offset
   *
   * When an image uses object-contain, there may be empty space (letterboxing).
   * This function calculates the actual rendered image dimensions and position.
   *
   * @returns ImageBounds or null if not ready
   */
  const getImageBounds = useCallback((): ImageBounds | null => {
    const container = containerRef.current;
    const img = imgRef.current;

    if (!container || !img || !img.naturalWidth || !img.naturalHeight) {
      return null;
    }

    const cRect = container.getBoundingClientRect();
    const naturalRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = cRect.width / cRect.height;

    let imgW: number, imgH: number, offsetX: number, offsetY: number;

    if (naturalRatio > containerRatio) {
      // Image is wider → letterbox top/bottom
      imgW = cRect.width;
      imgH = cRect.width / naturalRatio;
      offsetX = 0;
      offsetY = (cRect.height - imgH) / 2;
    } else {
      // Image is taller → letterbox left/right
      imgH = cRect.height;
      imgW = cRect.height * naturalRatio;
      offsetX = (cRect.width - imgW) / 2;
      offsetY = 0;
    }

    const bounds = { imgW, imgH, offsetX, offsetY, cRect };
    setCachedBounds(bounds);
    return bounds;
  }, [containerRef, imgRef]);

  /**
   * Convert client coordinates to image-relative percentages (0-100)
   *
   * @param clientX - X coordinate from mouse event
   * @param clientY - Y coordinate from mouse event
   * @returns { x, y } in percentage (0-100), clamped to image bounds
   */
  const toPercent = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const bounds = getImageBounds();
      if (!bounds) return { x: 0, y: 0 };

      const { imgW, imgH, offsetX, offsetY, cRect } = bounds;
      const x = ((clientX - cRect.left - offsetX) / imgW) * 100;
      const y = ((clientY - cRect.top - offsetY) / imgH) * 100;

      return {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };
    },
    [getImageBounds]
  );

  /**
   * Convert image-relative percentages to pixel positions
   *
   * @param x - X percentage (0-100)
   * @param y - Y percentage (0-100)
   * @returns { left, top } in pixels, or null if bounds not ready
   */
  const toPx = useCallback(
    (x: number, y: number): { left: number; top: number } | null => {
      if (!cachedBounds) return null;

      const { imgW, imgH, offsetX, offsetY } = cachedBounds;
      return {
        left: offsetX + (x / 100) * imgW,
        top: offsetY + (y / 100) * imgH,
      };
    },
    [cachedBounds]
  );

  /**
   * Update cached bounds on resize and image load
   */
  useEffect(() => {
    getImageBounds();
  }, [getImageBounds, tick]);

  /**
   * Listen for window resize events
   */
  useEffect(() => {
    const onResize = () => setTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return {
    getImageBounds,
    toPercent,
    toPx,
    cachedBounds,
  };
}
