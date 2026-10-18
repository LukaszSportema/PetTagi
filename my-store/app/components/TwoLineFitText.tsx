'use client';

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type TwoLineFitTextProps = {
  text: string;
  className?: string;
  maxFontPx?: number;
  minFontPx?: number;
  lineHeight?: number;
  reserveTwoLines?: boolean;
};

type UniformFontSizes = {
  titleFontPx: number | null;
  subtitleFontPx: number | null;
  choiceFontPx: number | null;
};

const UniformFontContext = createContext<UniformFontSizes>({
  titleFontPx: null,
  subtitleFontPx: null,
  choiceFontPx: null,
});

const LINE_HEIGHT = 1.35;
/** px-0.5 po obu stronach etykiety w kafelku */
const TILE_TEXT_HORIZONTAL_PAD_PX = 2;

const syncProbeTypography = (probe: HTMLSpanElement, container: HTMLElement) => {
  const cs = getComputedStyle(container);
  probe.style.fontFamily = cs.fontFamily;
  probe.style.display = 'block';
  probe.style.boxSizing = 'border-box';
  probe.style.wordBreak = 'normal';
  probe.style.overflowWrap = 'break-word';
  probe.style.fontWeight = '500';
};

const textAreaWidthForCell = (cell: HTMLElement) => {
  const cs = getComputedStyle(cell);
  const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  return Math.max(0, Math.floor(cell.clientWidth - padX - TILE_TEXT_HORIZONTAL_PAD_PX));
};

const textFitsTwoLines = (
  probe: HTMLSpanElement,
  text: string,
  widthPx: number,
  fontSizePx: number,
  lineHeight: number,
  fontWeight: number,
) => {
  probe.style.width = `${widthPx}px`;
  probe.style.fontSize = `${fontSizePx}px`;
  probe.style.lineHeight = String(lineHeight);
  probe.style.fontWeight = String(fontWeight);
  probe.textContent = text;
  const lh = parseFloat(getComputedStyle(probe).lineHeight) || fontSizePx * lineHeight;
  return probe.scrollHeight <= lh * 2 + 1;
};

const uniformFontSizeForTexts = (
  probe: HTMLSpanElement,
  texts: string[],
  widthPx: number,
  maxFontPx: number,
  minFontPx: number,
  lineHeight: number,
  fontWeight: number,
) => {
  if (widthPx <= 0 || texts.length === 0) return maxFontPx;
  const floor = Math.min(minFontPx, 8);
  for (let size = maxFontPx; size >= floor; size -= 0.5) {
    const allFit = texts.every((text) =>
      textFitsTwoLines(probe, text, widthPx, size, lineHeight, fontWeight),
    );
    if (allFit) return size;
  }
  return floor;
};

const gridTextAreaWidth = (container: HTMLElement) => {
  const grids = container.querySelectorAll('[data-uniform-font-grid]');
  let minWidth = 0;
  grids.forEach((grid) => {
    if (grid.children.length === 0) return;
    const width = textAreaWidthForCell(grid.children[0] as HTMLElement);
    if (width > 0 && (minWidth === 0 || width < minWidth)) minWidth = width;
  });
  return minWidth;
};

type UniformTwoLineFontScopeProps = {
  children: ReactNode;
  titleTexts?: string[];
  subtitleTexts?: string[];
  choiceTexts?: string[];
  titleMax?: number;
  titleMin?: number;
  subtitleMax?: number;
  subtitleMin?: number;
  choiceMax?: number;
  choiceMin?: number;
  lineHeight?: number;
};

/** Wspólna wielkość czcionki w siatce — największa możliwa, przy której wszystkie napisy mieszczą się w 2 wierszach. */
export function UniformTwoLineFontScope({
  children,
  titleTexts = [],
  subtitleTexts = [],
  choiceTexts = [],
  titleMax = 16,
  titleMin = 10,
  subtitleMax = 14,
  subtitleMin = 9,
  choiceMax = 18,
  choiceMin = 12,
  lineHeight = LINE_HEIGHT,
}: UniformTwoLineFontScopeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const [sizes, setSizes] = useState<UniformFontSizes>(() => ({
    titleFontPx: titleTexts.length > 0 ? titleMax : null,
    subtitleFontPx: subtitleTexts.length > 0 ? Math.min(subtitleMax, titleMax) : null,
    choiceFontPx: choiceTexts.length > 0 ? choiceMax : null,
  }));

  const titleKey = useMemo(() => titleTexts.join('\0'), [titleTexts]);
  const subtitleKey = useMemo(() => subtitleTexts.join('\0'), [subtitleTexts]);
  const choiceKey = useMemo(() => choiceTexts.join('\0'), [choiceTexts]);

  const titleTextsRef = useRef(titleTexts);
  const subtitleTextsRef = useRef(subtitleTexts);
  const choiceTextsRef = useRef(choiceTexts);
  titleTextsRef.current = titleTexts;
  subtitleTextsRef.current = subtitleTexts;
  choiceTextsRef.current = choiceTexts;

  useLayoutEffect(() => {
    const container = containerRef.current;
    const probe = probeRef.current;
    if (!container || !probe) return;

    const measure = () => {
      syncProbeTypography(probe, container);
      const width = gridTextAreaWidth(container);
      if (width <= 0) return;

      const titles = titleTextsRef.current;
      const subtitles = subtitleTextsRef.current;
      const choices = choiceTextsRef.current;

      const titlePx =
        titles.length > 0
          ? uniformFontSizeForTexts(probe, titles, width, titleMax, titleMin, lineHeight, 500)
          : null;

      const subtitleMaxPx =
        titlePx != null ? Math.min(subtitleMax, titlePx) : subtitleMax;

      const next: UniformFontSizes = {
        titleFontPx: titlePx,
        subtitleFontPx:
          subtitles.length > 0
            ? uniformFontSizeForTexts(
                probe,
                subtitles,
                width,
                subtitleMaxPx,
                Math.min(subtitleMin, subtitleMaxPx),
                lineHeight,
                400,
              )
            : null,
        choiceFontPx:
          choices.length > 0
            ? uniformFontSizeForTexts(probe, choices, width, choiceMax, choiceMin, lineHeight, 500)
            : null,
      };

      setSizes((prev) =>
        prev.titleFontPx === next.titleFontPx &&
        prev.subtitleFontPx === next.subtitleFontPx &&
        prev.choiceFontPx === next.choiceFontPx
          ? prev
          : next,
      );
    };

    measure();
    requestAnimationFrame(measure);
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measure);
    });
    container.querySelectorAll('[data-uniform-font-grid]').forEach((grid) => {
      ro.observe(grid);
    });
    return () => ro.disconnect();
  }, [
    titleKey,
    subtitleKey,
    choiceKey,
    titleMax,
    titleMin,
    subtitleMax,
    subtitleMin,
    choiceMax,
    choiceMin,
    lineHeight,
  ]);

  return (
    <UniformFontContext.Provider value={sizes}>
      <div ref={containerRef}>
        <span
          ref={probeRef}
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 -z-50 opacity-0 overflow-hidden whitespace-normal"
        />
        {children}
      </div>
    </UniformFontContext.Provider>
  );
}

/** Zmniejsza czcionkę, aż tekst zmieści się w co najwyżej 2 wierszach (bez obcinania). */
export function TwoLineFitText({
  text,
  className = '',
  maxFontPx = 16,
  minFontPx = 10,
  lineHeight = LINE_HEIGHT,
  reserveTwoLines = false,
}: TwoLineFitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [fontPx, setFontPx] = useState(maxFontPx);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fit = () => {
      el.style.lineHeight = String(lineHeight);
      const absoluteMin = Math.min(minFontPx, 8);
      let chosen = absoluteMin;

      for (let size = maxFontPx; size >= absoluteMin; size -= 0.5) {
        el.style.fontSize = `${size}px`;
        const lh = parseFloat(getComputedStyle(el).lineHeight) || size * lineHeight;
        const maxHeight = lh * 2 + 1;
        if (el.scrollHeight <= maxHeight) {
          chosen = size;
          break;
        }
      }

      el.style.fontSize = `${chosen}px`;
      setFontPx(chosen);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    const parent = el.parentElement;
    if (parent) ro.observe(parent);
    return () => ro.disconnect();
  }, [text, maxFontPx, minFontPx, lineHeight]);

  return (
    <span
      ref={ref}
      className={`block w-full px-0.5 ${className}`}
      style={{
        fontSize: fontPx,
        lineHeight,
        ...(reserveTwoLines ? { minHeight: twoLineBlockMinHeight(fontPx, lineHeight) } : {}),
      }}
    >
      {text}
    </span>
  );
}

type PresetProps = { text: string; className?: string };

const twoLineBlockMinHeight = (fontPx: number, lineHeight = LINE_HEIGHT) =>
  fontPx * lineHeight * 2;

function UniformOrFitText({
  text,
  className,
  uniformPx,
  maxFontPx,
  minFontPx,
  reserveTwoLines,
}: PresetProps & {
  uniformPx: number | null;
  maxFontPx: number;
  minFontPx: number;
  reserveTwoLines?: boolean;
}) {
  if (uniformPx != null) {
    return (
      <span
        className={`block w-full px-0.5 ${className}`}
        style={{
          fontSize: uniformPx,
          lineHeight: LINE_HEIGHT,
          ...(reserveTwoLines ? { minHeight: twoLineBlockMinHeight(uniformPx) } : {}),
        }}
      >
        {text}
      </span>
    );
  }
  return (
    <TwoLineFitText
      text={text}
      className={className}
      maxFontPx={maxFontPx}
      minFontPx={minFontPx}
      lineHeight={LINE_HEIGHT}
      reserveTwoLines={reserveTwoLines}
    />
  );
}

export function ConfiguratorTileTitle({ text, className = '' }: PresetProps) {
  const { titleFontPx } = useContext(UniformFontContext);
  return (
    <UniformOrFitText
      text={text}
      uniformPx={titleFontPx}
      maxFontPx={16}
      minFontPx={10}
      reserveTwoLines
      className={`text-center font-medium text-[#161616] ${className}`}
    />
  );
}

export function ConfiguratorTileSubtitle({ text, className = '' }: PresetProps) {
  const { subtitleFontPx, titleFontPx } = useContext(UniformFontContext);
  const cappedSubtitlePx =
    subtitleFontPx != null && titleFontPx != null
      ? Math.min(subtitleFontPx, titleFontPx)
      : subtitleFontPx;
  const maxPx =
    titleFontPx != null ? Math.min(14, titleFontPx) : 14;
  return (
    <UniformOrFitText
      text={text}
      uniformPx={cappedSubtitlePx}
      maxFontPx={maxPx}
      minFontPx={9}
      reserveTwoLines
      className={`text-center font-normal text-[#7A736C] ${className}`}
    />
  );
}

export function ConfiguratorChoiceLabel({ text, className = '' }: PresetProps) {
  const { choiceFontPx } = useContext(UniformFontContext);
  return (
    <UniformOrFitText
      text={text}
      uniformPx={choiceFontPx}
      maxFontPx={18}
      minFontPx={12}
      className={`min-h-[1.75rem] flex-1 min-w-0 text-left font-medium text-[#161616] ${className}`}
    />
  );
}
