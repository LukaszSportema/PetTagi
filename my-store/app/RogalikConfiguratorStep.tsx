'use client';

import type { ReactNode } from 'react';
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
} from '@/lib/rogalik-options';

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
  /** Sekcje sznurek / koraliki / charms — tylko przy mocowaniu „Z koralikami”. */
  showBeadMountSections: boolean;
};

const sectionClass = 'space-y-4 pt-8 border-t border-[#D6C7AE] first:border-t-0 first:pt-0';
const subtitleClass = 'text-sm text-[#7A736C] font-light';
const titleClass = 'font-bold text-base text-[#161616]';

function SectionTitle({ index, children }: { index: number; children: ReactNode }) {
  return (
    <p className={titleClass}>
      {index}. {children}
    </p>
  );
}

function OptionTiles({
  options,
  selectedId,
  onSelect,
  columns = 2,
  variant = 'image',
}: {
  options: typeof ROGALIK_COLOR_OPTIONS;
  selectedId: string;
  onSelect: (id: string) => void;
  columns?: 2 | 3 | 4;
  variant?: 'image' | 'text';
}) {
  const gridClass =
    columns === 3
      ? 'grid grid-cols-1 sm:grid-cols-3 gap-4'
      : columns === 4
        ? 'grid grid-cols-2 md:grid-cols-4 gap-4'
        : 'grid grid-cols-1 sm:grid-cols-2 gap-4';

  return (
    <div className={gridClass}>
      {options.map((option) => {
        const disabled = option.comingSoon;
        const isSelected = !disabled && selectedId === option.id;
        return (
          <button
            key={option.id}
            type="button"
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
              <div className="w-full aspect-square bg-[#EFE8DC] border border-[#D6C7AE] overflow-hidden flex items-center justify-center">
                {option.image ? (
                  <img src={option.image} alt={option.label} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] uppercase tracking-widest text-[#9A9288]">Zdjęcie wkrótce</span>
                )}
              </div>
            )}
            <span className="text-base font-medium text-[#161616]">{option.label}</span>
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
  );
}

export function RogalikConfiguratorStep({
  formData,
  onChange,
  onToggleCharm,
  showErrors,
  stringSizeText,
  showBeadMountSections,
}: Props) {
  return (
    <div className="space-y-2">
      <section className={sectionClass}>
        <SectionTitle index={1}>Wybierz kolor rogalika</SectionTitle>
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

      <section className={sectionClass}>
        <SectionTitle index={2}>Wybierz sposób mocowania</SectionTitle>
        <p className={subtitleClass}>Wybierz w jaki sposób adresówka będzie mocowana:</p>
        <OptionTiles
          options={ROGALIK_MOUNTING_OPTIONS}
          selectedId={formData.rogalikMounting}
          onSelect={(id) => onChange({ rogalikMounting: id })}
          columns={2}
          variant="text"
        />
        {showErrors && !formData.rogalikMounting && (
          <p className="text-sm text-red-500">Wybierz sposób mocowania.</p>
        )}
      </section>

      {showBeadMountSections && (
      <section className={sectionClass}>
        <SectionTitle index={3}>Podaj obwód szyi</SectionTitle>
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
      )}

      {showBeadMountSections && (
      <section className={sectionClass}>
        <SectionTitle index={4}>Wybierz kolor sznureczka</SectionTitle>
        <OptionTiles
          options={ROGALIK_CORD_COLOR_OPTIONS}
          selectedId={formData.rogalikCordColor}
          onSelect={(id) => onChange({ rogalikCordColor: id })}
          columns={3}
        />
        {showErrors && !formData.rogalikCordColor && (
          <p className="text-sm text-red-500">Wybierz kolor sznureczka.</p>
        )}
      </section>
      )}

      {showBeadMountSections && (
      <section className={sectionClass}>
        <SectionTitle index={5}>Wybierz koraliki</SectionTitle>
        <p className={subtitleClass}>Wybierz interesujący Cię wariant:</p>
        <OptionTiles
          options={ROGALIK_BEADS_OPTIONS}
          selectedId={formData.rogalikBeads}
          onSelect={(id) => onChange({ rogalikBeads: id })}
          columns={3}
        />
        {showErrors && !formData.rogalikBeads && (
          <p className="text-sm text-red-500">Wybierz wariant koralików.</p>
        )}
      </section>
      )}

      {showBeadMountSections && (
      <section className={sectionClass}>
        <SectionTitle index={6}>Dodaj charmsy</SectionTitle>
        <p className={subtitleClass}>
          Możesz dodać do {ROGALIK_MAX_CHARMS} charmsów i stworzyć własną, wyjątkową adresówkę
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {ROGALIK_CHARM_OPTIONS.map((charm) => {
            const isSelected = formData.rogalikCharms.includes(charm.id);
            const atLimit = !isSelected && formData.rogalikCharms.length >= ROGALIK_MAX_CHARMS;
            return (
              <button
                key={charm.id}
                type="button"
                disabled={atLimit}
                onClick={() => onToggleCharm(charm.id)}
                className={`rounded-none p-4 border flex flex-col items-center gap-2 transition-colors duration-300 ${
                  atLimit
                    ? 'opacity-40 cursor-not-allowed border-[#D6C7AE] bg-white'
                    : isSelected
                      ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md cursor-pointer'
                      : 'border-[#D6C7AE] bg-white hover:border-[#C4A574] cursor-pointer'
                }`}
              >
                <div className="w-full aspect-square bg-[#EFE8DC] border border-[#D6C7AE] overflow-hidden flex items-center justify-center">
                  {charm.image ? (
                    <img src={charm.image} alt={charm.label} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-[#9A9288] uppercase tracking-widest">Zdjęcie wkrótce</span>
                  )}
                </div>
                <span className="text-sm font-medium text-[#161616]">{charm.label}</span>
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    isSelected ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'
                  }`}
                >
                  {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[#7A736C]">
          Wybrano: {formData.rogalikCharms.length} / {ROGALIK_MAX_CHARMS}
        </p>
      </section>
      )}
    </div>
  );
}
