'use client';

import type { ReactNode } from 'react';
import { isWarehouseOutOfStock } from '@/lib/warehouse-stock';
import { ConfiguratorTileTitle, UniformTwoLineFontScope } from './components/TwoLineFitText';
import { ConfiguratorTileFillImage } from './components/ConfiguratorTileFillImage';
import {
  ROGALIK_BEADS_OPTIONS,
  ROGALIK_NECK_MAX,
  ROGALIK_NECK_MIN,
  isValidRogalikNeckCircumference,
  ROGALIK_CHARM_OPTIONS,
  ROGALIK_COLOR_OPTIONS,
  ROGALIK_CORD_COLOR_OPTIONS,
  ROGALIK_MAX_CHARMS,
  ROGALIK_MOUNTING_OPTIONS,
  ROGALIK_MOUNTING_TILE_IMAGES,
  ROGALIK_MOUNTING_TILE_LABELS,
} from '@/lib/rogalik-options';
import {
  DEFAULT_ROGALIK_MOUNTING_START_PRICES,
  rogalikMountingStartPricePln,
  type RogalikMountingStartPrices,
} from '@/lib/rogalik-admin-pricing';
import { tagModelStartPriceLabel } from '@/lib/tag-model-pricing';

type RogalikFormSlice = {
  rogalikColor: string;
  rogalikMounting: string;
  stringLength: string;
  rogalikCordColor: string;
  rogalikBeads: string;
  rogalikCharms: string[];
};

type Props = {
  formData: RogalikFormSlice;
  onChange: (patch: Partial<RogalikFormSlice>) => void;
  onToggleCharm: (id: string) => void;
  showErrors: boolean;
  stringSizeText: string;
  /** Model (mocowanie), kolor lub dodatki (obwód, sznureczek, koraliki, charmsy). */
  step: 'kolor' | 'mocowanie' | 'dodatki';
  warehouseStock: Record<string, number>;
  /** „Od X zł” na kafelach mocowania rogalika (panel admina). */
  rogalikMountingStartPrices?: RogalikMountingStartPrices;
};

const sectionClass = 'space-y-4 pt-8 border-t border-[#D6C7AE] first:border-t-0 first:pt-0';
const subtitleClass = 'text-sm text-[#7A736C] font-light';
const titleClass = 'font-bold text-base text-[#161616]';
const rogalikArtworkTileMediaClass =
  'w-full aspect-square bg-[#EFE8DC] border border-[#D6C7AE] overflow-hidden relative flex items-center justify-center';

function SectionTitle({ index, children }: { index: number; children: ReactNode }) {
  return (
    <p className={titleClass}>
      {index}. {children}
    </p>
  );
}

/** JPG sznurka: wewnętrzna ramka + boczne tło — cover + zoom wypełnia kafel. */
const RogalikCordTileImage = ({ src, alt, zoom }: { src: string; alt: string; zoom: number }) => (
  <img
    src={src}
    alt={alt}
    decoding="async"
    draggable={false}
    className="absolute inset-0 h-full w-full origin-center object-cover object-center pointer-events-none select-none"
    style={{ transform: `scale(${zoom})` }}
  />
);

function OptionTiles({
  options,
  selectedId,
  onSelect,
  columns = 2,
  variant = 'image',
  tileArtworkInset = 0,
  tileImageCoverZoom,
}: {
  options: typeof ROGALIK_COLOR_OPTIONS;
  selectedId: string;
  onSelect: (id: string) => void;
  columns?: 2 | 3 | 4;
  variant?: 'image' | 'text';
  /** Luka między grafiką a krawędzią kwadratu kafelka (np. koraliki). */
  tileArtworkInset?: number;
  /** Pełne wypełnienie kwadratu (sznurek) — odetnie boczne tło z pliku. */
  tileImageCoverZoom?: number;
}) {
  const gridClass =
    columns === 3
      ? 'grid grid-cols-1 sm:grid-cols-3 gap-4'
      : columns === 4
        ? 'grid grid-cols-2 md:grid-cols-4 gap-4'
        : 'grid grid-cols-1 sm:grid-cols-2 gap-4';

  return (
    <UniformTwoLineFontScope titleTexts={options.map((option) => option.label)}>
      <div className={gridClass} data-uniform-font-grid>
      {options.map((option) => {
        const disabled = option.comingSoon;
        const isSelected = !disabled && selectedId === option.id;
        return (
          <button
            key={option.id}
            type="button"
            data-uniform-font-cell
            disabled={disabled}
            onClick={() => !disabled && onSelect(option.id)}
            className={`rounded-none p-4 md:p-6 border transition-colors duration-300 flex flex-col gap-3 items-center text-center ${
              variant === 'text' ? 'min-h-[5rem] justify-center' : 'min-h-[5.5rem]'
            } ${
              disabled
                ? 'border-[#E8E0D4] bg-[#F9F5ED] opacity-70 cursor-not-allowed'
                : isSelected
                  ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md cursor-pointer'
                  : 'border-[#D6C7AE] bg-white hover:border-[#C4A574] cursor-pointer'
            }`}
          >
            {variant === 'image' && (
              <div className={rogalikArtworkTileMediaClass}>
                {option.image ? (
                  tileImageCoverZoom != null ? (
                    <RogalikCordTileImage src={option.image} alt={option.label} zoom={tileImageCoverZoom} />
                  ) : (
                    <ConfiguratorTileFillImage
                      src={option.image}
                      alt={option.label}
                      fitInsetFraction={tileArtworkInset}
                    />
                  )
                ) : (
                  <span className="text-[10px] uppercase tracking-widest text-[#9A9288]">Zdjęcie wkrótce</span>
                )}
              </div>
            )}
            <ConfiguratorTileTitle text={option.label} />
            {option.comingSoon && (
              <span className="text-xs text-[#7A736C] font-light">już wkrótce</span>
            )}
            {!disabled && (
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center self-center transition-all ${
                  isSelected ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'
                }`}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            )}
          </button>
        );
      })}
      </div>
    </UniformTwoLineFontScope>
  );
}

function NeckCircumferenceSection({
  formData,
  onChange,
  showErrors,
  stringSizeText,
  sectionIndex,
}: {
  formData: RogalikFormSlice;
  onChange: (patch: Partial<RogalikFormSlice>) => void;
  showErrors: boolean;
  stringSizeText: string;
  sectionIndex: number;
}) {
  return (
    <section className={`${sectionClass} scroll-mt-28`} data-configurator-section="rogalik-neck">
      <SectionTitle index={sectionIndex}>Podaj obwód szyi</SectionTitle>
      <div className="space-y-2">
        <label className="block text-sm text-[#7A736C] font-light">
          Wpisz obwód szyi Twojego pieska w centymetrach:
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={formData.stringLength}
          onChange={(e) => {
            const val = e.target.value;
            if (!/^\d*$/.test(val)) return;
            if (val === '') {
              onChange({ stringLength: '' });
              return;
            }
            if (val.length > 2) return;
            const num = Number(val);
            if (num > ROGALIK_NECK_MAX) return;
            if (val.length === 1 && num >= 1 && num <= 9) {
              onChange({ stringLength: val });
              return;
            }
            if (num >= ROGALIK_NECK_MIN && num <= ROGALIK_NECK_MAX) {
              onChange({ stringLength: val });
            }
          }}
          placeholder="wpisz obwód szyi (16–50 cm)"
          className="w-full md:w-1/2 p-3 rounded-xl border border-[#D6C7AE] focus:outline-none focus:border-[#161616] bg-white"
        />
        {showErrors && !isValidRogalikNeckCircumference(formData.stringLength) && (
          <p className="text-sm text-red-500">
            Podaj obwód szyi ({ROGALIK_NECK_MIN}–{ROGALIK_NECK_MAX} cm).
          </p>
        )}
        {stringSizeText && (
          <div className="w-full md:w-1/2 p-3 rounded-xl border border-[#D6C7AE] bg-[#F4EFE6] font-bold text-base text-[#161616]">
            {stringSizeText}
          </div>
        )}
      </div>
    </section>
  );
}

export function RogalikConfiguratorStep({
  formData,
  onChange,
  onToggleCharm,
  showErrors,
  stringSizeText,
  step,
  warehouseStock,
  rogalikMountingStartPrices,
}: Props) {
  const mountingStartPrices = rogalikMountingStartPrices ?? DEFAULT_ROGALIK_MOUNTING_START_PRICES;
  if (step === 'dodatki') {
    return (
      <div className="space-y-2">
        <NeckCircumferenceSection
          formData={formData}
          onChange={onChange}
          showErrors={showErrors}
          stringSizeText={stringSizeText}
          sectionIndex={1}
        />

        <section className={`${sectionClass} scroll-mt-28`} data-configurator-section="rogalik-cord">
          <SectionTitle index={2}>Wybierz kolor sznureczka</SectionTitle>
          <OptionTiles
            options={ROGALIK_CORD_COLOR_OPTIONS}
            selectedId={formData.rogalikCordColor}
            onSelect={(id) => onChange({ rogalikCordColor: id })}
            columns={3}
            tileImageCoverZoom={1.36}
          />
          {showErrors && !formData.rogalikCordColor && (
            <p className="text-sm text-red-500">Wybierz kolor sznureczka.</p>
          )}
        </section>

        <section className={`${sectionClass} scroll-mt-28`} data-configurator-section="rogalik-beads">
          <SectionTitle index={3}>Wybierz koraliki</SectionTitle>
          <p className={subtitleClass}>Wybierz interesujący Cię wariant:</p>
          <OptionTiles
            options={ROGALIK_BEADS_OPTIONS}
            selectedId={formData.rogalikBeads}
            onSelect={(id) => onChange({ rogalikBeads: id })}
            columns={3}
            tileArtworkInset={0.07}
          />
          {showErrors && !formData.rogalikBeads && (
            <p className="text-sm text-red-500">Wybierz wariant koralików.</p>
          )}
        </section>

        <section className={sectionClass}>
          <SectionTitle index={4}>Dodaj charmsy</SectionTitle>
          <p className={subtitleClass}>
            Możesz dodać do {ROGALIK_MAX_CHARMS} charmsów i stworzyć własną, wyjątkową adresówkę
          </p>
          <UniformTwoLineFontScope titleTexts={ROGALIK_CHARM_OPTIONS.map((charm) => charm.label)}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-uniform-font-grid>
            {ROGALIK_CHARM_OPTIONS.map((charm) => {
              const isSelected = formData.rogalikCharms.includes(charm.id);
              const outOfStock = isWarehouseOutOfStock(warehouseStock, charm.id, false);
              const atLimit = !isSelected && formData.rogalikCharms.length >= ROGALIK_MAX_CHARMS;
              const disabled = outOfStock || atLimit;
              return (
                <button
                  key={charm.id}
                  type="button"
                  data-uniform-font-cell
                  disabled={disabled}
                  onClick={() => onToggleCharm(charm.id)}
                  className={`rounded-none p-4 border flex flex-col items-center gap-2 transition-colors duration-300 ${
                    disabled
                      ? 'opacity-50 cursor-not-allowed border-[#D6C7AE] bg-white'
                      : isSelected
                        ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md cursor-pointer'
                        : 'border-[#D6C7AE] bg-white hover:border-[#C4A574] cursor-pointer'
                  }`}
                >
                  <div className={rogalikArtworkTileMediaClass}>
                    {charm.image ? (
                      <ConfiguratorTileFillImage src={charm.image} alt={charm.label} />
                    ) : (
                      <span className="text-[10px] text-[#9A9288] uppercase tracking-widest">Zdjęcie wkrótce</span>
                    )}
                  </div>
                  <ConfiguratorTileTitle text={charm.label} className="min-h-[2.4rem]" />
                  {outOfStock && (
                    <span className="text-xs text-[#7A736C]">Chwilowo niedostępny</span>
                  )}
                  {!outOfStock && (
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'
                      }`}
                    >
                      {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          </UniformTwoLineFontScope>
          <p className="text-xs text-[#7A736C]">
            Wybrano: {formData.rogalikCharms.length} / {ROGALIK_MAX_CHARMS}
          </p>
        </section>
      </div>
    );
  }

  if (step === 'kolor') {
    return (
      <div className="space-y-2">
        <section className={`${sectionClass} scroll-mt-28`} data-configurator-section="rogalik-color">
          <SectionTitle index={2}>Wybierz kolor rogalika</SectionTitle>
          <p className={subtitleClass}>Wybierz kolor, który najbardziej Ci odpowiada:</p>
          <OptionTiles
            options={ROGALIK_COLOR_OPTIONS}
            selectedId={formData.rogalikColor}
            onSelect={(id) => onChange({ rogalikColor: id })}
            columns={3}
          />
          {showErrors && !formData.rogalikColor && (
            <p className="text-sm text-red-500">Wybierz kolor rogalika.</p>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <section className={`${sectionClass} scroll-mt-28`} data-configurator-section="rogalik-mounting">
        <SectionTitle index={1}>Wybierz model</SectionTitle>
        <p className={subtitleClass}>Wybierz w jaki sposób adresówka będzie mocowana:</p>
        <div className="grid grid-cols-2 gap-4 md:gap-8">
          {ROGALIK_MOUNTING_OPTIONS.map((option) => {
            const disabled = option.comingSoon;
            const isSelected = !disabled && formData.rogalikMounting === option.id;
            const tileLabel = ROGALIK_MOUNTING_TILE_LABELS[option.id] ?? option.label;
            const imageSrc = ROGALIK_MOUNTING_TILE_IMAGES[option.id];
            const startPricePln = rogalikMountingStartPricePln(option.id, mountingStartPrices);

            return (
              <div
                key={option.id}
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-disabled={disabled}
                onClick={() => !disabled && onChange({ rogalikMounting: option.id })}
                onKeyDown={(event) => {
                  if (disabled) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onChange({ rogalikMounting: option.id });
                  }
                }}
                className={`rounded-none p-3 md:p-6 border transition-colors duration-300 flex flex-col items-stretch ${
                  disabled
                    ? 'border-[#E8E0D4] bg-[#F9F5ED] opacity-70 cursor-not-allowed'
                    : isSelected
                      ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md cursor-pointer'
                      : 'border-[#D6C7AE] bg-white hover:border-[#C4A574] cursor-pointer'
                }`}
              >
                <div className="relative w-full aspect-square bg-[#FAF6EF] mb-3 md:mb-4 overflow-hidden border border-[#D6C7AE]">
                  {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element -- statyczne JPG z public/
                    <img
                      src={imageSrc}
                      alt={tileLabel}
                      className="absolute inset-0 h-full w-full object-cover object-top select-none"
                      draggable={false}
                      decoding="async"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-widest text-[#9A9288]">
                      Zdjęcie wkrótce
                    </span>
                  )}
                  {startPricePln != null && (
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[#9AAD92] px-4 py-1.5 font-serif text-sm md:text-base text-white whitespace-nowrap shadow-sm">
                      {tagModelStartPriceLabel(startPricePln)}
                    </span>
                  )}
                </div>
                <p className="text-center text-xs md:text-sm font-medium text-[#161616] leading-snug px-1">
                  {tileLabel}
                </p>
                {option.comingSoon && (
                  <span className="text-center text-xs text-[#7A736C] font-light mt-1">już wkrótce</span>
                )}
                {!disabled && (
                  <div
                    className={`w-5 h-5 rounded-full border mt-3 self-center flex items-center justify-center transition-all ${
                      isSelected ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {showErrors && !formData.rogalikMounting && (
          <p className="text-sm text-red-500">Wybierz model.</p>
        )}
      </section>
    </div>
  );
}
