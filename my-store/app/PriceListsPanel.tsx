'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_ROGALIK_MOUNTING_BASE_PRICES,
  DEFAULT_ROGALIK_MOUNTING_START_PRICES,
  type RogalikMountingBasePrices,
  type RogalikMountingId,
  type RogalikMountingStartPrices,
} from '@/lib/rogalik-admin-pricing';
import { ROGALIK_MOUNTING_TILE_LABELS, ROGALIK_MOUNTING_OPTIONS } from '@/lib/rogalik-options';
import {
  getCharmUnitPrices,
  getChristmasBowBasePrices,
  getChristmasBowStartPrices,
  getRogalikMountingBasePrices,
  getRogalikMountingStartPrices,
  getTagModelBasePrices,
  getTagModelStartPrices,
  setCharmUnitPrices,
  setChristmasBowBasePrices,
  setChristmasBowStartPrices,
  setRogalikMountingBasePrices,
  setRogalikMountingStartPrices,
  setTagModelBasePrices,
  setTagModelStartPrices,
} from './actions/settings';
import { TAG_MODEL_OPTIONS } from '@/lib/catalog-options';
import {
  CHARM_PRICE_ADMIN_ROWS,
  CHARM_PRICE_ADMIN_SECTIONS,
  buildDefaultCharmUnitPrices,
  parseCharmUnitPricesDraft,
  type CharmUnitPrices,
} from '@/lib/charm-unit-pricing';
import {
  DEFAULT_TAG_MODEL_BASE_PRICES,
  DEFAULT_TAG_MODEL_START_PRICES,
  type TagModelId,
  type TagModelBasePrices,
  type TagModelStartPrices,
} from '@/lib/tag-model-pricing';

const parseTagModelPriceDraft = (
  draft: Record<TagModelId, string>,
): TagModelStartPrices | null => {
  const parsed: Partial<TagModelStartPrices> = {};
  for (const option of TAG_MODEL_OPTIONS) {
    const raw = draft[option.id].trim().replace(',', '.');
    if (raw === '') return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) return null;
    parsed[option.id] = Math.round(value * 100) / 100;
  }
  return parsed as TagModelStartPrices;
};

const parseRogalikMountingDraft = (
  draft: Record<RogalikMountingId, string>,
): RogalikMountingStartPrices | null => {
  const parsed: Partial<RogalikMountingStartPrices> = {};
  for (const id of Object.keys(DEFAULT_ROGALIK_MOUNTING_START_PRICES) as RogalikMountingId[]) {
    const raw = draft[id].trim().replace(',', '.');
    if (raw === '') return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) return null;
    parsed[id] = Math.round(value * 100) / 100;
  }
  return parsed as RogalikMountingStartPrices;
};

const parseRogalikMountingBaseDraft = (
  draft: Record<RogalikMountingId, string>,
): RogalikMountingBasePrices | null => {
  const parsed: Partial<RogalikMountingBasePrices> = {};
  for (const id of Object.keys(DEFAULT_ROGALIK_MOUNTING_BASE_PRICES) as RogalikMountingId[]) {
    const raw = draft[id].trim().replace(',', '.');
    if (raw === '') return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) return null;
    parsed[id] = Math.round(value * 100) / 100;
  }
  return parsed as RogalikMountingBasePrices;
};

const charmDraftFromPrices = (prices: CharmUnitPrices): Record<string, string> => {
  const draft: Record<string, string> = {};
  for (const row of CHARM_PRICE_ADMIN_ROWS) {
    draft[row.id] = String(prices[row.id] ?? buildDefaultCharmUnitPrices()[row.id] ?? '');
  }
  return draft;
};

const priceListTabs = [
  { id: 'tag-models' as const, label: 'Biżuteryjna' },
  { id: 'christmas-bow' as const, label: 'Kokardka' },
  { id: 'rogalik' as const, label: 'Rogalik' },
  { id: 'charms' as const, label: 'Charms' },
];

const CHARM_PRICE_DRAFT_STORAGE_KEY = 'pettagi-admin-charm-unit-prices-draft';

const readStoredCharmDraft = (): Record<string, string> | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CHARM_PRICE_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as Record<string, string>;
  } catch {
    return null;
  }
};

const writeStoredCharmDraft = (draft: Record<string, string>) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHARM_PRICE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // ignore quota / private mode
  }
};

const clearStoredCharmDraft = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CHARM_PRICE_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
};

export function PriceListsPanel() {
  const [activeTab, setActiveTab] = useState<(typeof priceListTabs)[number]['id']>('tag-models');
  const [tagDraft, setTagDraft] = useState<Record<TagModelId, string>>(() => {
    const initial: Partial<Record<TagModelId, string>> = {};
    for (const id of Object.keys(DEFAULT_TAG_MODEL_START_PRICES) as TagModelId[]) {
      initial[id] = String(DEFAULT_TAG_MODEL_START_PRICES[id]);
    }
    return initial as Record<TagModelId, string>;
  });
  const [tagBaseDraft, setTagBaseDraft] = useState<Record<TagModelId, string>>(() => {
    const initial: Partial<Record<TagModelId, string>> = {};
    for (const id of Object.keys(DEFAULT_TAG_MODEL_BASE_PRICES) as TagModelId[]) {
      initial[id] = String(DEFAULT_TAG_MODEL_BASE_PRICES[id]);
    }
    return initial as Record<TagModelId, string>;
  });
  const [charmDraft, setCharmDraft] = useState<Record<string, string>>(() =>
    charmDraftFromPrices(buildDefaultCharmUnitPrices()),
  );
  const [rogalikMountingDraft, setRogalikMountingDraft] = useState<
    Record<RogalikMountingId, string>
  >(() => {
    const initial: Partial<Record<RogalikMountingId, string>> = {};
    for (const id of Object.keys(DEFAULT_ROGALIK_MOUNTING_START_PRICES) as RogalikMountingId[]) {
      initial[id] = String(DEFAULT_ROGALIK_MOUNTING_START_PRICES[id]);
    }
    return initial as Record<RogalikMountingId, string>;
  });
  const [rogalikMountingBaseDraft, setRogalikMountingBaseDraft] = useState<
    Record<RogalikMountingId, string>
  >(() => {
    const initial: Partial<Record<RogalikMountingId, string>> = {};
    for (const id of Object.keys(DEFAULT_ROGALIK_MOUNTING_BASE_PRICES) as RogalikMountingId[]) {
      initial[id] = String(DEFAULT_ROGALIK_MOUNTING_BASE_PRICES[id]);
    }
    return initial as Record<RogalikMountingId, string>;
  });

  const [bowDraft, setBowDraft] = useState<Record<TagModelId, string>>(() => {
    const initial: Partial<Record<TagModelId, string>> = {};
    for (const id of Object.keys(DEFAULT_TAG_MODEL_START_PRICES) as TagModelId[]) {
      initial[id] = String(DEFAULT_TAG_MODEL_START_PRICES[id]);
    }
    return initial as Record<TagModelId, string>;
  });
  const [bowBaseDraft, setBowBaseDraft] = useState<Record<TagModelId, string>>(() => {
    const initial: Partial<Record<TagModelId, string>> = {};
    for (const id of Object.keys(DEFAULT_TAG_MODEL_BASE_PRICES) as TagModelId[]) {
      initial[id] = String(DEFAULT_TAG_MODEL_BASE_PRICES[id]);
    }
    return initial as Record<TagModelId, string>;
  });
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [isLoadingBow, setIsLoadingBow] = useState(true);
  const [isLoadingCharms, setIsLoadingCharms] = useState(true);
  const [isLoadingRogalik, setIsLoadingRogalik] = useState(true);
  const [isSavingTags, setIsSavingTags] = useState(false);
  const [isSavingBow, setIsSavingBow] = useState(false);
  const [isSavingCharms, setIsSavingCharms] = useState(false);
  const [isSavingRogalik, setIsSavingRogalik] = useState(false);
  const [tagError, setTagError] = useState('');
  const [bowError, setBowError] = useState('');
  const [charmError, setCharmError] = useState('');
  const [rogalikError, setRogalikError] = useState('');
  const [tagSavedMessage, setTagSavedMessage] = useState('');
  const [bowSavedMessage, setBowSavedMessage] = useState('');
  const [charmSavedMessage, setCharmSavedMessage] = useState('');
  const [rogalikSavedMessage, setRogalikSavedMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getTagModelStartPrices(), getTagModelBasePrices()]).then(
      ([startResult, baseResult]) => {
        if (cancelled) return;
        setIsLoadingTags(false);
        if (!startResult.ok) {
          setTagError(startResult.message);
        } else {
          const next: Partial<Record<TagModelId, string>> = {};
          for (const option of TAG_MODEL_OPTIONS) {
            next[option.id] = String(startResult.prices[option.id]);
          }
          setTagDraft(next as Record<TagModelId, string>);
        }
        if (!baseResult.ok) {
          setTagError((prev) => prev || baseResult.message);
        } else {
          const nextBase: Partial<Record<TagModelId, string>> = {};
          for (const option of TAG_MODEL_OPTIONS) {
            nextBase[option.id] = String(baseResult.prices[option.id]);
          }
          setTagBaseDraft(nextBase as Record<TagModelId, string>);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getChristmasBowStartPrices(), getChristmasBowBasePrices()]).then(
      ([startResult, baseResult]) => {
        if (cancelled) return;
        setIsLoadingBow(false);
        if (!startResult.ok) {
          setBowError(startResult.message);
        } else {
          const next: Partial<Record<TagModelId, string>> = {};
          for (const option of TAG_MODEL_OPTIONS) {
            next[option.id] = String(startResult.prices[option.id]);
          }
          setBowDraft(next as Record<TagModelId, string>);
        }
        if (!baseResult.ok) {
          setBowError((prev) => prev || baseResult.message);
        } else {
          const nextBase: Partial<Record<TagModelId, string>> = {};
          for (const option of TAG_MODEL_OPTIONS) {
            nextBase[option.id] = String(baseResult.prices[option.id]);
          }
          setBowBaseDraft(nextBase as Record<TagModelId, string>);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getCharmUnitPrices().then((result) => {
      if (cancelled) return;
      setIsLoadingCharms(false);
      if (result.ok) {
        setCharmDraft(charmDraftFromPrices(result.prices));
        return;
      }
      const stored = readStoredCharmDraft();
      if (stored) {
        setCharmDraft((current) => ({ ...current, ...stored }));
        setCharmError(`${result.message} Przywrócono niezapisany szkic z tej przeglądarki.`);
        return;
      }
      setCharmError(result.message);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isLoadingCharms) return;
    writeStoredCharmDraft(charmDraft);
  }, [charmDraft, isLoadingCharms]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getRogalikMountingStartPrices(), getRogalikMountingBasePrices()]).then(
      ([mountingResult, mountingBaseResult]) => {
        if (cancelled) return;
        setIsLoadingRogalik(false);
        if (!mountingResult.ok) {
          setRogalikError(mountingResult.message);
        } else {
          const next: Partial<Record<RogalikMountingId, string>> = {};
          for (const option of ROGALIK_MOUNTING_OPTIONS) {
            next[option.id as RogalikMountingId] = String(
              mountingResult.prices[option.id as RogalikMountingId],
            );
          }
          setRogalikMountingDraft(next as Record<RogalikMountingId, string>);
        }
        if (!mountingBaseResult.ok) {
          setRogalikError((prev) => prev || mountingBaseResult.message);
        } else {
          const nextBase: Partial<Record<RogalikMountingId, string>> = {};
          for (const option of ROGALIK_MOUNTING_OPTIONS) {
            nextBase[option.id as RogalikMountingId] = String(
              mountingBaseResult.prices[option.id as RogalikMountingId],
            );
          }
          setRogalikMountingBaseDraft(nextBase as Record<RogalikMountingId, string>);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const charmRowsBySection = useMemo(() => {
    const map = new Map<(typeof CHARM_PRICE_ADMIN_SECTIONS)[number], typeof CHARM_PRICE_ADMIN_ROWS>();
    for (const section of CHARM_PRICE_ADMIN_SECTIONS) {
      map.set(
        section,
        CHARM_PRICE_ADMIN_ROWS.filter((row) => row.section === section),
      );
    }
    return map;
  }, []);

  const handleSaveTags = async () => {
    setTagSavedMessage('');
    const startPrices = parseTagModelPriceDraft(tagDraft);
    const basePrices = parseTagModelPriceDraft(tagBaseDraft) as TagModelBasePrices | null;
    if (!startPrices || !basePrices) {
      setTagError('Podaj poprawne ceny (liczba ≥ 0) dla wszystkich modeli w obu sekcjach.');
      return;
    }
    setTagError('');
    setIsSavingTags(true);
    const [startResult, baseResult] = await Promise.all([
      setTagModelStartPrices(startPrices),
      setTagModelBasePrices(basePrices),
    ]);
    setIsSavingTags(false);
    if (!startResult.ok) {
      setTagError(startResult.message);
      return;
    }
    if (!baseResult.ok) {
      setTagError(baseResult.message);
      return;
    }
    const next: Partial<Record<TagModelId, string>> = {};
    const nextBase: Partial<Record<TagModelId, string>> = {};
    for (const option of TAG_MODEL_OPTIONS) {
      next[option.id] = String(startResult.prices[option.id]);
      nextBase[option.id] = String(baseResult.prices[option.id]);
    }
    setTagDraft(next as Record<TagModelId, string>);
    setTagBaseDraft(nextBase as Record<TagModelId, string>);
    setTagSavedMessage('Zapisano cennik modeli.');
  };

  const handleSaveBow = async () => {
    setBowSavedMessage('');
    const startPrices = parseTagModelPriceDraft(bowDraft);
    const basePrices = parseTagModelPriceDraft(bowBaseDraft) as TagModelBasePrices | null;
    if (!startPrices || !basePrices) {
      setBowError('Podaj poprawne ceny (liczba ≥ 0) dla wszystkich modeli w obu sekcjach.');
      return;
    }
    setBowError('');
    setIsSavingBow(true);
    const [startResult, baseResult] = await Promise.all([
      setChristmasBowStartPrices(startPrices),
      setChristmasBowBasePrices(basePrices),
    ]);
    setIsSavingBow(false);
    if (!startResult.ok) {
      setBowError(startResult.message);
      return;
    }
    if (!baseResult.ok) {
      setBowError(baseResult.message);
      return;
    }
    const next: Partial<Record<TagModelId, string>> = {};
    const nextBase: Partial<Record<TagModelId, string>> = {};
    for (const option of TAG_MODEL_OPTIONS) {
      next[option.id] = String(startResult.prices[option.id]);
      nextBase[option.id] = String(baseResult.prices[option.id]);
    }
    setBowDraft(next as Record<TagModelId, string>);
    setBowBaseDraft(nextBase as Record<TagModelId, string>);
    setBowSavedMessage('Zapisano cennik kokardki.');
  };

  const handleSaveRogalik = async () => {
    setRogalikSavedMessage('');
    const mountingPrices = parseRogalikMountingDraft(rogalikMountingDraft);
    const mountingBasePrices = parseRogalikMountingBaseDraft(rogalikMountingBaseDraft);
    if (!mountingPrices || !mountingBasePrices) {
      setRogalikError('Podaj poprawne ceny (liczba ≥ 0) dla wszystkich kafli i cen bazowych.');
      return;
    }
    setRogalikError('');
    setIsSavingRogalik(true);
    const [mountingResult, baseResult] = await Promise.all([
      setRogalikMountingStartPrices(mountingPrices),
      setRogalikMountingBasePrices(mountingBasePrices),
    ]);
    setIsSavingRogalik(false);
    if (!mountingResult.ok) {
      setRogalikError(mountingResult.message);
      return;
    }
    if (!baseResult.ok) {
      setRogalikError(baseResult.message);
      return;
    }
    const nextMounting: Partial<Record<RogalikMountingId, string>> = {};
    const nextMountingBase: Partial<Record<RogalikMountingId, string>> = {};
    for (const option of ROGALIK_MOUNTING_OPTIONS) {
      const id = option.id as RogalikMountingId;
      nextMounting[id] = String(mountingResult.prices[id]);
      nextMountingBase[id] = String(baseResult.prices[id]);
    }
    setRogalikMountingDraft(nextMounting as Record<RogalikMountingId, string>);
    setRogalikMountingBaseDraft(nextMountingBase as Record<RogalikMountingId, string>);
    setRogalikSavedMessage('Zapisano cennik rogalika.');
  };

  const handleSaveCharms = async () => {
    setCharmSavedMessage('');
    const prices = parseCharmUnitPricesDraft(charmDraft);
    if (!prices) {
      setCharmError('Podaj poprawne ceny (liczba ≥ 0) dla wszystkich charmsów.');
      return;
    }
    setCharmError('');
    setIsSavingCharms(true);
    const result = await setCharmUnitPrices(prices);
    setIsSavingCharms(false);
    if (!result.ok) {
      setCharmError(result.message);
      return;
    }
    setCharmDraft(charmDraftFromPrices(result.prices));
    clearStoredCharmDraft();
    setCharmSavedMessage('Zapisano ceny charmsów.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl md:text-4xl font-serif font-light text-[#161616]">Cenniki</h2>
        <p className="mt-2 text-sm text-[#7A736C] max-w-2xl">
          Ceny widoczne w konfiguratorze i podsumowaniach zamówień.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[#D6C7AE]">
        {priceListTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
              activeTab === tab.id
                ? 'text-[#161616] font-bold border-b-2 border-[#161616]'
                : 'text-[#7A736C] hover:text-[#161616]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'tag-models' ? (
        <section className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm text-[#7A736C] max-w-2xl">
              Ceny startowe na kaflach kroku <strong className="font-medium text-[#161616]">Model</strong>{' '}
              (format „od X zł”).
            </p>

            {isLoadingTags ? (
              <p className="text-sm text-[#7A736C]">Ładowanie…</p>
            ) : (
              <div className="border border-[#D6C7AE] bg-white divide-y divide-[#EBE4D6]">
                {TAG_MODEL_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 px-4 py-4 md:px-6"
                  >
                    <span className="text-sm text-[#161616] sm:flex-1">{option.label}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-xs uppercase tracking-wider text-[#9A9288]">od</span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        inputMode="decimal"
                        disabled={isSavingTags}
                        value={tagDraft[option.id]}
                        onChange={(event) => {
                          setTagDraft((current) => ({ ...current, [option.id]: event.target.value }));
                          setTagSavedMessage('');
                        }}
                        className="w-24 rounded-none border border-[#D6C7AE] bg-[#F9F5ED] px-3 py-2 text-sm text-[#161616] tabular-nums focus:outline-none focus:border-[#C4A574] disabled:opacity-60"
                      />
                      <span className="text-sm text-[#7A736C]">zł</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm text-[#7A736C] max-w-2xl">
              <strong className="font-medium text-[#161616]">Cena bazowa</strong> konfiguracji po wyborze
              modelu — punkt wyjścia w podsumowaniu, koszyku i zamówieniu (bez dopłat za dodatki). Może być
              inna niż cena „od” na kaflu.
            </p>

            {isLoadingTags ? null : (
              <div className="border border-[#D6C7AE] bg-white divide-y divide-[#EBE4D6]">
                {TAG_MODEL_OPTIONS.map((option) => (
                  <label
                    key={`base-${option.id}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 px-4 py-4 md:px-6"
                  >
                    <span className="text-sm text-[#161616] sm:flex-1">{option.label}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        inputMode="decimal"
                        disabled={isSavingTags}
                        value={tagBaseDraft[option.id]}
                        onChange={(event) => {
                          setTagBaseDraft((current) => ({
                            ...current,
                            [option.id]: event.target.value,
                          }));
                          setTagSavedMessage('');
                        }}
                        className="w-24 rounded-none border border-[#D6C7AE] bg-[#F9F5ED] px-3 py-2 text-sm text-[#161616] tabular-nums focus:outline-none focus:border-[#C4A574] disabled:opacity-60"
                      />
                      <span className="text-sm text-[#7A736C]">zł</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {tagError ? <p className="text-sm text-red-500">{tagError}</p> : null}
          {tagSavedMessage ? <p className="text-sm text-[#3A5A40]">{tagSavedMessage}</p> : null}

          <div>
            <button
              type="button"
              disabled={isLoadingTags || isSavingTags}
              onClick={() => void handleSaveTags()}
              className="px-6 py-2.5 rounded-none bg-[#3A5A40] text-[#F4EFE6] text-sm hover:bg-[#2E4833] transition-colors disabled:opacity-60"
            >
              {isSavingTags ? 'Zapisywanie…' : 'Zapisz cennik modeli'}
            </button>
          </div>
        </section>
      ) : activeTab === 'christmas-bow' ? (
        <section className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm text-[#7A736C] max-w-2xl">
              Ceny startowe na kaflach kroku <strong className="font-medium text-[#161616]">Model</strong>{' '}
              w konfiguratorze <strong className="font-medium text-[#161616]">Kokardki świątecznej</strong>{' '}
              (format „od X zł”). Nie zmieniają cennika adresówki biżuteryjnej.
            </p>
            {isLoadingBow ? (
              <p className="text-sm text-[#7A736C]">Ładowanie…</p>
            ) : (
              <div className="border border-[#D6C7AE] bg-white divide-y divide-[#EBE4D6]">
                {TAG_MODEL_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 px-4 py-4 md:px-6"
                  >
                    <span className="text-sm text-[#161616] sm:flex-1">{option.label}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-xs uppercase tracking-wider text-[#9A9288]">od</span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        inputMode="decimal"
                        disabled={isSavingBow}
                        value={bowDraft[option.id]}
                        onChange={(event) => {
                          setBowDraft((current) => ({ ...current, [option.id]: event.target.value }));
                          setBowSavedMessage('');
                        }}
                        className="w-24 rounded-none border border-[#D6C7AE] bg-[#F9F5ED] px-3 py-2 text-sm text-[#161616] tabular-nums focus:outline-none focus:border-[#C4A574] disabled:opacity-60"
                      />
                      <span className="text-sm text-[#7A736C]">zł</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <p className="text-sm text-[#7A736C] max-w-2xl">
              <strong className="font-medium text-[#161616]">Cena bazowa</strong> konfiguracji kokardki po
              wyborze modelu — punkt wyjścia w podsumowaniu, koszyku i zamówieniu (bez dopłat za dodatki).
            </p>
            {isLoadingBow ? null : (
              <div className="border border-[#D6C7AE] bg-white divide-y divide-[#EBE4D6]">
                {TAG_MODEL_OPTIONS.map((option) => (
                  <label
                    key={`bow-base-${option.id}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 px-4 py-4 md:px-6"
                  >
                    <span className="text-sm text-[#161616] sm:flex-1">{option.label}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        inputMode="decimal"
                        disabled={isSavingBow}
                        value={bowBaseDraft[option.id]}
                        onChange={(event) => {
                          setBowBaseDraft((current) => ({
                            ...current,
                            [option.id]: event.target.value,
                          }));
                          setBowSavedMessage('');
                        }}
                        className="w-24 rounded-none border border-[#D6C7AE] bg-[#F9F5ED] px-3 py-2 text-sm text-[#161616] tabular-nums focus:outline-none focus:border-[#C4A574] disabled:opacity-60"
                      />
                      <span className="text-sm text-[#7A736C]">zł</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {bowError ? <p className="text-sm text-red-500">{bowError}</p> : null}
          {bowSavedMessage ? <p className="text-sm text-[#3A5A40]">{bowSavedMessage}</p> : null}
          <div>
            <button
              type="button"
              disabled={isLoadingBow || isSavingBow}
              onClick={() => void handleSaveBow()}
              className="px-6 py-2.5 rounded-none bg-[#3A5A40] text-[#F4EFE6] text-sm hover:bg-[#2E4833] transition-colors disabled:opacity-60"
            >
              {isSavingBow ? 'Zapisywanie…' : 'Zapisz cennik kokardki'}
            </button>
          </div>
        </section>
      ) : activeTab === 'rogalik' ? (
        <section className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm text-[#7A736C] max-w-2xl">
              Ceny startowe na <strong className="font-medium text-[#161616]">kafelkach grafik</strong> mocowania
              rogalika w konfiguratorze (format „od X zł”).
            </p>

            {isLoadingRogalik ? (
              <p className="text-sm text-[#7A736C]">Ładowanie…</p>
            ) : (
              <div className="border border-[#D6C7AE] bg-white divide-y divide-[#EBE4D6]">
                {ROGALIK_MOUNTING_OPTIONS.map((option) => {
                  const id = option.id as RogalikMountingId;
                  const tileLabel = ROGALIK_MOUNTING_TILE_LABELS[id] ?? option.label;
                  return (
                    <label
                      key={id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 px-4 py-4 md:px-6"
                    >
                      <span className="text-sm text-[#161616] sm:flex-1">{tileLabel}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-xs uppercase tracking-wider text-[#9A9288]">od</span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          inputMode="decimal"
                          disabled={isSavingRogalik}
                          value={rogalikMountingDraft[id]}
                          onChange={(event) => {
                            setRogalikMountingDraft((current) => ({
                              ...current,
                              [id]: event.target.value,
                            }));
                            setRogalikSavedMessage('');
                          }}
                          className="w-24 rounded-none border border-[#D6C7AE] bg-[#F9F5ED] px-3 py-2 text-sm text-[#161616] tabular-nums focus:outline-none focus:border-[#C4A574] disabled:opacity-60"
                        />
                        <span className="text-sm text-[#7A736C]">zł</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm text-[#7A736C] max-w-2xl">
              <strong className="font-medium text-[#161616]">Cena bazowa</strong> konfiguracji po wyborze
              modelu — punkt wyjścia w podsumowaniu, koszyku i zamówieniu (bez dopłat za dodatki). Może być inna niż
              cena „od” na kaflu.
            </p>

            {isLoadingRogalik ? null : (
              <div className="border border-[#D6C7AE] bg-white divide-y divide-[#EBE4D6]">
                {ROGALIK_MOUNTING_OPTIONS.map((option) => {
                  const id = option.id as RogalikMountingId;
                  const tileLabel = ROGALIK_MOUNTING_TILE_LABELS[id] ?? option.label;
                  return (
                    <label
                      key={`base-${id}`}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 px-4 py-4 md:px-6"
                    >
                      <span className="text-sm text-[#161616] sm:flex-1">{tileLabel}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          inputMode="decimal"
                          disabled={isSavingRogalik}
                          value={rogalikMountingBaseDraft[id]}
                          onChange={(event) => {
                            setRogalikMountingBaseDraft((current) => ({
                              ...current,
                              [id]: event.target.value,
                            }));
                            setRogalikSavedMessage('');
                          }}
                          className="w-24 rounded-none border border-[#D6C7AE] bg-[#F9F5ED] px-3 py-2 text-sm text-[#161616] tabular-nums focus:outline-none focus:border-[#C4A574] disabled:opacity-60"
                        />
                        <span className="text-sm text-[#7A736C]">zł</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {rogalikError ? <p className="text-sm text-red-500">{rogalikError}</p> : null}
          {rogalikSavedMessage ? <p className="text-sm text-[#3A5A40]">{rogalikSavedMessage}</p> : null}

          <div>
            <button
              type="button"
              disabled={isLoadingRogalik || isSavingRogalik}
              onClick={() => void handleSaveRogalik()}
              className="px-6 py-2.5 rounded-none bg-[#3A5A40] text-[#F4EFE6] text-sm hover:bg-[#2E4833] transition-colors disabled:opacity-60"
            >
              {isSavingRogalik ? 'Zapisywanie…' : 'Zapisz cennik rogalika'}
            </button>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <p className="text-sm text-[#7A736C] max-w-2xl">
            Cena za sztukę w konfiguratorze (adresówka biżuteryjna, glow i rogalik). Sekcje odpowiadają
            układowi w konfiguratorze.
          </p>

          {isLoadingCharms ? (
            <p className="text-sm text-[#7A736C]">Ładowanie…</p>
          ) : (
            <div className="border border-[#D6C7AE] bg-white divide-y divide-[#EBE4D6]">
              {CHARM_PRICE_ADMIN_SECTIONS.map((section) => {
                const rows = charmRowsBySection.get(section) ?? [];
                if (rows.length === 0) return null;
                return (
                  <div key={section}>
                    <div className="px-4 py-3 md:px-6 bg-section-header border-b border-[#2E4833]">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#F4EFE6]">{section}</p>
                    </div>
                    {rows.map((row) => (
                      <label
                        key={row.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 px-4 py-3 md:px-6 border-b border-[#EBE4D6] last:border-b-0"
                      >
                        <span className="text-sm text-[#161616] sm:flex-1">{row.label}</span>
                        <span className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            inputMode="decimal"
                            disabled={isSavingCharms}
                            value={charmDraft[row.id] ?? ''}
                            onChange={(event) => {
                              setCharmDraft((current) => ({
                                ...current,
                                [row.id]: event.target.value,
                              }));
                              setCharmSavedMessage('');
                            }}
                            className="w-24 rounded-none border border-[#D6C7AE] bg-[#F9F5ED] px-3 py-2 text-sm text-[#161616] tabular-nums focus:outline-none focus:border-[#C4A574] disabled:opacity-60"
                          />
                          <span className="text-sm text-[#7A736C]">zł / szt.</span>
                        </span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {charmError ? <p className="text-sm text-red-500">{charmError}</p> : null}
          {charmSavedMessage ? <p className="text-sm text-[#3A5A40]">{charmSavedMessage}</p> : null}

          <div>
            <button
              type="button"
              disabled={isLoadingCharms || isSavingCharms}
              onClick={() => void handleSaveCharms()}
              className="px-6 py-2.5 rounded-none bg-[#3A5A40] text-[#F4EFE6] text-sm hover:bg-[#2E4833] transition-colors disabled:opacity-60"
            >
              {isSavingCharms ? 'Zapisywanie…' : 'Zapisz ceny charmsów'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
