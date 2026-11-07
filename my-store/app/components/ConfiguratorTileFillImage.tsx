'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type SyntheticEvent } from 'react';
import precomputedArtworkBounds from '@/lib/configurator-artwork-bounds.json';

type ContentBounds = { minX: number; minY: number; maxX: number; maxY: number };

const boundsCache = new Map<string, ContentBounds>();
const MAX_ANALYSIS_PX = 160;
/** Podbij po zmianie algorytmu bbox — wymusza przeliczenie u klientów (tylko fallback canvas). */
const BOUNDS_CACHE_VERSION = 3;

const STATIC_BOUNDS: Record<string, ContentBounds> = precomputedArtworkBounds as Record<
  string,
  ContentBounds
>;

function sampleCornerBg(data: Uint8ClampedArray, width: number, height: number, sample = 6) {
  const samples: [number, number, number][] = [];
  const corners: [number, number][] = [
    [0, 0],
    [width - sample, 0],
    [0, height - sample],
    [width - sample, height - sample],
  ];
  for (const [cx, cy] of corners) {
    for (let y = cy; y < cy + sample && y < height; y++) {
      for (let x = cx; x < cx + sample && x < width; x++) {
        const i = (y * width + x) * 4;
        samples.push([data[i], data[i + 1], data[i + 2]]);
      }
    }
  }
  const r = Math.round(samples.reduce((s, c) => s + c[0], 0) / samples.length);
  const g = Math.round(samples.reduce((s, c) => s + c[1], 0) / samples.length);
  const b = Math.round(samples.reduce((s, c) => s + c[2], 0) / samples.length);
  return { r, g, b };
}

function isBackgroundPixel(
  r: number,
  g: number,
  b: number,
  a: number,
  bg: { r: number; g: number; b: number },
  threshold: number,
) {
  if (a < 20) return true;
  const dr = r - bg.r;
  const dg = g - bg.g;
  const db = b - bg.b;
  return dr * dr + dg * dg + db * db <= threshold * threshold;
}

function scanBounds(data: Uint8ClampedArray, width: number, height: number): ContentBounds {
  const bg = sampleCornerBg(data, width, height);
  const threshold = 42;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (isBackgroundPixel(r, g, b, a, bg, threshold)) continue;
      found = true;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (!found) return { minX: 0, minY: 0, maxX: width - 1, maxY: height - 1 };

  const padX = Math.max(1, Math.round((maxX - minX) * 0.02));
  const padY = Math.max(1, Math.round((maxY - minY) * 0.02));
  minX = Math.max(0, minX - padX);
  minY = Math.max(0, minY - padY);
  maxX = Math.min(width - 1, maxX + padX);
  maxY = Math.min(height - 1, maxY + padY);

  return { minX, minY, maxX, maxY };
}

function expandContentBounds(bounds: ContentBounds, naturalW: number, naturalH: number): ContentBounds {
  const contentW = bounds.maxX - bounds.minX + 1;
  const contentH = bounds.maxY - bounds.minY + 1;
  const padX = Math.max(6, Math.round(contentW * 0.06));
  const padY = Math.max(6, Math.round(contentH * 0.06));
  return {
    minX: Math.max(0, bounds.minX - padX),
    minY: Math.max(0, bounds.minY - padY),
    maxX: Math.min(naturalW - 1, bounds.maxX + padX),
    maxY: Math.min(naturalH - 1, bounds.maxY + padY),
  };
}

function scaleBounds(bounds: ContentBounds, invScale: number, naturalW: number, naturalH: number): ContentBounds {
  return {
    minX: Math.max(0, Math.floor(bounds.minX * invScale)),
    minY: Math.max(0, Math.floor(bounds.minY * invScale)),
    maxX: Math.min(naturalW - 1, Math.ceil(bounds.maxX * invScale)),
    maxY: Math.min(naturalH - 1, Math.ceil(bounds.maxY * invScale)),
  };
}

/** Bounds z build-time (charms + naklejki) albo szybki canvas + cache. */
export function getCachedContentBounds(img: HTMLImageElement, cacheKey: string): ContentBounds | null {
  const staticBounds = STATIC_BOUNDS[cacheKey];
  if (staticBounds) {
    return staticBounds;
  }

  const cacheId = `${cacheKey}@${BOUNDS_CACHE_VERSION}`;
  const cached = boundsCache.get(cacheId);
  if (cached) return cached;

  const naturalW = img.naturalWidth;
  const naturalH = img.naturalHeight;
  if (!naturalW || !naturalH) return null;

  const analysisScale = Math.min(1, MAX_ANALYSIS_PX / Math.max(naturalW, naturalH));
  const analysisW = Math.max(1, Math.round(naturalW * analysisScale));
  const analysisH = Math.max(1, Math.round(naturalH * analysisScale));

  const canvas = document.createElement('canvas');
  canvas.width = analysisW;
  canvas.height = analysisH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  try {
    ctx.drawImage(img, 0, 0, analysisW, analysisH);
  } catch {
    return null;
  }

  const data = ctx.getImageData(0, 0, analysisW, analysisH).data;
  const small = scanBounds(data, analysisW, analysisH);
  const invScale = analysisScale > 0 ? 1 / analysisScale : 1;
  const bounds = expandContentBounds(
    scaleBounds(small, invScale, naturalW, naturalH),
    naturalW,
    naturalH,
  );
  boundsCache.set(cacheId, bounds);
  return bounds;
}

/** W tle ładuje naklejki / charmsy, żeby bounds były w cache przed wejściem w krok. */
export function warmupConfiguratorTileFillBounds(urls: string[]) {
  for (const url of urls) {
    if (boundsCache.has(`${url}@${BOUNDS_CACHE_VERSION}`)) continue;
    const img = new Image();
    img.onload = () => {
      getCachedContentBounds(img, url);
    };
    img.src = url;
  }
}

function fitImageToContainer(
  containerW: number,
  containerH: number,
  naturalW: number,
  naturalH: number,
  bounds: ContentBounds,
  insetFraction = 0,
  contentVerticalAlign: 'center' | 'start' = 'center',
): CSSProperties {
  const insetX = containerW * insetFraction;
  const insetY = containerH * insetFraction;
  const innerW = containerW - insetX * 2;
  const innerH = containerH - insetY * 2;

  const contentW = bounds.maxX - bounds.minX + 1;
  const contentH = bounds.maxY - bounds.minY + 1;
  if (contentW <= 0 || contentH <= 0 || innerW <= 0 || innerH <= 0) {
    return {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      objectPosition: contentVerticalAlign === 'start' ? 'top' : 'center',
    };
  }

  const scale = Math.min(innerW / contentW, innerH / contentH);
  const width = naturalW * scale;
  const height = naturalH * scale;
  const left = -(bounds.minX * scale) + insetX + (innerW - contentW * scale) / 2;
  const verticalOffset =
    contentVerticalAlign === 'start' ? 0 : (innerH - contentH * scale) / 2;
  const top = -(bounds.minY * scale) + insetY + verticalOffset;

  return {
    position: 'absolute',
    width,
    height,
    left,
    top,
    maxWidth: 'none',
    maxHeight: 'none',
  };
}

type ConfiguratorTileFillImageProps = {
  src: string;
  alt: string;
  className?: string;
  /** Luka wokół kadru (0–0.5), np. 0.06 = ~6% z każdej strony. */
  fitInsetFraction?: number;
  /**
   * Pionowe wyrównanie wykrytej zawartości w kontenerze.
   * `start` — przy górnej krawędzi (mniej „pustego” pasma u góry przy zdjęciach z jasnym tłem w dolnej części kadru).
   */
  contentVerticalAlign?: 'center' | 'start';
};

/** Wypełnia prostokąt kafelka — wykrywa zawartość w JPG/PNG i skaluje bez wychodzenia poza box. */
export function ConfiguratorTileFillImage({
  src,
  alt,
  className = '',
  fitInsetFraction = 0,
  contentVerticalAlign = 'center',
}: ConfiguratorTileFillImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const boundsRef = useRef<ContentBounds | null>(null);
  const [imgStyle, setImgStyle] = useState<CSSProperties | null>(null);

  useEffect(() => {
    boundsRef.current = boundsCache.get(`${src}@${BOUNDS_CACHE_VERSION}`) ?? null;
    setImgStyle(null);
  }, [src]);

  const applyFit = useCallback(
    (img: HTMLImageElement, remeasureBounds: boolean) => {
      const container = containerRef.current;
      if (!container || !img.naturalWidth) return;

      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (cw <= 0 || ch <= 0) return;

      if (remeasureBounds || !boundsRef.current) {
        boundsRef.current =
          getCachedContentBounds(img, src) ??
          ({
            minX: 0,
            minY: 0,
            maxX: img.naturalWidth - 1,
            maxY: img.naturalHeight - 1,
          } satisfies ContentBounds);
      }

      setImgStyle(
        fitImageToContainer(
          cw,
          ch,
          img.naturalWidth,
          img.naturalHeight,
          boundsRef.current,
          fitInsetFraction,
          contentVerticalAlign,
        ),
      );
    },
    [src, fitInsetFraction, contentVerticalAlign],
  );

  const onImageLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      applyFit(event.currentTarget, true);
    },
    [applyFit],
  );

  useLayoutEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth) applyFit(img, !boundsRef.current);
  }, [applyFit, src]);

  useEffect(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      if (img?.complete && img.naturalWidth) applyFit(img, false);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [applyFit, src]);

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`.trim()}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={onImageLoad}
        decoding="async"
        className={
          imgStyle
            ? 'block pointer-events-none select-none'
            : `absolute inset-0 m-auto max-w-full max-h-full object-contain ${
                contentVerticalAlign === 'start' ? 'object-top' : 'object-center'
              }`
        }
        style={imgStyle ?? undefined}
        draggable={false}
      />
    </div>
  );
}
