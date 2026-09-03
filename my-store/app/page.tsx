'use client';

import { useEffect, useLayoutEffect, useRef, useState, type TouchEvent } from 'react';
import { expressFulfillmentRangeLabel, standardFulfillmentRangeLabel } from '@/lib/fulfillment-dates';
import { createOrder } from './actions/orders';
import AdminPanel from './AdminPanel';
import FurgonetkaMap from './FurgonetkaMap';
import { fulfillmentMessage, PAYMENT_RECIPIENTS, type PaymentRecipientId } from '@/lib/payment';
import {
  CATALOG_PRODUCTS,
  CLASSIC_TAG_PRODUCT,
  GLOW_TAG_PRODUCT,
  getCatalogProduct,
  productLineTitle,
  type CatalogMedia,
} from '@/lib/catalog';
import {
  baseTagPrice,
  classicStringUnitPrice,
  EXTRA_CHARM_PRICE,
  EXTRA_KARABINER_PRICE,
  glowStringUnitPrice,
  NECK_CIRCUMFERENCE_MAX,
  NECK_CIRCUMFERENCE_MIN,
  premiumStringUnitPrice,
  STICKER_PRICE,
  DIAL_CODE_PRICE,
  qualifiesForFreeShipping,
  SHIPPING_KURIER_PRICE,
  SHIPPING_PACZKOMAT_PRICE,
  shippingCostForOrder,
  STOPPER_PRICE,
  stringSizeFromNeckCm,
  stringSizeLabel,
} from '@/lib/pricing';
import { CLASSIC_STRING_CATALOG, CHARM_BESTSELLERS, CHARM_CATALOG, CHARM_LARGE_CATALOG, CHARM_MOUNTING_OPTIONS, CHARM_SILVER_CATALOG, charmMountingTileLabel, FLOWER_BASE_CATALOG, GLOW_BASE_CATALOG, GLOW_STRING_CATALOG, GLOW_TEXT_OPTIONS, GOLD_BASE_CATALOG, KARABINER_CATALOG, PREMIUM_STRING_CATALOG, SILVER_BASE_CATALOG, stopperSelectionLabel, type CharmMountingId } from '@/lib/catalog-options';

type FormDataState = {
  ringColor: string;
  glowTextColor: string;
  baseOption: string;
  charmOption: string;
  charmMounting: CharmMountingId;
  wantExtraCharms: string;
  extraCharms: string[];
  extraCharmMountings: Record<string, CharmMountingId>;
  karabinerOption: string;
  wantExtraKarabiners: string;
  extraKarabiners: string[];
  wantString: string;
  stringLength: string;
  premiumStrings: string[];
  classicStrings: string[];
  glowStrings: string[];
  wantStopers: string;
  extraStopers: string[];
  wantSticker: string;
  stickerOption: string;
  accessoryType: string;
  petName: string;
  nameLayout: 'imie6' | 'imie6plus';
  phoneCode: string;
  phoneNumber: string;
  includePhoneCode: string;
};

type CartItem = {
  id: string;
  productSlug: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
  options: { label: string; values: string[] }[];
  config: FormDataState;
};

type ConfiguratorBaseOption = {
  id: string;
  title: string;
  image: string;
  images?: string[];
  details?: { label: string; value: string }[];
};

type CheckoutData = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  fastDelivery: boolean;
  shippingMethod: string;
  pickupPointName: string;
  pickupPointAddress: string;
  acceptTerms: boolean;
};

const initialCheckoutData: CheckoutData = {
  firstName: '',
  lastName: '',
  email: '',
  phoneCode: '+48',
  phone: '',
  street: '',
  postalCode: '',
  city: '',
  fastDelivery: false,
  shippingMethod: '',
  pickupPointName: '',
  pickupPointAddress: '',
  acceptTerms: false,
};

const FAST_DELIVERY_COST = 15;

const shippingOptions = [
  { id: 'paczkomat', title: 'Paczkomat 24/7', price: SHIPPING_PACZKOMAT_PRICE, image: '/inpost-paczkomat.svg' },
  { id: 'kurier', title: 'Kurier', price: SHIPPING_KURIER_PRICE, image: '/inpost-kurier.svg' },
];

const initialFormData: FormDataState = {
  ringColor: 'złoty',
  glowTextColor: 'zloty',
  baseOption: '1',
  charmOption: 'kostkabiala',
  charmMounting: 'oddzielne',
  wantExtraCharms: 'tak',
  extraCharms: [],
  extraCharmMountings: {},
  karabinerOption: 'klasyczny',
  wantExtraKarabiners: 'tak',
  extraKarabiners: [],
  wantString: 'tak',
  stringLength: '',
  premiumStrings: [],
  classicStrings: [],
  glowStrings: [],
  wantStopers: 'tak',
  extraStopers: [],
  wantSticker: 'tak',
  stickerOption: '',
  accessoryType: 'szelki',
  petName: '',
  nameLayout: 'imie6',
  phoneCode: '+48',
  phoneNumber: '',
  includePhoneCode: 'nie',
};

const formDataForProduct = (slug: string): FormDataState => {
  if (slug === GLOW_TAG_PRODUCT.slug) {
    return { ...initialFormData, ringColor: 'glow', baseOption: 'glow1', glowTextColor: 'zloty', wantSticker: 'nie', stickerOption: '' };
  }
  return initialFormData;
};

type PlacedOrder = {
  orderId: string;
  total: number;
  fastDelivery: boolean;
  paymentRecipient: PaymentRecipientId;
};

const formatPrice = (value: number) => `${value.toFixed(2).replace('.', ',')} zł`;

function ImageGallery({
  items,
  alt,
  stopPropagation = false,
}: {
  items: string[];
  alt: string;
  stopPropagation?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const current = items[index] ?? items[0];
  const canBrowse = items.length > 1;

  const goTo = (next: number, event?: React.MouseEvent | React.TouchEvent) => {
    if (stopPropagation) event?.stopPropagation();
    if (!items.length) return;
    setIndex((next + items.length) % items.length);
  };

  const onTouchStart = (event: TouchEvent) => {
    if (stopPropagation) event.stopPropagation();
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (stopPropagation) event.stopPropagation();
    if (touchStartX.current == null || !canBrowse) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    goTo(index + (delta < 0 ? 1 : -1));
  };

  return (
    <div
      className="relative w-full aspect-[4/5] bg-[#EFE8DC] border border-[#D6C7AE] overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {current ? (
        <img src={current} alt={alt} className="w-full h-full object-cover" />
      ) : null}

      {canBrowse && (
        <>
          <button
            type="button"
            onClick={(event) => goTo(index - 1, event)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#F4EFE6]/90 border border-[#D6C7AE] text-[#161616] text-lg leading-none hover:bg-white transition-colors"
            aria-label="Poprzednie zdjęcie"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(event) => goTo(index + 1, event)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#F4EFE6]/90 border border-[#D6C7AE] text-[#161616] text-lg leading-none hover:bg-white transition-colors"
            aria-label="Następne zdjęcie"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {items.map((item, itemIndex) => (
              <button
                key={`${item}-${itemIndex}`}
                type="button"
                onClick={(event) => goTo(itemIndex, event)}
                className={`h-1.5 rounded-full transition-all ${
                  itemIndex === index ? 'w-5 bg-[#161616]' : 'w-1.5 bg-[#161616]/35'
                }`}
                aria-label={`Slajd ${itemIndex + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ProductGallery({ items, alt }: { items: CatalogMedia[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const current = items[index] ?? items[0];
  const canBrowse = items.length > 1;

  const goTo = (next: number) => {
    if (!items.length) return;
    setIndex((next + items.length) % items.length);
  };

  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (touchStartX.current == null || !canBrowse) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    goTo(index + (delta < 0 ? 1 : -1));
  };

  if (current?.type === 'image' && items.every((item) => item.type === 'image')) {
    return <ImageGallery items={items.map((item) => item.src)} alt={alt} />;
  }

  return (
    <div
      className="relative w-full aspect-[4/5] bg-[#EFE8DC] border border-[#D6C7AE] overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {current?.type === 'video' ? (
        <video
          key={current.src}
          src={current.src}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          controls={false}
        />
      ) : current ? (
        <img src={current.src} alt={alt} className="w-full h-full object-cover" />
      ) : null}

      {canBrowse && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#F4EFE6]/90 border border-[#D6C7AE] text-[#161616] text-lg leading-none hover:bg-white transition-colors"
            aria-label="Poprzednie zdjęcie"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#F4EFE6]/90 border border-[#D6C7AE] text-[#161616] text-lg leading-none hover:bg-white transition-colors"
            aria-label="Następne zdjęcie"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {items.map((item, itemIndex) => (
              <button
                key={`${item.src}-${itemIndex}`}
                type="button"
                onClick={() => goTo(itemIndex)}
                className={`h-1.5 rounded-full transition-all ${
                  itemIndex === index ? 'w-5 bg-[#161616]' : 'w-1.5 bg-[#161616]/35'
                }`}
                aria-label={`Slajd ${itemIndex + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('products');
  const [activeProductSlug, setActiveProductSlug] = useState(CLASSIC_TAG_PRODUCT.slug);
  const [currentStep, setCurrentStep] = useState(1);
  const topStackRef = useRef<HTMLDivElement>(null);
  const stepsScrollRef = useRef<HTMLDivElement>(null);
  const [topStackHeight, setTopStackHeight] = useState(40);
  const [formData, setFormData] = useState<FormDataState>(initialFormData);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState('');
  const [showAddedToCart, setShowAddedToCart] = useState(false);
  const [charmMountingTarget, setCharmMountingTarget] = useState<{ type: 'free' | 'extra'; charmId: string } | null>(null);
  const [showRemovedFromCart, setShowRemovedFromCart] = useState(false);
  const removedFromCartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>(initialCheckoutData);
  const [showCheckoutErrors, setShowCheckoutErrors] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [checkoutSubmitError, setCheckoutSubmitError] = useState('');

  const activeProduct = getCatalogProduct(activeProductSlug) ?? CLASSIC_TAG_PRODUCT;
  const isClassicTagConfigurator = activeProduct.configuratorId === 'classic-tag';
  const isGlowTagConfigurator = activeProduct.configuratorId === 'glow-tag';

  // --- LOGIKA OBLICZANIA CENY ---
  const basePrice = baseTagPrice(isGlowTagConfigurator ? 'glow' : formData.ringColor);
  const extraCharmsCost = formData.wantExtraCharms === 'tak' ? formData.extraCharms.length * EXTRA_CHARM_PRICE : 0;
  const extraKarabinersCost = formData.wantExtraKarabiners === 'tak' ? formData.extraKarabiners.length * EXTRA_KARABINER_PRICE : 0;
  const extraStopersCost = formData.wantStopers === 'tak' ? formData.extraStopers.length * STOPPER_PRICE : 0;
  const stickerCost = activeProductSlug === GLOW_TAG_PRODUCT.slug
    ? 0
    : formData.wantSticker === 'tak' && formData.stickerOption ? STICKER_PRICE : 0;
  const dialCodeCost = formData.includePhoneCode === 'tak' ? DIAL_CODE_PRICE : 0;
  
  const stringSize = stringSizeFromNeckCm(formData.stringLength);
  const stringSizeText = stringSizeLabel(stringSize);
  const premiumStringPrice = premiumStringUnitPrice(stringSize);
  const classicStringPrice = classicStringUnitPrice(stringSize);
  const glowStringPrice = glowStringUnitPrice(stringSize);
  const premiumStringsCost = formData.wantString === 'tak' && premiumStringPrice
    ? formData.premiumStrings.length * premiumStringPrice
    : 0;
  const classicStringsCost = formData.wantString === 'tak' && classicStringPrice
    ? formData.classicStrings.length * classicStringPrice
    : 0;
  const glowStringsCost = formData.wantString === 'tak' && glowStringPrice
    ? formData.glowStrings.length * glowStringPrice
    : 0;

  const totalPrice = basePrice + extraCharmsCost + extraKarabinersCost + extraStopersCost + stickerCost + premiumStringsCost + classicStringsCost + glowStringsCost + dialCodeCost;

  const countSelectedStrings = (data: Pick<FormDataState, 'wantString' | 'premiumStrings' | 'classicStrings' | 'glowStrings'>) =>
    data.wantString === 'tak'
      ? data.premiumStrings.length + data.classicStrings.length + data.glowStrings.length
      : 0;

  const trimStopersToStringCount = (data: FormDataState): FormDataState => {
    const max = countSelectedStrings(data);
    if (data.extraStopers.length <= max) return data;
    return { ...data, extraStopers: data.extraStopers.slice(0, max) };
  };

  const selectedStringsCount = countSelectedStrings(formData);
  const stringSelectionSummaryParts = [
    formData.premiumStrings.length > 0 ? `Premium ×${formData.premiumStrings.length}` : null,
    formData.classicStrings.length > 0 ? `Klasyczny ×${formData.classicStrings.length}` : null,
    formData.glowStrings.length > 0 ? `Glow ×${formData.glowStrings.length}` : null,
  ].filter(Boolean) as string[];
  const stopperSelectionRequired = formData.wantStopers === 'tak' && selectedStringsCount > 0;
  const isStopperSelectionComplete =
    !stopperSelectionRequired || formData.extraStopers.length === selectedStringsCount;

  const goToTab = (tab: string) => {
    setActiveTab(tab);
  };
  const isTagConfigurator = isClassicTagConfigurator || isGlowTagConfigurator;

  const allStepsInfo = [
    { id: 1, label: 'Oprawa', icon: '💍', thumbnail: '/miniatury/oprawa.jpg' },
    { id: 2, label: 'Baza', icon: '🎨', thumbnail: '/miniatury/baza.jpg' },
    { id: 12, label: 'NAPIS', shortLabel: 'NAPIS', icon: '✨' },
    { id: 3, label: 'Darmowy charms', icon: '🦮', thumbnail: '/miniatury/darmowycharms.jpg' },
    { id: 4, label: 'Dodatkowe charmsy. Stwórz wyjątkową kompozycję!', shortLabel: 'Dodatkowe charmsy', icon: '🪝', thumbnail: '/miniatury/dodatkowycharms.jpg' },
    { id: 5, label: 'Darmowy karabińczyk', icon: '✍️', thumbnail: '/miniatury/darmowykarabinczyk.jpg' },
    { id: 6, label: 'Dodatkowe karabińczyki. Wygoda na codzień!', shortLabel: 'Dodatkowe karabińczyki', icon: '✨', thumbnail: '/miniatury/dodatkowykarabinczyk.jpg' },
    { id: 7, label: 'Sznurek. Stwórz gotowy zestaw!', shortLabel: 'Sznurek', icon: '📏', thumbnail: '/miniatury/sznurek.jpg' },
    { id: 8, label: 'Stopery. Idealne dopasowanie!', shortLabel: 'Stopery', icon: '🧵', thumbnail: '/miniatury/stopery.jpg' },
    { id: 9, label: 'Dodaj pieska', shortLabel: 'GRAFIKA', icon: '🏷️', thumbnail: '/miniatury/naklejka.jpg' },
    { id: 10, label: 'Dane na adresówce', icon: '📝', thumbnail: '/miniatury/danenaadresowce.jpg' },
    { id: 11, label: 'Podsumowanie zamówienia', icon: '🛒', thumbnail: '/miniatury/koszyk.jpg' },
  ];
  const skippedStepIds = isGlowTagConfigurator ? [1, 9] : [12];
  const visibleClassicSteps = allStepsInfo.filter((step) => !skippedStepIds.includes(step.id));
  const stepsInfo = visibleClassicSteps.map((step, index) => {
    const normalizedStep = { ...step, id: index + 1 };
    if (isGlowTagConfigurator && step.id === 2) {
      return { ...normalizedStep, label: 'Kolor' };
    }
    return normalizedStep;
  });
  const totalSteps = stepsInfo.length;
  const contentStep = visibleClassicSteps[currentStep - 1]?.id ?? currentStep;

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const openConfigurator = (slug: string = CLASSIC_TAG_PRODUCT.slug) => {
    const product = getCatalogProduct(slug) ?? CLASSIC_TAG_PRODUCT;
    if (product.slug !== activeProductSlug) {
      setFormData(formDataForProduct(product.slug));
      setCurrentStep(1);
      setShowAddedToCart(false);
    }
    setActiveProductSlug(product.slug);
    goToTab('configurator');
  };

  const imageGridClass = (count: number) => {
    if (count <= 1) return 'grid grid-cols-1 gap-5 md:gap-14';
    if (count === 3) return 'grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-14';
    return 'grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-14';
  };

  const countryCodes = [
    { code: '+48', label: 'Polska (+48)' },
    { code: '+49', label: 'Niemcy (+49)' },
    { code: '+420', label: 'Czechy (+420)' },
    { code: '+421', label: 'Słowacja (+421)' },
    { code: '+380', label: 'Ukraina (+380)' },
    { code: '+43', label: 'Austria (+43)' },
    { code: '+36', label: 'Węgry (+36)' },
    { code: '+370', label: 'Litwa (+370)' },
    { code: '+371', label: 'Łotwa (+371)' },
    { code: '+372', label: 'Estonia (+372)' },
    { code: '+44', label: 'Wielka Brytania (+44)' },
    { code: '+353', label: 'Irlandia (+353)' },
    { code: '+33', label: 'Francja (+33)' },
    { code: '+39', label: 'Włochy (+39)' },
    { code: '+34', label: 'Hiszpania (+34)' },
    { code: '+31', label: 'Holandia (+31)' },
    { code: '+32', label: 'Belgia (+32)' },
    { code: '+41', label: 'Szwajcaria (+41)' },
    { code: '+46', label: 'Szwecja (+46)' },
    { code: '+47', label: 'Norwegia (+47)' },
    { code: '+45', label: 'Dania (+45)' },
    { code: '+358', label: 'Finlandia (+358)' },
    { code: '+1', label: 'USA / Kanada (+1)' },
  ];

  const isLettersOnly = (value: string) => /^[\p{L}\s-]*$/u.test(value);
  const isDigitsOnly = (value: string) => /^\d*$/.test(value);

  const phoneFormatByCode: Record<string, { groups: number[]; separator: string }> = {
    '+48': { groups: [3, 3, 3], separator: ' ' },
    '+49': { groups: [3, 4, 4], separator: ' ' },
    '+420': { groups: [3, 3, 3], separator: ' ' },
    '+421': { groups: [3, 3, 3], separator: ' ' },
    '+380': { groups: [2, 3, 2, 2], separator: ' ' },
    '+43': { groups: [3, 3, 4], separator: ' ' },
    '+36': { groups: [2, 3, 4], separator: ' ' },
    '+370': { groups: [3, 2, 3], separator: ' ' },
    '+371': { groups: [2, 3, 3], separator: ' ' },
    '+372': { groups: [4, 4], separator: ' ' },
    '+44': { groups: [4, 3, 3], separator: ' ' },
    '+353': { groups: [2, 3, 4], separator: ' ' },
    '+33': { groups: [1, 2, 2, 2, 2], separator: ' ' },
    '+39': { groups: [3, 3, 4], separator: ' ' },
    '+34': { groups: [3, 2, 2, 2], separator: ' ' },
    '+31': { groups: [1, 4, 4], separator: ' ' },
    '+32': { groups: [3, 2, 2, 2], separator: ' ' },
    '+41': { groups: [2, 3, 2, 2], separator: ' ' },
    '+46': { groups: [2, 3, 2, 2], separator: ' ' },
    '+47': { groups: [3, 2, 3], separator: ' ' },
    '+45': { groups: [2, 2, 2, 2], separator: ' ' },
    '+358': { groups: [2, 3, 4], separator: ' ' },
    '+1': { groups: [3, 3, 4], separator: '-' },
  };

  const formatPhoneGroups = (digits: string, code = '+48') => {
    const format = phoneFormatByCode[code] ?? { groups: [3, 3, 3], separator: ' ' };
    const parts: string[] = [];
    let index = 0;
    for (const size of format.groups) {
      if (index >= digits.length) break;
      parts.push(digits.slice(index, index + size));
      index += size;
    }
    if (index < digits.length) parts.push(digits.slice(index));
    return parts.filter(Boolean).join(format.separator);
  };

  const phoneLengthByCode: Record<string, { min: number; max: number }> = {
    '+48': { min: 9, max: 9 },
    '+49': { min: 10, max: 12 },
    '+420': { min: 9, max: 9 },
    '+421': { min: 9, max: 9 },
    '+380': { min: 9, max: 9 },
    '+43': { min: 10, max: 13 },
    '+36': { min: 8, max: 9 },
    '+370': { min: 8, max: 8 },
    '+371': { min: 8, max: 8 },
    '+372': { min: 7, max: 8 },
    '+44': { min: 10, max: 10 },
    '+353': { min: 9, max: 9 },
    '+33': { min: 9, max: 9 },
    '+39': { min: 9, max: 10 },
    '+34': { min: 9, max: 9 },
    '+31': { min: 9, max: 9 },
    '+32': { min: 8, max: 9 },
    '+41': { min: 9, max: 9 },
    '+46': { min: 7, max: 10 },
    '+47': { min: 8, max: 8 },
    '+45': { min: 8, max: 8 },
    '+358': { min: 9, max: 10 },
    '+1': { min: 10, max: 10 },
  };

  const isValidPhoneNumber = (code: string, number: string) => {
    const digits = number.trim();
    if (!/^\d+$/.test(digits)) return false;
    if (digits.startsWith('0')) return false;
    const range = phoneLengthByCode[code] ?? { min: 7, max: 15 };
    return digits.length >= range.min && digits.length <= range.max;
  };

  const updateFormField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const [showOrderErrors, setShowOrderErrors] = useState(false);
  const [showStopperErrors, setShowStopperErrors] = useState(false);
  const orderErrors = {
    petName: !formData.petName.trim(),
    phoneNumber: !isValidPhoneNumber(formData.phoneCode, formData.phoneNumber),
  };
  const isOrderValid = !Object.values(orderErrors).some(Boolean);

  const nextStep = () => {
    if (contentStep === 8) {
      setShowStopperErrors(true);
      if (formData.wantStopers === 'tak' && selectedStringsCount === 0) return;
      if (stopperSelectionRequired && !isStopperSelectionComplete) return;
    }
    if (contentStep === 10) {
      setShowOrderErrors(true);
      if (!isOrderValid) return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const backButtonClass = "px-2.5 sm:px-5 py-2.5 rounded-none bg-[#3A5A40] text-[#F4EFE6] text-[10px] md:text-[11px] uppercase tracking-[0.18em] md:tracking-[0.22em] font-light hover:bg-[#2E4833] transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap shrink-0";
  const nextButtonClass = "px-2.5 sm:px-7 py-2.5 rounded-none bg-[#3A5A40] text-[#F4EFE6] text-[10px] md:text-[11px] uppercase tracking-[0.18em] md:tracking-[0.22em] font-light hover:bg-[#2E4833] transition-colors duration-300 whitespace-nowrap shrink-0";

  const renderBackButton = () => (
    <button
      onClick={prevStep}
      disabled={currentStep === 1}
      className={backButtonClass}
    >
      &larr;<span className="hidden sm:inline"> Wstecz</span>
    </button>
  );

  const renderNextButton = () => (
    currentStep < totalSteps ? (
      <button onClick={nextStep} className={nextButtonClass}>
        Dalej<span className="hidden sm:inline"> &rarr;</span>
      </button>
    ) : (
      <span className="px-4 md:px-6 py-2 text-xs md:text-sm whitespace-nowrap shrink-0 invisible" aria-hidden>
        Dodaj do koszyka
      </span>
    )
  );

  const ringsList = [
    {
      id: 'złoty',
      title: 'Złota',
      image: '/oprawy/gold.png',
      details: [
        { label: 'Rozmiar', value: '25 mm' },
        { label: 'Materiał', value: 'stal nierdzewna' },
      ],
    },
    {
      id: 'srebrny',
      title: 'Srebrna',
      image: '/oprawy/silver.png',
      details: [
        { label: 'Rozmiar', value: '25 mm' },
        { label: 'Materiał', value: 'stal nierdzewna' },
      ],
    },
    {
      id: 'kwiat',
      title: 'Kwiat',
      image: '/oprawy/kwiat.png',
      details: [
        { label: 'Rozmiar', value: '28 mm' },
        { label: 'Materiał', value: 'stal nierdzewna' },
      ],
    },
  ];

  const goldBases: ConfiguratorBaseOption[] = GOLD_BASE_CATALOG.map((item) => ({
    id: item.id,
    title: item.label,
    image: item.image,
  }));

  const silverBases: ConfiguratorBaseOption[] = SILVER_BASE_CATALOG.map((item) => ({
    id: item.id,
    title: item.label,
    image: item.image,
  }));

  const flowerBases: ConfiguratorBaseOption[] = FLOWER_BASE_CATALOG.map((item) => ({
    id: item.id,
    title: item.label,
    image: item.image,
  }));

  const glowBases: ConfiguratorBaseOption[] = GLOW_BASE_CATALOG.map((item) => ({
    id: item.id,
    title: item.label,
    image: item.images[0],
    images: item.images,
    details: [
      { label: '', value: 'Bez oprawy' },
      { label: 'Rozmiar', value: '25 mm' },
    ],
  }));

  const basesForRing = (ringColor: string): ConfiguratorBaseOption[] => {
    if (ringColor === 'srebrny') return silverBases;
    if (ringColor === 'kwiat') return flowerBases;
    if (ringColor === 'glow') return glowBases;
    return goldBases;
  };

  const selectedBases = isGlowTagConfigurator ? glowBases : basesForRing(formData.ringColor);

  const basePreviewImage = (base: ConfiguratorBaseOption) =>
    base.images?.[0] ?? base.image;

  const oprawaLabel = (ringColor: string) => {
    if (ringColor === 'złoty') return 'Złoty';
    if (ringColor === 'srebrny') return 'Srebrny';
    if (ringColor === 'kwiat') return 'Kwiat';
    return ringColor;
  };

  const mapCharmItem = (item: { id: string; label: string; image: string; unavailable?: boolean; hit?: boolean }) => ({
    id: item.id,
    title: item.label,
    image: item.image,
    unavailable: item.unavailable,
    hit: item.hit,
  });

  const charmBestsellersList = CHARM_BESTSELLERS.map(mapCharmItem);
  const charmCatalogList = CHARM_CATALOG.map(mapCharmItem);
  const charmSilverList = CHARM_SILVER_CATALOG.map(mapCharmItem);
  const charmLargeList = CHARM_LARGE_CATALOG.map(mapCharmItem);
  const charmsList = [...charmBestsellersList, ...charmCatalogList, ...charmSilverList, ...charmLargeList];

  const karabinersList = KARABINER_CATALOG.map((item) => ({
    id: item.id,
    title: item.label,
    image: item.image,
  }));

  const premiumStringsList = PREMIUM_STRING_CATALOG.map((item) => ({
    id: item.id,
    title: item.label,
    images: item.images,
  }));

  const stopersList = [
    { id: '1', title: 'Złote', image: '/stopery/1.jpg' },
    { id: '2', title: 'Srebrne', image: '/stopery/2.jpg' },
  ];

  const stickersList = [
    { id: '1', title: 'Pies 1', image: '/naklejki/1.jpg' },
    { id: '2', title: 'Pies 2', image: '/naklejki/2.jpg' },
    { id: '3', title: 'Pies 3', image: '/naklejki/3.jpg' },
    { id: '4', title: 'Pies 4', image: '/naklejki/4.jpg' },
    { id: '5', title: 'Pies 5', image: '/naklejki/5.jpg' },
    { id: '6', title: 'Pies 6', image: '/naklejki/6.jpg' },
    { id: '7', title: 'Pies 7', image: '/naklejki/7.jpg' },
    { id: '8', title: 'Pies 8', image: '/naklejki/8.jpg' },
    { id: '9', title: 'Pies 9', image: '/naklejki/9.jpg' },
    { id: '10', title: 'Pies 10', image: '/naklejki/10.jpg' },
    { id: '11', title: 'Pies 11', image: '/naklejki/11.jpg' },
    { id: '12', title: 'Pies 12', image: '/naklejki/12.jpg' },
  ];

  const classicStringsList = CLASSIC_STRING_CATALOG.map((item) => ({
    id: item.id,
    title: item.label,
    images: item.images,
  }));

  const glowStringsList = GLOW_STRING_CATALOG.map((item) => ({
    id: item.id,
    title: item.label,
    images: item.images,
  }));

  const findTitle = (list: { id: string; title: string }[], id: string, fallback: string) =>
    list.find((item) => item.id === id)?.title ?? fallback;

  const selectFreeCharm = (charmId: string) => {
    if (charmsList.find((item) => item.id === charmId)?.unavailable) return;
    setFormData((prev) => ({ ...prev, charmOption: charmId }));
    setCharmMountingTarget({ type: 'free', charmId });
  };

  const selectExtraCharm = (charmId: string) => {
    if (charmsList.find((item) => item.id === charmId)?.unavailable) return;
    setFormData((prev) => ({
      ...prev,
      extraCharms: prev.extraCharms.includes(charmId)
        ? prev.extraCharms
        : [...prev.extraCharms, charmId],
      extraCharmMountings: {
        ...prev.extraCharmMountings,
        [charmId]: 'oddzielne',
      },
    }));
  };

  const deselectExtraCharm = (charmId: string) => {
    setFormData((prev) => {
      const { [charmId]: _removed, ...restMountings } = prev.extraCharmMountings;
      return {
        ...prev,
        extraCharms: prev.extraCharms.filter((item) => item !== charmId),
        extraCharmMountings: restMountings,
      };
    });
  };

  const modalSelectedMounting = (): CharmMountingId => formData.charmMounting;

  const selectCharmMounting = (mounting: CharmMountingId) => {
    if (!charmMountingTarget || charmMountingTarget.type !== 'free') return;

    setFormData((prev) => ({ ...prev, charmMounting: mounting, charmOption: charmMountingTarget.charmId }));
    setCharmMountingTarget(null);
  };

  const extraCharmDisplayValue = (id: string) => {
    const title = findTitle(charmsList, id, id);
    const mounting = formData.extraCharmMountings[id] ?? 'oddzielne';
    return `${title} (${charmMountingTileLabel(mounting)})`;
  };

  const renderFreeCharmCard = (charm: { id: string; title: string; image: string; unavailable?: boolean; hit?: boolean }) => {
    const isSelected = formData.charmOption === charm.id;
    const isDisabled = charm.unavailable;

    return (
      <div
        key={charm.id}
        onClick={isDisabled ? undefined : () => selectFreeCharm(charm.id)}
        className={`rounded-none p-3 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
          isDisabled
            ? 'opacity-50 cursor-not-allowed border-[#D6C7AE] bg-white'
            : isSelected
              ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md cursor-pointer'
              : 'border-[#D6C7AE] bg-white hover:border-[#C4A574] cursor-pointer'
        }`}
      >
        <div className="w-full aspect-square md:aspect-[4/5] bg-[#EFE8DC] mb-3 md:mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
          {charm.hit && (
            <span className="absolute top-3 -left-5 z-10 w-24 -rotate-45 bg-[#3A5A40] text-[#F4EFE6] text-[9px] md:text-[10px] uppercase tracking-[0.22em] font-bold text-center py-0.5 shadow-sm pointer-events-none">
              HIT
            </span>
          )}
          <img src={charm.image} alt={charm.title} className="w-full h-full object-cover" />
        </div>
        <span className="text-base font-medium text-[#161616]">{charm.title}</span>
        {isSelected && (
          <span className="mt-1 text-[11px] md:text-xs text-[#7A736C]">{charmMountingTileLabel(formData.charmMounting)}</span>
        )}
        {!isDisabled && (
          <div className={`w-5 h-5 rounded-full border mt-3 flex items-center justify-center transition-all ${isSelected ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'}`}>
            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        )}
      </div>
    );
  };

  const renderExtraCharmCard = (charm: { id: string; title: string; image: string; unavailable?: boolean; hit?: boolean }) => {
    const isSelected = formData.extraCharms.includes(charm.id);
    const isDisabled = charm.unavailable;
    const mounting = formData.extraCharmMountings[charm.id] ?? 'oddzielne';

    return (
      <div
        key={charm.id}
        onClick={isDisabled ? undefined : () => selectExtraCharm(charm.id)}
        className={`rounded-none p-3 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
          isDisabled
            ? 'opacity-50 cursor-not-allowed border-[#D6C7AE] bg-white'
            : isSelected
              ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md cursor-pointer'
              : 'border-[#D6C7AE] bg-white hover:border-[#C4A574] cursor-pointer'
        }`}
      >
        <div className="w-full aspect-square md:aspect-[4/5] bg-[#EFE8DC] mb-3 md:mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
          {charm.hit && (
            <span className="absolute top-3 -left-5 z-10 w-24 -rotate-45 bg-[#3A5A40] text-[#F4EFE6] text-[9px] md:text-[10px] uppercase tracking-[0.22em] font-bold text-center py-0.5 shadow-sm pointer-events-none">
              HIT
            </span>
          )}
          <img src={charm.image} alt={charm.title} className="w-full h-full object-cover" />
        </div>
        <span className="text-base font-medium text-[#161616]">{charm.title}</span>
        {isSelected && (
          <span className="mt-1 text-[11px] md:text-xs text-[#7A736C]">{charmMountingTileLabel(mounting)}</span>
        )}
        {!isDisabled && (
          <div
            onClick={(event) => {
              event.stopPropagation();
              if (isSelected) deselectExtraCharm(charm.id);
              else selectExtraCharm(charm.id);
            }}
            className={`w-5 h-5 rounded-md border mt-3 flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'}`}
          >
            {isSelected && <span className="text-white text-xs font-bold">✓</span>}
          </div>
        )}
      </div>
    );
  };

  const renderFreeKarabinerCard = (karabiner: { id: string; title: string; image: string }) => {
    const isSelected = formData.karabinerOption === karabiner.id;

    return (
      <div
        key={karabiner.id}
        onClick={() => setFormData({ ...formData, karabinerOption: karabiner.id })}
        className={`cursor-pointer rounded-none p-3 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
          isSelected ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
        }`}
      >
        <div className="w-full aspect-square md:aspect-[4/5] bg-[#EFE8DC] mb-3 md:mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
          <img src={karabiner.image} alt={karabiner.title} className="w-full h-full object-cover" />
        </div>
        <span className="text-base font-medium text-[#161616]">{karabiner.title}</span>
        <div className={`w-5 h-5 rounded-full border mt-3 flex items-center justify-center transition-all ${isSelected ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'}`}>
          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>
    );
  };

  const renderExtraKarabinerCard = (karabiner: { id: string; title: string; image: string }) => {
    const isSelected = formData.extraKarabiners.includes(karabiner.id);

    return (
      <div
        key={karabiner.id}
        onClick={() => toggleExtraKarabiner(karabiner.id)}
        className={`cursor-pointer rounded-none p-3 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
          isSelected ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
        }`}
      >
        <div className="w-full aspect-square md:aspect-[4/5] bg-[#EFE8DC] mb-3 md:mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
          <img src={karabiner.image} alt={karabiner.title} className="w-full h-full object-cover" />
        </div>
        <span className="text-base font-medium text-[#161616]">{karabiner.title}</span>
        <div className={`w-5 h-5 rounded-md border mt-3 flex items-center justify-center transition-all ${isSelected ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'}`}>
          {isSelected && <span className="text-white text-xs font-bold">✓</span>}
        </div>
      </div>
    );
  };

  const renderFreeKarabinerGrid = () => (
    <div className={imageGridClass(karabinersList.length)}>
      {karabinersList.map(renderFreeKarabinerCard)}
    </div>
  );

  const renderExtraKarabinerGrid = () => (
    <div className={imageGridClass(karabinersList.length)}>
      {karabinersList.map(renderExtraKarabinerCard)}
    </div>
  );

  const renderExtraCharmSections = () => (
    <div className="space-y-6">
      <div className={imageGridClass(charmBestsellersList.length + charmCatalogList.length)}>
        {[...charmBestsellersList, ...charmCatalogList].map(renderExtraCharmCard)}
      </div>

      <div className="space-y-4">
        <p className="font-bold text-base text-[#161616]">Charmsy w srebrnym kolorze</p>
        <div className={imageGridClass(charmSilverList.length)}>
          {charmSilverList.map(renderExtraCharmCard)}
        </div>
      </div>

      <div className="space-y-4">
        <p className="font-bold text-base text-[#161616]">
          Duże charmsy (w przypadku wyboru tego modelu napis zostanie umieszczony w dolnej części adresówki)
        </p>
        <div className={imageGridClass(charmLargeList.length)}>
          {charmLargeList.map(renderExtraCharmCard)}
        </div>
      </div>
    </div>
  );

  const buildCartItem = (): CartItem => {
    const bases = selectedBases;
    const options: { label: string; values: string[] }[] = [];
    if (!isGlowTagConfigurator) {
      options.push({ label: 'Oprawa', values: [oprawaLabel(formData.ringColor)] });
    }
    options.push(
      { label: 'Baza', values: [findTitle(bases, formData.baseOption, `Opcja nr ${formData.baseOption}`)] },
    );
    if (isGlowTagConfigurator) {
      const glowText = GLOW_TEXT_OPTIONS.find((option) => option.id === formData.glowTextColor);
      options.push({
        label: 'Napis',
        values: [glowText ? glowText.label : formData.glowTextColor],
      });
    }
    options.push(
      { label: 'Darmowy charms', values: [findTitle(charmsList, formData.charmOption, formData.charmOption)] },
    );
    options.push({
      label: 'Mocowanie charmsa',
      values: [CHARM_MOUNTING_OPTIONS.find((option) => option.id === formData.charmMounting)?.label ?? formData.charmMounting],
    });

    if (formData.wantExtraCharms === 'tak' && formData.extraCharms.length > 0) {
      options.push({
        label: 'Dodatkowe charms',
        values: formData.extraCharms.map((id) => extraCharmDisplayValue(id)),
      });
    }

    options.push({
      label: 'Darmowy karabińczyk',
      values: [findTitle(karabinersList, formData.karabinerOption, `Opcja nr ${formData.karabinerOption}`)],
    });

    if (formData.wantExtraKarabiners === 'tak' && formData.extraKarabiners.length > 0) {
      options.push({
        label: 'Dodatkowe karabińczyki',
        values: formData.extraKarabiners.map((id) => findTitle(karabinersList, id, id)),
      });
    }

    if (formData.wantString === 'tak' && formData.premiumStrings.length > 0) {
      options.push({
        label: 'Sznurek Premium',
        values: formData.premiumStrings.map((id) => findTitle(premiumStringsList, id, id)),
      });
    }

    if (formData.wantString === 'tak' && formData.classicStrings.length > 0) {
      options.push({
        label: 'Sznurek Klasyczny',
        values: formData.classicStrings.map((id) => findTitle(classicStringsList, id, id)),
      });
    }

    if (formData.wantString === 'tak' && formData.glowStrings.length > 0) {
      options.push({
        label: 'Sznurek Glow',
        values: formData.glowStrings.map((id) => findTitle(glowStringsList, id, id)),
      });
    }

    if (formData.wantString === 'tak' && formData.stringLength) {
      options.push({
        label: 'Obwód szyi',
        values: [stringSizeText ? `${formData.stringLength} cm (${stringSizeText})` : `${formData.stringLength} cm`],
      });
    }

    if (formData.wantStopers === 'tak' && formData.extraStopers.length > 0) {
      options.push({
        label: 'Stopery',
        values: [stopperSelectionLabel(formData.extraStopers)],
      });
    }

    if (!isGlowTagConfigurator && formData.wantSticker === 'tak' && formData.stickerOption) {
      options.push({
        label: 'Naklejka',
        values: [findTitle(stickersList, formData.stickerOption, `Pies ${formData.stickerOption}`)],
      });
    }

    if (formData.includePhoneCode === 'tak') {
      options.push({
        label: 'Numer kierunkowy na adresówce',
        values: [`Tak (+${DIAL_CODE_PRICE} zł)`],
      });
    }

    options.push({ label: 'Imię pupila', values: [formData.petName] });
    options.push({
      label: 'Układ liter na adresówce',
      values: [
        formData.petName.trim().length > 6 || formData.nameLayout === 'imie6plus'
          ? 'Rozszerzony'
          : 'Standardowy',
      ],
    });
    options.push({
      label: 'Nr telefonu',
      values: [
        formData.includePhoneCode === 'tak'
          ? `${formData.phoneCode} ${formatPhoneGroups(formData.phoneNumber, formData.phoneCode)}`
          : formatPhoneGroups(formData.phoneNumber, formData.phoneCode),
      ],
    });

    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      productSlug: activeProduct.slug,
      productName: activeProduct.name,
      quantity: 1,
      price: totalPrice,
      image: basePreviewImage(
        selectedBases.find((item) => item.id === formData.baseOption) ?? selectedBases[0] ?? { id: '', title: '', image: '' },
      ),
      options,
      config: { ...formData },
    };
  };

  const addToCart = () => {
    setShowOrderErrors(true);
    if (!isOrderValid || showAddedToCart) return;
    setCartItems((prev) => [...prev, buildCartItem()]);
    setShowAddedToCart(true);
  };

  const resetConfigurator = () => {
    setFormData(formDataForProduct(activeProductSlug));
    setShowOrderErrors(false);
    setCurrentStep(1);
    setShowAddedToCart(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToCartAfterAdd = () => {
    resetConfigurator();
    goToTab('cart');
  };

  const returnToConfiguratorAfterAdd = () => {
    resetConfigurator();
    openConfigurator(activeProductSlug);
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    setShowRemovedFromCart(true);
    if (removedFromCartTimeoutRef.current) clearTimeout(removedFromCartTimeoutRef.current);
    removedFromCartTimeoutRef.current = setTimeout(() => setShowRemovedFromCart(false), 3000);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartProductsValue = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasFreeShipping = qualifiesForFreeShipping(cartProductsValue);
  const selectedShipping = shippingOptions.find((option) => option.id === checkoutData.shippingMethod);
  const shippingCost = selectedShipping
    ? shippingCostForOrder(cartProductsValue, selectedShipping.price)
    : 0;
  const fastDeliveryCost = checkoutData.fastDelivery ? FAST_DELIVERY_COST : 0;
  const checkoutTotal = cartProductsValue + shippingCost + fastDeliveryCost;

  const formatPostalCode = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 5);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  };

  const updateCheckoutField = (key: keyof CheckoutData, value: string | boolean) => {
    setCheckoutData((prev) => ({ ...prev, [key]: value }));
  };

  const checkoutErrors = {
    firstName: !checkoutData.firstName.trim(),
    lastName: !checkoutData.lastName.trim(),
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutData.email.trim()),
    phone: !isValidPhoneNumber(checkoutData.phoneCode, checkoutData.phone),
    street: checkoutData.shippingMethod === 'kurier' && !checkoutData.street.trim(),
    postalCode: checkoutData.shippingMethod === 'kurier' && checkoutData.postalCode.replace(/\D/g, '').length !== 5,
    city: checkoutData.shippingMethod === 'kurier' && !checkoutData.city.trim(),
    shippingMethod: !checkoutData.shippingMethod,
    pickupPoint: checkoutData.shippingMethod === 'paczkomat' && !checkoutData.pickupPointName,
    acceptTerms: !checkoutData.acceptTerms,
  };
  const isCheckoutValid = !Object.values(checkoutErrors).some(Boolean);

  const checkoutInputClass = (hasError: boolean) =>
    `w-full bg-white rounded-none border px-4 py-3 text-base md:text-sm focus:outline-none ${
      showCheckoutErrors && hasError ? 'border-red-400' : 'border-[#D6C7AE] focus:border-[#C4A574]'
    }`;
  const checkoutLabelClass = 'block text-[11px] font-light tracking-[0.12em] md:tracking-[0.22em] text-[#9A9288] uppercase mb-1.5';
  const requiredMark = <span className="text-[#161616]"> *</span>;
  const checkoutFieldError = (show: boolean, message: string) =>
    show ? <p className="text-xs text-red-500 mt-1">{message}</p> : null;

  const submitCheckout = async () => {
    setShowCheckoutErrors(true);
    setCheckoutSubmitError('');
    if (!isCheckoutValid || isPlacingOrder || placedOrder) return;
    if (cartItems.length === 0) {
      setCheckoutSubmitError('Koszyk jest pusty.');
      return;
    }

    const deliveryType = checkoutData.shippingMethod === 'paczkomat' ? 'paczkomat' : 'kurier';
    const placedTotal = checkoutTotal;
    const placedFastDelivery = checkoutData.fastDelivery;

    setIsPlacingOrder(true);
    const result = await createOrder({
      clientName: checkoutData.firstName,
      clientSurname: checkoutData.lastName,
      clientEmail: checkoutData.email,
      clientPhone: `${checkoutData.phoneCode} ${formatPhoneGroups(checkoutData.phone, checkoutData.phoneCode)}`,
      clientAddress: deliveryType === 'paczkomat'
        ? (checkoutData.pickupPointAddress || checkoutData.street)
        : checkoutData.street,
      clientPostcode: checkoutData.postalCode,
      clientCity: checkoutData.city,
      deliveryType,
      inpostId: deliveryType === 'paczkomat' ? checkoutData.pickupPointName : null,
      discountCode: appliedDiscount || null,
      productsValue: cartProductsValue,
      shippingCost,
      fastDelivery: checkoutData.fastDelivery,
      fastDeliveryCost,
      total: checkoutTotal,
      items: cartItems.map((item) => {
        const config = item.config;
        return {
          quantity: item.quantity,
          unitPrice: item.price,
          imageUrl: item.image,
          productSlug: item.productSlug,
          productName: item.productName,
          ringColor: config.ringColor,
          baseColor: config.baseOption,
          baseCharms: config.charmOption,
          extraCharms: config.wantExtraCharms === 'tak' ? config.extraCharms : [],
          baseCarabiner: config.karabinerOption,
          extraCarabiner: config.wantExtraKarabiners === 'tak' ? config.extraKarabiners : [],
          stringPremium: config.wantString === 'tak' ? config.premiumStrings : [],
          stringClassic: config.wantString === 'tak' ? config.classicStrings : [],
          stringGlow: config.wantString === 'tak' ? config.glowStrings : [],
          dogNeck: config.wantString === 'tak' && config.stringLength ? `${config.stringLength} cm` : null,
          stoppers: config.wantStopers === 'tak' && config.extraStopers.length > 0
            ? config.extraStopers.join(',')
            : null,
          sticker: item.productSlug === GLOW_TAG_PRODUCT.slug
            ? null
            : config.wantSticker === 'tak' ? config.stickerOption || null : null,
          dogName: config.petName,
          numberOnTag:
            config.includePhoneCode === 'tak'
              ? `${config.phoneCode} ${formatPhoneGroups(config.phoneNumber, config.phoneCode)}`
              : formatPhoneGroups(config.phoneNumber, config.phoneCode),
          dialCodeInfo: config.includePhoneCode === 'tak',
        };
      }),
    });
    setIsPlacingOrder(false);

    if (!result.ok) {
      setCheckoutSubmitError(result.message);
      return;
    }

    setPlacedOrder({
      orderId: result.orderId,
      total: placedTotal,
      fastDelivery: placedFastDelivery,
      paymentRecipient: result.paymentRecipient,
    });
    setCartItems([]);
    setCheckoutData(initialCheckoutData);
    setDiscountInput('');
    setAppliedDiscount('');
    setShowCheckoutErrors(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleExtraKarabiner = (id: string) => {
    setFormData((prev) => {
      const exists = prev.extraKarabiners.includes(id);
      if (exists) {
        return { ...prev, extraKarabiners: prev.extraKarabiners.filter((item) => item !== id) };
      } else {
        return { ...prev, extraKarabiners: [...prev.extraKarabiners, id] };
      }
    });
  };

  const togglePremiumString = (id: string) => {
    setFormData((prev) => {
      const exists = prev.premiumStrings.includes(id);
      const next = {
        ...prev,
        premiumStrings: exists
          ? prev.premiumStrings.filter((item) => item !== id)
          : [...prev.premiumStrings, id],
      };
      return trimStopersToStringCount(next);
    });
  };

  const toggleClassicString = (id: string) => {
    setFormData((prev) => {
      const exists = prev.classicStrings.includes(id);
      const next = {
        ...prev,
        classicStrings: exists
          ? prev.classicStrings.filter((item) => item !== id)
          : [...prev.classicStrings, id],
      };
      return trimStopersToStringCount(next);
    });
  };

  const toggleGlowString = (id: string) => {
    setFormData((prev) => {
      const exists = prev.glowStrings.includes(id);
      const next = {
        ...prev,
        glowStrings: exists
          ? prev.glowStrings.filter((item) => item !== id)
          : [...prev.glowStrings, id],
      };
      return trimStopersToStringCount(next);
    });
  };

  const addStopper = (id: string) => {
    setFormData((prev) => {
      if (prev.extraStopers.length >= countSelectedStrings(prev)) return prev;
      return { ...prev, extraStopers: [...prev.extraStopers, id] };
    });
  };

  const removeStopper = (id: string) => {
    setFormData((prev) => {
      const index = prev.extraStopers.lastIndexOf(id);
      if (index === -1) return prev;
      return {
        ...prev,
        extraStopers: prev.extraStopers.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const summaryLines = (
    <>
      <div className="space-y-3 text-sm text-[#7A736C]">
        <div className="flex justify-between items-start gap-4">
          <span className="font-serif font-bold text-lg text-[#161616]">{activeProduct.name}</span>
          <span className="font-bold text-lg text-[#161616] shrink-0 text-right tabular-nums">{basePrice} zł</span>
        </div>

        <div className="flex justify-between items-start gap-4 text-xs italic text-[#7E746C]">
          <span className="min-w-0 pl-3">Darmowy charms x1</span>
        </div>
        <div className="flex justify-between items-start gap-4 text-xs italic text-[#7E746C]">
          <span className="min-w-0 pl-3">Darmowy karabińczyk x1</span>
        </div>

        {formData.wantExtraCharms === 'tak' && formData.extraCharms.length > 0 && (
          <div className="flex justify-between items-start gap-4 text-xs italic text-[#7E746C]">
            <span className="min-w-0 pl-3">Dodatkowe charms x{formData.extraCharms.length}</span>
            <span className="shrink-0 text-right whitespace-nowrap tabular-nums">+{formData.extraCharms.length * 5} zł (5 zł/szt)</span>
          </div>
        )}

        {formData.wantExtraKarabiners === 'tak' && formData.extraKarabiners.length > 0 && (
          <div className="flex justify-between items-start gap-4 text-xs italic text-[#7E746C]">
            <span className="min-w-0 pl-3">Dodatkowe karabińczyki x{formData.extraKarabiners.length}</span>
            <span className="shrink-0 text-right whitespace-nowrap tabular-nums">+{formData.extraKarabiners.length * 5} zł (5 zł/szt)</span>
          </div>
        )}

        {formData.wantString === 'tak' && formData.premiumStrings.length > 0 && (
          <div className="flex justify-between items-start gap-4 text-xs italic text-[#7E746C]">
            <span className="min-w-0 pl-3">Sznurek Premium x{formData.premiumStrings.length}</span>
            <span className="shrink-0 text-right whitespace-nowrap tabular-nums">
              {premiumStringPrice
                ? `+${formData.premiumStrings.length * premiumStringPrice} zł (${premiumStringPrice} zł/szt)`
                : 'cena wg rozmiaru'}
            </span>
          </div>
        )}

        {formData.wantString === 'tak' && formData.classicStrings.length > 0 && (
          <div className="flex justify-between items-start gap-4 text-xs italic text-[#7E746C]">
            <span className="min-w-0 pl-3">Sznurek Klasyczny x{formData.classicStrings.length}</span>
            <span className="shrink-0 text-right whitespace-nowrap tabular-nums">
              {classicStringPrice
                ? `+${formData.classicStrings.length * classicStringPrice} zł (${classicStringPrice} zł/szt)`
                : 'cena wg rozmiaru'}
            </span>
          </div>
        )}

        {formData.wantString === 'tak' && formData.glowStrings.length > 0 && (
          <div className="flex justify-between items-start gap-4 text-xs italic text-[#7E746C]">
            <span className="min-w-0 pl-3">Sznurek Glow x{formData.glowStrings.length}</span>
            <span className="shrink-0 text-right whitespace-nowrap tabular-nums">
              {glowStringPrice
                ? `+${formData.glowStrings.length * glowStringPrice} zł (${glowStringPrice} zł/szt)`
                : 'cena wg rozmiaru'}
            </span>
          </div>
        )}

        {formData.wantStopers === 'tak' && formData.extraStopers.length > 0 && (
          <div className="flex justify-between items-start gap-4 text-xs italic text-[#7E746C]">
            <span className="min-w-0 pl-3">Stopery ({stopperSelectionLabel(formData.extraStopers)})</span>
            <span className="shrink-0 text-right whitespace-nowrap tabular-nums">+{formData.extraStopers.length * 5} zł ({formData.extraStopers.length}×5 zł)</span>
          </div>
        )}

        {formData.wantSticker === 'tak' && formData.stickerOption && !isGlowTagConfigurator && (
          <div className="flex justify-between items-start gap-4 text-xs italic text-[#7E746C]">
            <span className="min-w-0 pl-3">Naklejka (Pies {formData.stickerOption})</span>
            <span className="shrink-0 text-right whitespace-nowrap tabular-nums">+5 zł</span>
          </div>
        )}

        {formData.includePhoneCode === 'tak' && (
          <div className="flex justify-between items-start gap-4 text-xs italic text-[#7E746C]">
            <span className="min-w-0 pl-3">Numer kierunkowy na adresówce</span>
            <span className="shrink-0 text-right whitespace-nowrap tabular-nums">+{DIAL_CODE_PRICE} zł</span>
          </div>
        )}
      </div>

      <div className="border-t border-[#D6C7AE] pt-4">
        <div className="flex justify-between items-baseline gap-4">
          <span className="text-base font-serif font-bold text-[#161616]">Cena całkowita:</span>
          <span className="text-2xl font-bold text-[#161616] shrink-0 text-right tabular-nums">{totalPrice} zł</span>
        </div>
      </div>
    </>
  );

  useLayoutEffect(() => {
    const el = topStackRef.current;
    if (!el) return;

    const updateHeight = () => setTopStackHeight(el.getBoundingClientRect().height);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeTab]);

  useEffect(() => {
    const container = stepsScrollRef.current;
    if (!container || activeTab !== 'configurator' || !isTagConfigurator) return;
    const active = container.querySelector<HTMLElement>(`[data-step="${currentStep}"]`);
    if (!active) return;
    const left = active.offsetLeft - container.clientWidth / 2 + active.offsetWidth / 2;
    container.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [currentStep, activeTab, isTagConfigurator]);

  useEffect(() => {
    return () => {
      if (removedFromCartTimeoutRef.current) clearTimeout(removedFromCartTimeoutRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#161616] flex flex-col font-sans selection:bg-[#D6C7AE] overflow-x-clip">
      {showRemovedFromCart && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[70] bg-[#161616] text-[#F4EFE6] px-6 py-3 rounded-full shadow-lg text-sm font-medium text-center">
          Usunięto produkt z koszyka
        </div>
      )}
      {showAddedToCart && (
        <div className="fixed inset-0 z-[80] bg-[#161616]/40 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="added-to-cart-title"
            className="w-full max-w-md bg-[#F9F5ED] border border-[#D6C7AE] p-8 md:p-10 space-y-8"
          >
            <div className="space-y-3 text-center">
              <h3 id="added-to-cart-title" className="font-serif font-light text-2xl md:text-3xl text-[#161616]">
                Dodano do koszyka
              </h3>
              <p className="text-sm text-[#7A736C] font-light leading-relaxed">
                {activeProduct.name} jest już w koszyku. Możesz przejść do koszyka albo skonfigurować kolejną.
              </p>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={goToCartAfterAdd}
                className="w-full bg-[#3A5A40] hover:bg-[#2E4833] text-[#F4EFE6] py-3.5 rounded-none text-[11px] uppercase tracking-[0.22em] font-light transition-colors duration-300"
              >
                Przejdź do koszyka
              </button>
              <button
                type="button"
                onClick={returnToConfiguratorAfterAdd}
                className="w-full border border-[#D6C7AE] text-[#161616] hover:bg-[#EBE4D6] py-3.5 rounded-none text-[11px] uppercase tracking-[0.22em] font-light transition-colors duration-300"
              >
                Wróć do konfiguratora
              </button>
            </div>
          </div>
        </div>
      )}
      {charmMountingTarget?.type === 'free' && (
        <div className="fixed inset-0 z-[80] bg-[#161616]/40 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="charm-mounting-title"
            className="w-full max-w-4xl bg-[#F9F5ED] border border-[#D6C7AE] p-5 md:p-8 space-y-5 md:space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <h3 id="charm-mounting-title" className="font-serif font-light text-xl md:text-2xl text-[#161616] text-center">
              Wybierz sposób mocowania charmsa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {CHARM_MOUNTING_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectCharmMounting(option.id)}
                  className={`text-left rounded-none border p-4 md:p-5 transition-colors duration-300 ${
                    modalSelectedMounting() === option.id
                      ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md'
                      : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                  }`}
                >
                  <div className="w-full aspect-[4/3] bg-[#EFE8DC] mb-4 overflow-hidden border border-[#D6C7AE]">
                    <img src={option.image} alt={option.label} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-base font-medium text-[#161616] mb-3">{option.label}</p>
                  <ul className="space-y-1.5 text-sm text-[#7A736C]">
                    {option.benefits.map((benefit) => (
                      <li key={benefit}>✔️ {benefit}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div ref={topStackRef} className="sticky top-0 z-50 bg-[#F4EFE6] pt-[env(safe-area-inset-top)]">
        <div className="bg-[#3A5A40] text-[#F4EFE6] px-4 md:px-6 py-2 md:py-2.5 text-center">
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.14em] md:tracking-[0.28em] font-light">
            Darmowa dostawa od 299 zł
          </p>
        </div>
        {/* Navbar z zakładkami */}
        <header className="border-b border-[#D6C7AE] bg-[#F4EFE6]/90 backdrop-blur-md overflow-hidden">
              <div className="max-w-6xl mx-auto px-5 md:px-12 h-16 md:h-[4.75rem] flex items-center justify-between gap-3">
                <div
                  className="relative h-full w-[11.5rem] md:w-[13.75rem] cursor-pointer shrink-0"
                  onClick={() => goToTab('home')}
                >
                  <img
                    src="/logo.png"
                    alt="PetTagi"
                    className="absolute left-1/2 top-1/2 h-[360%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2"
                  />
                </div>

                <nav className="hidden md:flex items-center gap-10">
                  <button 
                    onClick={() => goToTab('home')}
                    className={`text-[11px] uppercase tracking-[0.22em] font-light transition-colors ${activeTab === 'home' ? 'text-[#161616] border-b border-[#161616] pb-1' : 'text-[#7A736C] hover:text-[#161616]'}`}
                  >
                    O nas
                  </button>
                  <button 
                    onClick={() => goToTab('products')}
                    className={`text-[11px] uppercase tracking-[0.22em] font-light transition-colors ${activeTab === 'products' ? 'text-[#161616] border-b border-[#161616] pb-1' : 'text-[#7A736C] hover:text-[#161616]'}`}
                  >
                    Produkty
                  </button>
                </nav>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToTab('admin')}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-none text-[10px] md:text-[11px] uppercase tracking-[0.16em] md:tracking-[0.22em] font-light transition-colors duration-300 ${
                      activeTab === 'admin'
                        ? 'bg-[#3A5A40] text-[#F4EFE6]'
                        : 'bg-transparent text-[#161616] border border-[#D6C7AE] hover:border-[#161616]'
                    }`}
                  >
                    Panel
                  </button>
                  <button 
                    onClick={() => goToTab('cart')}
                    className={`bg-[#3A5A40] hover:bg-[#2E4833] text-[#F4EFE6] px-3 md:px-5 py-1.5 md:py-2 rounded-none text-[10px] md:text-[11px] uppercase tracking-[0.16em] md:tracking-[0.22em] font-light transition-colors duration-300 flex items-center gap-2 md:gap-3 ${activeTab === 'cart' ? 'outline outline-1 outline-[#C4A574]' : ''}`}
                  >
                    <span>Koszyk</span>
                    <span className="bg-[#2E4833] text-[#F4EFE6] px-2 py-0.5 rounded-full text-xs">{cartCount}</span>
                  </button>
                  <a
                    href="https://www.instagram.com/pet.tagi/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram PetTagi"
                    className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 text-[#161616] hover:text-[#3A5A40] transition-colors duration-300"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-[1.35rem] md:h-[1.35rem]" aria-hidden="true">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                </div>
              </div>
              <nav className="md:hidden flex flex-col gap-3 px-5 pb-5 pt-3 border-t border-[#D6C7AE]">
                <button
                  onClick={() => goToTab('home')}
                  className={`text-left text-[11px] uppercase tracking-[0.22em] font-light ${activeTab === 'home' ? 'text-[#161616]' : 'text-[#7A736C]'}`}
                >
                  O nas
                </button>
                <button
                  onClick={() => goToTab('products')}
                  className={`text-left text-[11px] uppercase tracking-[0.22em] font-light ${activeTab === 'products' ? 'text-[#161616]' : 'text-[#7A736C]'}`}
                >
                  Produkty
                </button>
              </nav>
            </header>

        {activeTab === 'configurator' && isTagConfigurator && (
          <div className="bg-white border-b border-[#D6C7AE] py-2.5 shadow-xs">
            <div className="px-2 md:px-4 flex items-center gap-2 md:gap-4">
              {renderBackButton()}
              <div className="flex-1 min-w-0">
                <div
                  ref={stepsScrollRef}
                  className="overflow-x-auto overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1.5"
                >
                  <div className="flex items-center gap-3 md:gap-0 md:justify-between w-max md:w-full mb-1.5 px-1 pt-0.5">
                    {stepsInfo.map((step) => (
                      <div
                        key={step.id}
                        data-step={step.id}
                        className={`flex flex-col items-center gap-0.5 shrink-0 w-9 md:w-auto transition-opacity duration-300 ${
                          step.id === currentStep ? 'opacity-100' : 'opacity-40'
                        }`}
                      >
                        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm border-2 overflow-hidden shrink-0 ${
                          step.id === currentStep ? 'border-[#161616] bg-[#F4EFE6]' : 'border-[#D6C7AE] bg-white'
                        }`}>
                          {'thumbnail' in step && step.thumbnail ? (
                            <img src={step.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            step.icon
                          )}
                        </div>
                        <span className="text-[7px] md:text-[8px] font-medium uppercase tracking-wider hidden md:block">{'shortLabel' in step && step.shortLabel ? step.shortLabel : step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-1 bg-[#D6C7AE] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#161616] transition-all duration-500"
                    style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                  />
                </div>
              </div>
              <div className={currentStep < totalSteps ? 'lg:hidden' : undefined}>
                {renderNextButton()}
              </div>
            </div>
          </div>
        )}
      </div>

      <main className="flex-grow pb-[env(safe-area-inset-bottom)]">
        
        {/* ZAKŁADKA: O nas */}
        {activeTab === 'home' && (
          <div className="max-w-4xl mx-auto px-5 md:px-12 py-12 md:py-28 space-y-10 md:space-y-16 text-center">
            <span className="text-[#C4A574] font-light uppercase tracking-[0.22em] md:tracking-[0.28em] text-[11px]">Witaj w świecie PetTagi</span>
            <h1 className="text-4xl md:text-7xl font-serif font-light text-[#161616] leading-[1.15]">
              Tworzymy wyjątkowe akcesoria dla Twojego pupila
            </h1>
            <p className="text-base md:text-lg text-[#7A736C] max-w-2xl mx-auto leading-relaxed font-light">
              Nasze adresówki i zawieszki powstają z pasji do zwierząt i dbałości o każdy detal. Łączymy unikalny design z najwyższą trwałością, aby Twój czworonożny przyjaciel wyglądał stylowo i był bezpieczny.
            </p>
            <div className="pt-4">
              <button 
                onClick={() => goToTab('products')}
                className="bg-[#3A5A40] hover:bg-[#2E4833] text-[#F4EFE6] px-6 sm:px-10 py-4 rounded-none text-[11px] uppercase tracking-[0.16em] md:tracking-[0.22em] font-light transition-colors duration-300 w-full sm:w-auto"
              >
                Zobacz produkty
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 pt-10 md:pt-16 text-left border-t border-[#D6C7AE]">
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#C4A574] font-light">Opis</p>
                <p className="text-sm text-[#7A736C] font-light leading-relaxed">Adresówki o rzeźbiarskim charakterze, projektowane tak, by łączyć urodę biżuterii z codzienną funkcją identyfikacji.</p>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#C4A574] font-light">Rzemiosło</p>
                <p className="text-sm text-[#7A736C] font-light leading-relaxed">Każdy element dobierany jest ręcznie. Dbałość o detal, fakturę i wykończenie jest częścią procesu, nie dodatkiem.</p>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#C4A574] font-light">Dostawa</p>
                <p className="text-sm text-[#7A736C] font-light leading-relaxed">Realizacja standardowa trwa 7–10 dni roboczych. Na życzenie dostępny jest skrócony czas 3–5 dni.</p>
              </div>
            </div>
          </div>
        )}

        {/* ZAKŁADKA: Produkty */}
        {activeTab === 'products' && (
          <div className="max-w-5xl mx-auto px-5 md:px-12 py-12 md:py-24 space-y-12 md:space-y-16">
            <div className="text-center space-y-5">
              <span className="text-[#C4A574] font-light uppercase tracking-[0.28em] text-[11px]">Kolekcja</span>
              <h1 className="text-4xl md:text-6xl font-serif font-light text-[#161616]">Nasze produkty</h1>
              <p className="text-sm text-[#7A736C] font-light tracking-wide">Ręcznie tworzone adresówki i akcesoria o rzeźbiarskim detalu.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
              {CATALOG_PRODUCTS.map((product) => (
                <div key={product.slug} className="space-y-6 text-center">
                  <ProductGallery items={product.gallery} alt={product.name} />
                  <h3 className="text-2xl md:text-3xl font-serif font-light">{product.name}</h3>
                  <p className="text-sm text-[#7A736C] font-light leading-relaxed">{product.description}</p>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => openConfigurator(product.slug)}
                      className="bg-[#3A5A40] hover:bg-[#2E4833] text-[#F4EFE6] px-5 md:px-6 py-2.5 md:py-3 rounded-none text-[10px] md:text-[11px] uppercase tracking-[0.16em] md:tracking-[0.22em] font-light transition-colors duration-300"
                    >
                      {product.cta}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ZAKŁADKA: Koszyk */}
        {activeTab === 'cart' && (
          <div className="max-w-6xl mx-auto px-5 md:px-12 py-10 md:py-20">
            <h1 className="text-4xl md:text-6xl font-serif font-light text-[#161616] mb-8 md:mb-14">Twój koszyk</h1>

            {cartItems.length === 0 ? (
              <div className="bg-white rounded-3xl p-6 md:p-10 text-center space-y-4 border border-[#D6C7AE]">
                <p className="text-[#7A736C]">Twój koszyk jest pusty.</p>
                <button
                  onClick={() => goToTab('products')}
                  className="bg-[#3A5A40] hover:bg-[#2E4833] text-[#F4EFE6] px-6 sm:px-10 py-3.5 rounded-none text-[11px] uppercase tracking-[0.16em] md:tracking-[0.22em] font-light transition-colors duration-300 w-full sm:w-auto"
                >
                  Zobacz produkty
                </button>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex-1 space-y-4 w-full">
                  {cartItems.map((item) => {
                    const petName = item.options.find((option) => option.label === 'Imię pupila')?.values[0];
                    return (
                    <div key={item.id} className="bg-white rounded-3xl p-5 md:p-6 relative flex gap-4 md:gap-6 shadow-sm">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="absolute top-4 right-4 text-[#9A9288] hover:text-[#161616] text-xl leading-none"
                        aria-label="Usuń z koszyka"
                      >
                        ×
                      </button>
                      <div className="w-20 h-20 md:w-32 md:h-32 overflow-hidden bg-[#EFE8DC] shrink-0 border border-[#D6C7AE]">
                        <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                          <div>
                            <h3 className="text-xl font-serif font-light text-[#161616]">
                              {productLineTitle(item.productName, petName)}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mt-3">
                              {item.options.map((option) => (
                                <div key={`${item.id}-${option.label}`} className="text-sm min-w-0">
                                  <p className="text-[#9A9288]">{option.label}:</p>
                                  <ul className="mt-0.5 space-y-0.5 pl-3">
                                    {option.values.map((value) => (
                                      <li key={`${item.id}-${option.label}-${value}`} className="text-[#161616] font-medium">
                                        {value}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                          <span className="text-[#161616] font-light text-lg whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>

                <aside className="w-full lg:w-[380px] shrink-0 bg-[#EBE4D6] p-5 md:p-10 space-y-6">
                  <h2 className="text-2xl font-serif font-light text-[#161616]">Podsumowanie zamówienia</h2>
                  <div className="space-y-2 text-sm text-[#7A736C] pt-2">
                    <div className="flex justify-between">
                      <span>Wartość produktów</span>
                      <span className="font-medium text-[#161616]">{formatPrice(cartProductsValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dostawa</span>
                      <span>wybór w następnym kroku</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="font-bold text-[#161616]">Razem</span>
                    <span className="text-2xl font-bold text-[#161616]">{formatPrice(cartProductsValue)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setPlacedOrder(null);
                      goToTab('checkout');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full bg-[#3A5A40] hover:bg-[#2E4833] text-[#F4EFE6] py-3.5 rounded-none text-[11px] uppercase tracking-[0.22em] font-light transition-colors duration-300 flex items-center justify-center gap-2"
                  >
                    Przejdź do kasy
                    <span aria-hidden>→</span>
                  </button>
                </aside>
              </div>
            )}
          </div>
        )}

        {/* ZAKŁADKA: Dane i dostawa */}
        {activeTab === 'checkout' && placedOrder && (
          <div className="max-w-3xl mx-auto px-5 md:px-12 py-10 md:py-20">
            <h1 className="text-4xl md:text-6xl font-serif font-light text-[#161616] mb-8 md:mb-14">
              Dziękujemy za złożenie zamówienia
            </h1>
            <div className="bg-white rounded-3xl border border-[#D6C7AE] p-5 md:p-8 space-y-6">
              <div>
                <p className="font-bold text-[#161616] mb-3">
                  Dokonaj płatności kwoty {formatPrice(placedOrder.total)}:
                </p>
                <div className="space-y-3 text-[#161616]">
                  <p>
                    - BLIK na numer telefonu {PAYMENT_RECIPIENTS[placedOrder.paymentRecipient].blikPhone}
                  </p>
                  <div>
                    <p>- przelewem na rachunek bankowy:</p>
                    <div className="mt-1 font-medium pl-3">
                      <p>{PAYMENT_RECIPIENTS[placedOrder.paymentRecipient].accountName}</p>
                      <p className="break-all">{PAYMENT_RECIPIENTS[placedOrder.paymentRecipient].accountNumber}</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[#161616]">
                {fulfillmentMessage(placedOrder.orderId, placedOrder.fastDelivery)}
              </p>
              <p className="text-[#7A736C]">
                Szczegóły zamówienia wysłaliśmy na Twój adres e-mail
              </p>
            </div>
          </div>
        )}

        {activeTab === 'checkout' && !placedOrder && (
          <div className="max-w-6xl mx-auto px-5 md:px-12 py-10 md:py-20">
            <button
              onClick={() => goToTab('cart')}
              className="text-[#161616] text-sm font-medium mb-6 hover:underline"
            >
              ← Wróć do koszyka
            </button>
            <h1 className="text-4xl md:text-6xl font-serif font-light text-[#161616] mb-8 md:mb-14">Dane i dostawa</h1>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex-1 space-y-10 w-full">
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 shrink-0 rounded-none bg-[#161616] text-[#F4EFE6] flex items-center justify-center text-[11px] tracking-widest font-light">1</span>
                    <h2 className="text-2xl md:text-3xl font-serif font-light text-[#161616] min-w-0">Metoda wysyłki</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:gap-4 max-w-xl mx-auto">
                    {shippingOptions.map((option) => {
                      const isSelected = checkoutData.shippingMethod === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setCheckoutData((prev) => ({
                              ...prev,
                              shippingMethod: option.id,
                              pickupPointName: option.id === 'paczkomat' ? prev.pickupPointName : '',
                              pickupPointAddress: option.id === 'paczkomat' ? prev.pickupPointAddress : '',
                            }));
                          }}
                          className={`bg-white rounded-2xl p-3 md:p-5 border-2 transition-all flex flex-col items-center ${
                            isSelected ? 'border-[#161616] shadow-md' : 'border-[#D6C7AE] hover:border-[#C4A574]'
                          } ${showCheckoutErrors && checkoutErrors.shippingMethod ? 'border-red-400' : ''}`}
                        >
                          <img
                            src={option.image}
                            alt={`InPost ${option.title}`}
                            className="h-12 md:h-16 w-auto max-w-full object-contain"
                          />
                          <span className="mt-3 font-bold text-sm md:text-base text-[#161616]">
                            {formatPrice(shippingCostForOrder(cartProductsValue, option.price))}
                          </span>
                          <span className={`mt-3 w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'}`}>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {checkoutData.shippingMethod === 'paczkomat' && (
                    <div className="mt-6 space-y-3">
                      <p className="font-medium text-[#161616]">Wybierz paczkomat</p>
                      {checkoutData.pickupPointName && (
                        <p className="text-sm text-[#7A736C]">
                          Wybrany paczkomat:{' '}
                          <span className="font-medium text-[#161616]">
                            {checkoutData.pickupPointName}
                            {checkoutData.pickupPointAddress ? `, ${checkoutData.pickupPointAddress}` : ''}
                          </span>
                        </p>
                      )}
                      <div className="rounded-2xl border border-[#D6C7AE] bg-white overflow-hidden">
                        <FurgonetkaMap
                          city={checkoutData.city}
                          street={checkoutData.street}
                          postcode={checkoutData.postalCode}
                          onSelect={(point) => {
                            setCheckoutData((prev) => ({
                              ...prev,
                              pickupPointName: point.code,
                              pickupPointAddress: point.address,
                            }));
                          }}
                        />
                      </div>
                      {showCheckoutErrors && checkoutErrors.pickupPoint && (
                        <p className="text-xs text-red-500">Wybierz paczkomat na mapie.</p>
                      )}
                    </div>
                  )}
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 shrink-0 rounded-none bg-[#161616] text-[#F4EFE6] flex items-center justify-center text-[11px] tracking-widest font-light">2</span>
                    <h2 className="text-2xl md:text-3xl font-serif font-light text-[#161616] min-w-0">Dane do wysyłki</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={checkoutLabelClass}>Imię{requiredMark}</label>
                        <input
                          type="text"
                          required
                          value={checkoutData.firstName}
                          onChange={(e) => {
                            if (isLettersOnly(e.target.value)) updateCheckoutField('firstName', e.target.value);
                          }}
                          placeholder="Twoje imię"
                          className={checkoutInputClass(checkoutErrors.firstName)}
                        />
                        {checkoutFieldError(showCheckoutErrors && checkoutErrors.firstName, 'Pole obowiązkowe')}
                      </div>
                      <div>
                        <label className={checkoutLabelClass}>Nazwisko{requiredMark}</label>
                        <input
                          type="text"
                          required
                          value={checkoutData.lastName}
                          onChange={(e) => {
                            if (isLettersOnly(e.target.value)) updateCheckoutField('lastName', e.target.value);
                          }}
                          placeholder="Twoje nazwisko"
                          className={checkoutInputClass(checkoutErrors.lastName)}
                        />
                        {checkoutFieldError(showCheckoutErrors && checkoutErrors.lastName, 'Pole obowiązkowe')}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={checkoutLabelClass}>E-mail{requiredMark}</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9288]">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                              <rect x="3" y="5" width="18" height="14" rx="2" />
                              <path d="M3 7l9 6 9-6" />
                            </svg>
                          </span>
                          <input
                            type="email"
                            required
                            value={checkoutData.email}
                            onChange={(e) => updateCheckoutField('email', e.target.value)}
                            placeholder="Adres e-mail"
                            className={`${checkoutInputClass(checkoutErrors.email)} pl-10`}
                          />
                        </div>
                        {checkoutFieldError(showCheckoutErrors && checkoutErrors.email, 'Pole obowiązkowe')}
                      </div>
                      <div>
                        <label className={checkoutLabelClass}>Nr telefonu{requiredMark}</label>
                        <div className="flex gap-2 min-w-0">
                          <select
                            value={checkoutData.phoneCode}
                            onChange={(e) => updateCheckoutField('phoneCode', e.target.value)}
                            className={`w-[3.85rem] shrink-0 appearance-none bg-white rounded-xl border pl-1.5 pr-4 py-3 text-base md:text-sm focus:outline-none bg-[length:10px] bg-[right_5px_center] bg-no-repeat ${
                              showCheckoutErrors && checkoutErrors.phone ? 'border-red-400' : 'border-[#D6C7AE] focus:border-[#161616]'
                            }`}
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 20 20' fill='none' stroke='%236E635B' stroke-width='2'%3E%3Cpath d='M5 7l5 6 5-6'/%3E%3C/svg%3E")` }}
                          >
                            {countryCodes.map((item) => (
                              <option key={item.code} value={item.code}>{item.code}</option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            required
                            inputMode="numeric"
                            value={formatPhoneGroups(checkoutData.phone, checkoutData.phoneCode)}
                            onChange={(e) => {
                              const max = phoneLengthByCode[checkoutData.phoneCode]?.max ?? 15;
                              const digits = e.target.value.replace(/\D/g, '').slice(0, max);
                              if (isDigitsOnly(digits)) updateCheckoutField('phone', digits);
                            }}
                            placeholder="Twój numer telefonu"
                            className={`${checkoutInputClass(checkoutErrors.phone)} min-w-0 flex-1 rounded-xl`}
                          />
                        </div>
                        {checkoutFieldError(showCheckoutErrors && checkoutErrors.phone, 'Pole obowiązkowe')}
                      </div>
                    </div>

                    {checkoutData.shippingMethod === 'kurier' && (
                      <>
                    <div>
                      <label className={checkoutLabelClass}>Ulica i numer domu / lokalu{requiredMark}</label>
                      <input
                        type="text"
                        required
                        value={checkoutData.street}
                        onChange={(e) => updateCheckoutField('street', e.target.value)}
                        placeholder="Twój adres"
                        className={checkoutInputClass(checkoutErrors.street)}
                      />
                      {checkoutFieldError(showCheckoutErrors && checkoutErrors.street, 'Pole obowiązkowe')}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={checkoutLabelClass}>Kod pocztowy{requiredMark}</label>
                        <input
                          type="text"
                          required
                          inputMode="numeric"
                          value={checkoutData.postalCode}
                          onChange={(e) => updateCheckoutField('postalCode', formatPostalCode(e.target.value))}
                          placeholder="Kod pocztowy"
                          className={checkoutInputClass(checkoutErrors.postalCode)}
                        />
                        {checkoutFieldError(showCheckoutErrors && checkoutErrors.postalCode, 'Pole obowiązkowe')}
                      </div>
                      <div>
                        <label className={checkoutLabelClass}>Miejscowość{requiredMark}</label>
                        <input
                          type="text"
                          required
                          value={checkoutData.city}
                          onChange={(e) => {
                            if (isLettersOnly(e.target.value)) updateCheckoutField('city', e.target.value);
                          }}
                          placeholder="Miejscowość"
                          className={checkoutInputClass(checkoutErrors.city)}
                        />
                        {checkoutFieldError(showCheckoutErrors && checkoutErrors.city, 'Pole obowiązkowe')}
                      </div>
                    </div>
                      </>
                    )}
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 shrink-0 rounded-none bg-[#161616] text-[#F4EFE6] flex items-center justify-center text-[11px] tracking-widest font-light">3</span>
                    <h2 className="text-2xl md:text-3xl font-serif font-light text-[#161616] min-w-0">Czas realizacji</h2>
                  </div>
                  <div className="space-y-4">
                    <p className="bg-[#EBE4D6] rounded-2xl px-5 py-4 text-sm text-[#7A736C]">
                      {standardFulfillmentRangeLabel()}
                    </p>
                    <label
                      className={`flex items-start gap-3 cursor-pointer bg-white rounded-2xl border-2 px-5 py-4 transition-all ${
                        checkoutData.fastDelivery
                          ? 'border-[#161616] shadow-md'
                          : 'border-[#D6C7AE] hover:border-[#C4A574]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checkoutData.fastDelivery}
                        onChange={(e) => updateCheckoutField('fastDelivery', e.target.checked)}
                        className="mt-1 w-4 h-4 accent-[#161616]"
                      />
                      <span className="text-sm font-medium text-[#161616]">
                        {expressFulfillmentRangeLabel()}
                      </span>
                    </label>
                  </div>
                </section>
              </div>

              <aside className="w-full lg:w-[380px] shrink-0 bg-[#EBE4D6] p-5 md:p-10 space-y-6">
                <h2 className="text-2xl font-serif font-light text-[#161616]">Podsumowanie zamówienia</h2>

                <div className="space-y-4">
                  {cartItems.map((item) => {
                    const petName = item.options.find((option) => option.label === 'Imię pupila')?.values[0];
                    return (
                      <div key={item.id} className="flex gap-3 items-center">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-white shrink-0 border border-[#D6C7AE]">
                          <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                        </div>
                        <p className="flex-1 min-w-0 font-bold text-[#161616]">
                          {productLineTitle(item.productName, petName)}
                        </p>
                        <span className="font-bold text-[#161616] whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <p className="text-sm text-[#7A736C] mb-2">Masz kod rabatowy?</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                      placeholder="KOD RABATOWY..."
                      className="flex-1 min-w-0 rounded-none border border-[#D6C7AE] bg-white px-4 py-2 text-base md:text-sm focus:outline-none focus:border-[#C4A574]"
                    />
                    <button
                      onClick={() => setAppliedDiscount(discountInput.trim())}
                      className="bg-[#3A5A40] hover:bg-[#2E4833] text-[#F4EFE6] px-4 md:px-6 py-2.5 rounded-none text-[11px] uppercase tracking-[0.16em] md:tracking-[0.22em] font-light shrink-0 transition-colors duration-300"
                    >
                      Zastosuj
                    </button>
                  </div>
                  {appliedDiscount && (
                    <p className="text-xs text-[#7A736C] mt-2">Zapisano kod: {appliedDiscount}</p>
                  )}
                </div>

                <div className="space-y-2 text-sm text-[#7A736C] pt-2">
                  <div className="flex justify-between">
                    <span>Wartość produktów</span>
                    <span className="font-medium text-[#161616]">{formatPrice(cartProductsValue)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Dostawa</span>
                    <span className="text-right min-w-0">
                      {selectedShipping
                        ? formatPrice(shippingCost)
                        : hasFreeShipping
                          ? '0,00 zł'
                          : 'wybierz metodę wysyłki'}
                    </span>
                  </div>
                  {checkoutData.fastDelivery && (
                    <div className="flex justify-between gap-3">
                      <span className="min-w-0">Ekspresowy czas realizacji</span>
                      <span className="font-medium text-[#161616] shrink-0">{formatPrice(fastDeliveryCost)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-baseline pt-2">
                  <span className="font-bold text-[#161616]">Razem</span>
                  <span className="text-2xl font-bold text-[#161616]">{formatPrice(checkoutTotal)}</span>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkoutData.acceptTerms}
                    onChange={(e) => updateCheckoutField('acceptTerms', e.target.checked)}
                    className="mt-1 w-4 h-4 accent-[#161616]"
                  />
                  <span className={`text-xs leading-5 ${showCheckoutErrors && checkoutErrors.acceptTerms ? 'text-red-500' : 'text-[#7A736C]'}`}>
                    Akceptuję Regulamin i potwierdzam zapoznanie się z Polityką prywatności
                  </span>
                </label>

                {checkoutSubmitError && (
                  <p className="text-xs text-red-500">{checkoutSubmitError}</p>
                )}
                <button
                  onClick={submitCheckout}
                  disabled={isPlacingOrder}
                  className="w-full bg-[#3A5A40] hover:bg-[#2E4833] text-[#F4EFE6] py-3.5 rounded-none text-[11px] uppercase tracking-[0.16em] md:tracking-[0.22em] font-light transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPlacingOrder ? 'Składanie zamówienia...' : 'Złóż zamówienie'}
                </button>
              </aside>
            </div>
          </div>
        )}

        {/* ZAKŁADKA: Panel administratora */}
        {activeTab === 'admin' && <AdminPanel />}

        {/* ZAKŁADKA: Konfigurator produktu */}
        {activeTab === 'configurator' && !isTagConfigurator && (
          <div className="max-w-3xl mx-auto px-5 md:px-12 py-12 md:py-24 space-y-6 text-center">
            <span className="text-[#C4A574] font-light uppercase tracking-[0.28em] text-[11px]">Konfigurator</span>
            <h1 className="text-4xl md:text-6xl font-serif font-light text-[#161616]">{activeProduct.name}</h1>
            <p className="text-sm text-[#7A736C] font-light leading-relaxed">
              Konfigurator tego produktu pojawi się wkrótce.
            </p>
            <div className="pt-4">
              <button
                onClick={() => goToTab('products')}
                className="bg-[#3A5A40] hover:bg-[#2E4833] text-[#F4EFE6] px-6 sm:px-10 py-4 rounded-none text-[11px] uppercase tracking-[0.16em] md:tracking-[0.22em] font-light transition-colors duration-300 w-full sm:w-auto"
              >
                Wróć do produktów
              </button>
            </div>
          </div>
        )}

        {/* ZAKŁADKA: Adresówka biżuteryjna */}
        {activeTab === 'configurator' && isTagConfigurator && (
          <div>
            {/* Układ dwukolumnowy z panelem podsumowania po prawej */}
            <div className={`mx-auto px-4 md:px-12 py-8 md:py-20 flex flex-col gap-8 md:gap-12 items-start ${currentStep >= totalSteps ? 'max-w-3xl' : 'max-w-6xl lg:flex-row'}`}>
              
              {/* Kolumna główna (formularz/opcje) */}
              <div className="flex-grow min-w-0">
                <div className="bg-[#F9F5ED] p-4 md:p-16 border border-[#D6C7AE] min-h-0 md:min-h-[450px] flex flex-col">
                  <div className="space-y-6 md:space-y-8">
                    <span className="text-[#C4A574] font-light uppercase tracking-[0.22em] md:tracking-[0.28em] text-[11px]">Krok {currentStep} z {totalSteps} · {activeProduct.name}</span>
                    <h2 className="text-2xl md:text-4xl font-serif font-light text-[#161616]">
                      {stepsInfo[currentStep - 1].label}
                    </h2>
                    
                    <div className="pt-4">
                      {contentStep === 1 && (
                        <div className="space-y-4">
                          <p className="font-bold text-base text-[#161616]">Wybierz kolor oprawy, który najlepiej podkreśli styl Twojego pupila:</p>
                          <div className={imageGridClass(ringsList.length)}>
                            {ringsList.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => setFormData({
                                  ...formData,
                                  ringColor: item.id,
                                  baseOption: basesForRing(item.id)[0]?.id ?? '1',
                                })}
                                className={`cursor-pointer rounded-none p-3 md:p-8 border transition-colors duration-300 flex flex-col items-stretch ${
                                  formData.ringColor === item.id ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                }`}
                              >
                                <div className="w-full aspect-square md:aspect-[4/5] bg-[#EFE8DC] mb-3 md:mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
                                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-base font-medium text-[#161616] text-center">{item.title}</span>
                                <ul className="mt-1 w-full -ml-1 md:-ml-1.5 text-left text-[7px] md:text-[8px] text-[#7A736C] space-y-0.5 leading-tight">
                                  {item.details.map((detail) => (
                                    <li key={detail.label} className="whitespace-nowrap">
                                      <span className="text-[#161616]">{detail.label}:</span>{' '}
                                      {detail.value}
                                    </li>
                                  ))}
                                </ul>
                                <div className={`w-5 h-5 rounded-full border mt-3 self-center flex items-center justify-center transition-all ${formData.ringColor === item.id ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'}`}>
                                  {formData.ringColor === item.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {contentStep === 2 && (
                        <div className="space-y-4">
                          <p className="font-bold text-base text-[#161616]">
                            {isGlowTagConfigurator ? (
                              'Wybierz kolor adresówki'
                            ) : (
                              <>
                                Wybierz bazę (dla oprawy: <span className="uppercase text-[#C4A574]">{oprawaLabel(formData.ringColor)}</span>):
                              </>
                            )}
                          </p>
                          <div className={imageGridClass(selectedBases.length)}>
                            {selectedBases.map((base) => (
                              <div
                                key={base.id}
                                onClick={() => setFormData({...formData, baseOption: base.id})}
                                className={`cursor-pointer rounded-none p-3 md:p-8 border transition-colors duration-300 flex flex-col ${
                                  base.details ? 'items-stretch' : 'items-center text-center'
                                } ${
                                  formData.baseOption === base.id ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                }`}
                              >
                                <div className="w-full aspect-square md:aspect-[4/5] bg-[#EFE8DC] mb-3 md:mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
                                  {base.images && base.images.length > 1 ? (
                                    <ImageGallery items={base.images} alt={base.title} stopPropagation />
                                  ) : (
                                    <img src={basePreviewImage(base)} alt={base.title} className="w-full h-full object-cover" />
                                  )}
                                </div>
                                <span className={`text-base font-medium text-[#161616] ${base.details ? 'text-center' : ''}`}>{base.title}</span>
                                {base.details && (
                                  <ul className="mt-1 w-full -ml-1 md:-ml-1.5 text-left text-[7px] md:text-[8px] text-[#7A736C] space-y-0.5 leading-tight">
                                    {base.details.map((detail, detailIndex) => (
                                      <li key={`${base.id}-${detailIndex}`} className="whitespace-nowrap">
                                        {detail.label ? (
                                          <>
                                            <span className="text-[#161616]">{detail.label}:</span>{' '}
                                            {detail.value}
                                          </>
                                        ) : (
                                          <span className="text-[#161616]">{detail.value}</span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                <div className={`w-5 h-5 rounded-full border mt-3 self-center flex items-center justify-center transition-all ${formData.baseOption === base.id ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'}`}>
                                  {formData.baseOption === base.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {contentStep === 12 && (
                        <div className="space-y-4">
                          <p className="font-bold text-base text-[#161616]">Wybierz kolor napisu</p>
                          <div className={imageGridClass(GLOW_TEXT_OPTIONS.length)}>
                            {GLOW_TEXT_OPTIONS.map((option) => (
                              <div
                                key={option.id}
                                onClick={() => updateFormField('glowTextColor', option.id)}
                                className={`cursor-pointer rounded-none p-3 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
                                  formData.glowTextColor === option.id ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                }`}
                              >
                                <div className="w-full aspect-square md:aspect-[4/5] bg-[#EFE8DC] mb-3 md:mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
                                  <img src={option.image} alt={option.label} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-base font-medium text-[#161616]">
                                  {option.label}
                                </span>
                                <p className="mt-1 text-sm text-[#7A736C]">— {option.recommendation}</p>
                                <div className={`w-5 h-5 rounded-full border mt-3 flex items-center justify-center transition-all ${formData.glowTextColor === option.id ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'}`}>
                                  {formData.glowTextColor === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {contentStep === 3 && (
                        <div className="space-y-6">
                          <p className="font-bold text-base text-[#161616]">Wybierz swój pierwszy, darmowy charms:</p>

                          <div className={imageGridClass(charmBestsellersList.length + charmCatalogList.length)}>
                            {[...charmBestsellersList, ...charmCatalogList].map(renderFreeCharmCard)}
                          </div>

                          <div className="space-y-4">
                            <p className="font-bold text-base text-[#161616]">Charmsy w srebrnym kolorze</p>
                            <div className={imageGridClass(charmSilverList.length)}>
                              {charmSilverList.map(renderFreeCharmCard)}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <p className="font-bold text-base text-[#161616]">
                              🐾 Duże charmsy (w przypadku wyboru tego modelu napis zostanie umieszczony w dolnej części adresówki)
                            </p>
                            <div className={imageGridClass(charmLargeList.length)}>
                              {charmLargeList.map(renderFreeCharmCard)}
                            </div>
                          </div>
                        </div>
                      )}

                      {contentStep === 4 && (
                        <div className="space-y-6">
                          <p className="font-bold text-base text-[#161616]">Dodaj kolejne zawieszki, aby adresówka była jeszcze bardziej stylowa i przyciągała wzrok na spacerach</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                              { id: 'tak', label: 'Tak' },
                              { id: 'nie', label: 'Nie' },
                            ].map((option) => (
                              <div
                                key={option.id}
                                onClick={() => setFormData({
                                  ...formData, 
                                  wantExtraCharms: option.id,
                                  extraCharms: option.id === 'nie' ? [] : formData.extraCharms,
                                  extraCharmMountings: option.id === 'nie' ? {} : formData.extraCharmMountings,
                                })}
                                className={`cursor-pointer rounded-none p-6 border transition-colors duration-300 flex items-center justify-between ${
                                  formData.wantExtraCharms === option.id ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                }`}
                              >
                                <span className="text-lg font-medium text-[#161616]">{option.label}</span>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formData.wantExtraCharms === option.id ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'}`}>
                                  {formData.wantExtraCharms === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>

                          {formData.wantExtraCharms === 'tak' && (
                            <div className="space-y-4 pt-6 border-t border-[#D6C7AE]">
                              <p className="font-bold text-base text-[#161616]">Wybierz dodatkowe charms (możesz zaznaczyć wiele):</p>
                              {renderExtraCharmSections()}
                            </div>
                          )}
                        </div>
                      )}

                      {contentStep === 5 && (
                        <div className="space-y-4">
                          <p className="font-bold text-base text-[#161616]">Wybierz swój darmowy karabińczyk do mocowania:</p>
                          {renderFreeKarabinerGrid()}
                        </div>
                      )}

                      {contentStep === 6 && (
                        <div className="space-y-6">
                          <p className="font-bold text-base text-[#161616]">Dobierz dodatkowy karabińczyk, aby łatwo przepinać adresówkę między różnymi obrożami lub szelkami:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                              { id: 'tak', label: 'Tak' },
                              { id: 'nie', label: 'Nie' },
                            ].map((option) => (
                              <div
                                key={option.id}
                                onClick={() => setFormData({
                                  ...formData, 
                                  wantExtraKarabiners: option.id,
                                  extraKarabiners: option.id === 'nie' ? [] : formData.extraKarabiners
                                })}
                                className={`cursor-pointer rounded-none p-6 border transition-colors duration-300 flex items-center justify-between ${
                                  formData.wantExtraKarabiners === option.id ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                }`}
                              >
                                <span className="text-lg font-medium text-[#161616]">{option.label}</span>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formData.wantExtraKarabiners === option.id ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'}`}>
                                  {formData.wantExtraKarabiners === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>

                          {formData.wantExtraKarabiners === 'tak' && (
                            <div className="space-y-4 pt-6 border-t border-[#D6C7AE]">
                              <p className="font-bold text-base text-[#161616]">Wybierz dodatkowe karabińczyki (możesz zaznaczyć wiele):</p>
                              {renderExtraKarabinerGrid()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* KROK 7: Sznurek */}
                      {contentStep === 7 && (
                        <div className="space-y-6">
                          <p className="font-bold text-base text-[#161616]">Dodaj dedykowany, lekki i trwały sznurek na szyję, aby adresówka była zawsze na swoim miejscu (nawet bez obroży):</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                              { id: 'tak', label: 'Tak' },
                              { id: 'nie', label: 'Nie' },
                            ].map((option) => (
                              <div
                                key={option.id}
                                onClick={() => setFormData(trimStopersToStringCount({
                                  ...formData,
                                  wantString: option.id,
                                  stringLength: option.id === 'nie' ? '' : formData.stringLength,
                                  premiumStrings: option.id === 'nie' ? [] : formData.premiumStrings,
                                  classicStrings: option.id === 'nie' ? [] : formData.classicStrings,
                                  glowStrings: option.id === 'nie' ? [] : formData.glowStrings,
                                  extraStopers: option.id === 'nie' ? [] : formData.extraStopers,
                                }))}
                                className={`cursor-pointer rounded-none p-6 border transition-colors duration-300 flex items-center justify-between ${
                                  formData.wantString === option.id ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                }`}
                              >
                                <span className="text-lg font-medium text-[#161616]">{option.label}</span>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formData.wantString === option.id ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'}`}>
                                  {formData.wantString === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>

                          {formData.wantString === 'tak' && (
                            <div className="space-y-6 pt-6 border-t border-[#D6C7AE]">
                              <div className="space-y-2">
                                <label className="block font-bold text-base text-[#161616]">Wpisz obwód szyi Twojego pieska w centymetrach:</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={formData.stringLength}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (!/^\d*$/.test(val)) return;
                                    if (val === '') {
                                      setFormData({ ...formData, stringLength: '' });
                                      return;
                                    }
                                    if (val.length > 2) return;
                                    const num = Number(val);
                                    if (num > NECK_CIRCUMFERENCE_MAX) return;
                                    if (val.length === 1 && num >= 1 && num <= 9) {
                                      setFormData({ ...formData, stringLength: val });
                                      return;
                                    }
                                    if (num >= NECK_CIRCUMFERENCE_MIN && num <= NECK_CIRCUMFERENCE_MAX) {
                                      setFormData({ ...formData, stringLength: val });
                                    }
                                  }}
                                  placeholder="wpisz obwód szyi (15–99 cm)"
                                  className="w-full md:w-1/2 p-3 rounded-xl border border-[#D6C7AE] focus:outline-none focus:border-[#161616] bg-white"
                                />
                                {stringSizeText && (
                                  <div className="w-full md:w-1/2 p-3 rounded-xl border border-[#D6C7AE] bg-[#F4EFE6] font-bold text-base text-[#161616]">
                                    {stringSizeText}
                                  </div>
                                )}
                              </div>

                              {isGlowTagConfigurator && (
                                <section className="rounded-xl border border-[#D6C7AE] bg-white overflow-hidden">
                                  <div className="px-4 md:px-6 py-3 md:py-4 border-b border-[#D6C7AE] bg-[#F4EFE6]">
                                    <h3 className="font-bold text-lg text-[#161616]">
                                      Dodaj sznurek Glow (możesz wybrać wiele)
                                      {glowStringPrice ? ` — ${glowStringPrice} zł/szt` : ''}
                                    </h3>
                                  </div>
                                  <div className="p-4 md:p-6">
                                    <div className={imageGridClass(glowStringsList.length)}>
                                      {glowStringsList.map((item) => {
                                        const isSelected = formData.glowStrings.includes(item.id);
                                        return (
                                          <div
                                            key={item.id}
                                            onClick={() => toggleGlowString(item.id)}
                                            className={`cursor-pointer rounded-none p-3 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
                                              isSelected ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                            }`}
                                          >
                                            <div className="w-full mb-3 md:mb-5">
                                              <ImageGallery items={item.images} alt={item.title} stopPropagation />
                                            </div>
                                            <span className="text-base font-medium text-[#161616]">{item.title}</span>
                                            <div className={`w-5 h-5 rounded-md border mt-3 flex items-center justify-center transition-all ${isSelected ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'}`}>
                                              {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </section>
                              )}

                              <section className="rounded-xl border border-[#D6C7AE] bg-white overflow-hidden">
                                <div className="px-4 md:px-6 py-3 md:py-4 border-b border-[#D6C7AE] bg-[#F4EFE6]">
                                  <h3 className="font-bold text-lg text-[#161616]">
                                    Dodaj sznurek Premium (możesz wybrać wiele)
                                    {premiumStringPrice ? ` — ${premiumStringPrice} zł/szt` : ''}
                                  </h3>
                                </div>
                                <div className="p-4 md:p-6">
                                  <div className={imageGridClass(premiumStringsList.length)}>
                                    {premiumStringsList.map((item) => {
                                      const isSelected = formData.premiumStrings.includes(item.id);
                                      return (
                                        <div
                                          key={item.id}
                                          onClick={() => togglePremiumString(item.id)}
                                          className={`cursor-pointer rounded-none p-3 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
                                            isSelected ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                          }`}
                                        >
                                          <div className="w-full mb-3 md:mb-5">
                                            <ImageGallery items={item.images} alt={item.title} stopPropagation />
                                          </div>
                                          <span className="text-base font-medium text-[#161616]">{item.title}</span>
                                          <div className={`w-5 h-5 rounded-md border mt-3 flex items-center justify-center transition-all ${isSelected ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'}`}>
                                            {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </section>

                              <section className="rounded-xl border border-[#D6C7AE] bg-white overflow-hidden">
                                <div className="px-4 md:px-6 py-3 md:py-4 border-b border-[#D6C7AE] bg-[#F4EFE6]">
                                  <h3 className="font-bold text-lg text-[#161616]">
                                    Dodaj sznurek Klasyczny (możesz wybrać wiele)
                                    {classicStringPrice ? ` — ${classicStringPrice} zł/szt` : ''}
                                  </h3>
                                </div>
                                <div className="p-4 md:p-6">
                                  <div className={imageGridClass(classicStringsList.length)}>
                                    {classicStringsList.map((item) => {
                                      const isSelected = formData.classicStrings.includes(item.id);
                                      return (
                                        <div
                                          key={item.id}
                                          onClick={() => toggleClassicString(item.id)}
                                          className={`cursor-pointer rounded-none p-3 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
                                            isSelected ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                          }`}
                                        >
                                          <div className="w-full mb-3 md:mb-5">
                                            <ImageGallery items={item.images} alt={item.title} stopPropagation />
                                          </div>
                                          <span className="text-base font-medium text-[#161616]">{item.title}</span>
                                          <div className={`w-5 h-5 rounded-md border mt-3 flex items-center justify-center transition-all ${isSelected ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'}`}>
                                            {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </section>
                            </div>
                          )}
                        </div>
                      )}

                      {contentStep === 8 && (
                        <div className="space-y-6">
                          <p className="font-bold text-base text-[#161616]">Dodaj stopery, aby precyzyjnie regulować długość sznurka i zapewnić psu maksymalny komfort:</p>

                          <div className="rounded-none border border-[#D6C7AE] bg-[#F4EFE6] p-4 space-y-1">
                            <p className="font-bold text-base text-[#161616]">
                              Sznurki do kompletu: {selectedStringsCount}
                            </p>
                            {stringSelectionSummaryParts.length > 0 ? (
                              <p className="text-sm text-[#7A736C]">{stringSelectionSummaryParts.join(' · ')}</p>
                            ) : (
                              <p className="text-sm text-[#7A736C]">Brak dobranych sznurków — wróć do poprzedniego kroku, aby je dodać.</p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                              { id: 'tak', label: 'Tak' },
                              { id: 'nie', label: 'Nie' },
                            ].map((option) => (
                              <div
                                key={option.id}
                                onClick={() => setFormData({
                                  ...formData,
                                  wantStopers: option.id,
                                  extraStopers: option.id === 'nie' ? [] : formData.extraStopers,
                                })}
                                className={`cursor-pointer rounded-none p-6 border transition-colors duration-300 flex items-center justify-between ${
                                  formData.wantStopers === option.id ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                }`}
                              >
                                <span className="text-lg font-medium text-[#161616]">{option.label}</span>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formData.wantStopers === option.id ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'}`}>
                                  {formData.wantStopers === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>

                          {formData.wantStopers === 'tak' && selectedStringsCount === 0 && (
                            <p className="text-sm text-red-500">Najpierw dodaj sznurek w poprzednim kroku.</p>
                          )}

                          {formData.wantStopers === 'tak' && selectedStringsCount > 0 && (
                            <div className="space-y-4 pt-6 border-t border-[#D6C7AE]">
                              <p className="font-bold text-base text-[#161616]">Wybierz stopery (możesz powtórzyć ten sam wariant):</p>
                              <div className={imageGridClass(stopersList.length)}>
                                {stopersList.map((stoper) => {
                                  const count = formData.extraStopers.filter((id) => id === stoper.id).length;
                                  const isSelected = count > 0;
                                  const canAdd = formData.extraStopers.length < selectedStringsCount;
                                  const stepperButtonClass =
                                    'w-8 h-8 border flex items-center justify-center text-lg font-light transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed';

                                  return (
                                    <div
                                      key={stoper.id}
                                      className={`rounded-none p-3 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
                                        isSelected ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white'
                                      }`}
                                    >
                                      <div className="w-full aspect-square md:aspect-[4/5] bg-[#EFE8DC] mb-3 md:mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
                                        <img src={stoper.image} alt={stoper.title} className="w-full h-full object-cover" />
                                      </div>
                                      <span className="text-base font-medium text-[#161616]">{stoper.title}</span>
                                      {isSelected ? (
                                        <div className="mt-3 flex items-center gap-3">
                                          <button
                                            type="button"
                                            onClick={() => removeStopper(stoper.id)}
                                            className={`${stepperButtonClass} border-[#3A5A40] text-[#3A5A40] hover:bg-[#3A5A40] hover:text-[#F4EFE6]`}
                                            aria-label={`Usuń ${stoper.title}`}
                                          >
                                            −
                                          </button>
                                          <span className="min-w-[1.25rem] text-base font-medium text-[#161616] tabular-nums">{count}</span>
                                          <button
                                            type="button"
                                            onClick={() => addStopper(stoper.id)}
                                            disabled={!canAdd}
                                            className={`${stepperButtonClass} border-[#3A5A40] text-[#3A5A40] hover:bg-[#3A5A40] hover:text-[#F4EFE6]`}
                                            aria-label={`Dodaj ${stoper.title}`}
                                          >
                                            +
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => addStopper(stoper.id)}
                                          disabled={!canAdd}
                                          className={`${stepperButtonClass} mt-3 border-[#D6C7AE] text-[#161616] hover:border-[#3A5A40] hover:text-[#3A5A40]`}
                                          aria-label={`Dodaj ${stoper.title}`}
                                        >
                                          +
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <p className={`text-sm ${showStopperErrors && !isStopperSelectionComplete ? 'text-red-500' : 'text-[#7A736C]'}`}>
                                Wybrano stopery: {formData.extraStopers.length} / {selectedStringsCount}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {contentStep === 9 && (
                        <div className="space-y-6">
                          <p className="font-bold text-base text-[#161616]">Wybierz ulubioną grafikę pieska i stwórz wyjątkową adresówkę dla swojego pupila.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                              { id: 'tak', label: 'Tak' },
                              { id: 'nie', label: 'Nie' },
                            ].map((option) => (
                              <div
                                key={option.id}
                                onClick={() => setFormData({
                                  ...formData, 
                                  wantSticker: option.id,
                                  stickerOption: option.id === 'nie' ? '' : formData.stickerOption
                                })}
                                className={`cursor-pointer rounded-none p-6 border transition-colors duration-300 flex items-center justify-between ${
                                  formData.wantSticker === option.id ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                }`}
                              >
                                <span className="text-lg font-medium text-[#161616]">{option.label}</span>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formData.wantSticker === option.id ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'}`}>
                                  {formData.wantSticker === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>

                          {formData.wantSticker === 'tak' && (
                            <div className="space-y-4 pt-6 border-t border-[#D6C7AE]">
                              <p className="font-bold text-base text-[#161616]">Wybierz naklejkę:</p>
                              <div className={imageGridClass(stickersList.length)}>
                                {stickersList.map((sticker) => (
                                  <div
                                    key={sticker.id}
                                    onClick={() => setFormData({ ...formData, stickerOption: sticker.id })}
                                    className={`cursor-pointer rounded-none p-3 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
                                      formData.stickerOption === sticker.id ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                    }`}
                                  >
                                    <div className="w-full aspect-square md:aspect-[4/5] bg-[#EFE8DC] mb-3 md:mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
                                      <img src={sticker.image} alt={sticker.title} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-base font-medium text-[#161616]">{sticker.title}</span>
                                    <div className={`w-5 h-5 rounded-full border mt-3 flex items-center justify-center transition-all ${formData.stickerOption === sticker.id ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'}`}>
                                      {formData.stickerOption === sticker.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {contentStep === 11 && (
                        <div className="space-y-6">
                          {summaryLines}
                          <p className="text-xs text-[#7A736C] font-light leading-relaxed">
                            Zgodnie z Regulaminem sklepu produkt personalizowany nie podlega zwrotowi.
                          </p>
                          <button
                            onClick={addToCart}
                            disabled={showAddedToCart}
                            className={`w-full py-3.5 rounded-none text-[11px] uppercase tracking-[0.22em] font-light transition-colors duration-300 ${
                              showAddedToCart
                                ? 'bg-[#C4A574] text-[#161616] cursor-default'
                                : 'bg-[#3A5A40] text-[#F4EFE6] hover:bg-[#2E4833]'
                            }`}
                          >
                            {showAddedToCart ? 'Dodano do koszyka' : 'Dodaj do koszyka'}
                          </button>
                        </div>
                      )}

                      {contentStep === 10 && (
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <label className="block font-bold text-base text-[#161616]">Imię Twojego psa</label>
                            <input
                              type="text"
                              value={formData.petName}
                              onChange={(e) => {
                                const value = e.target.value.toLocaleUpperCase('pl-PL');
                                if (!isLettersOnly(value)) return;
                                const nameLength = value.trim().length;
                                setFormData((prev) => ({
                                  ...prev,
                                  petName: value,
                                  nameLayout: nameLength > 6 ? 'imie6plus' : prev.nameLayout,
                                }));
                              }}
                              placeholder="Wpisz imię"
                              className={`w-full p-3 rounded-xl border bg-white text-base md:text-sm focus:outline-none focus:border-[#161616] ${showOrderErrors && orderErrors.petName ? 'border-red-400' : 'border-[#D6C7AE]'}`}
                            />
                            {showOrderErrors && orderErrors.petName && (
                              <p className="text-xs text-red-500">Wpisz imię psa (tylko litery).</p>
                            )}
                          </div>

                          <div className="space-y-3 flex flex-col items-center text-center">
                            <label className="block font-bold text-base text-[#161616]">Układ liter na adresówce</label>
                            {formData.petName.trim().length > 6 ? (
                              <img
                                src="/imie6plus.jpg"
                                alt="Układ liter na adresówce — powyżej 6 liter"
                                className="w-full max-w-[9.33rem] border border-[#D6C7AE] bg-[#EFE8DC]"
                              />
                            ) : (
                              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                                {[
                                  { id: 'imie6' as const, image: '/imie6.jpg', alt: 'Układ liter — do 6 liter, wariant 1' },
                                  { id: 'imie6plus' as const, image: '/imie6plus.jpg', alt: 'Układ liter — do 6 liter, wariant 2' },
                                ].map((option) => (
                                  <div
                                    key={option.id}
                                    onClick={() => updateFormField('nameLayout', option.id)}
                                    className={`cursor-pointer rounded-none p-3 border transition-colors duration-300 flex flex-col items-center ${
                                      formData.nameLayout === option.id
                                        ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md'
                                        : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                    }`}
                                  >
                                    <img
                                      src={option.image}
                                      alt={option.alt}
                                      className="w-full max-w-[9.33rem] border border-[#D6C7AE] bg-[#EFE8DC]"
                                    />
                                    <div className={`w-5 h-5 rounded-full border mt-3 flex items-center justify-center transition-all ${
                                      formData.nameLayout === option.id ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'
                                    }`}>
                                      {formData.nameLayout === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="block font-bold text-base text-[#161616]">Numer telefonu</label>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <select
                                value={formData.phoneCode}
                                onChange={(e) => updateFormField('phoneCode', e.target.value)}
                                className="w-full sm:w-44 p-3 rounded-xl border border-[#D6C7AE] bg-white text-base md:text-sm focus:outline-none focus:border-[#161616]"
                              >
                                {countryCodes.map((item) => (
                                  <option key={item.code} value={item.code}>{item.label}</option>
                                ))}
                              </select>
                              <input
                                type="tel"
                                inputMode="numeric"
                                value={formatPhoneGroups(formData.phoneNumber, formData.phoneCode)}
                                onChange={(e) => {
                                  const digits = e.target.value.replace(/\D/g, '');
                                  if (isDigitsOnly(digits)) updateFormField('phoneNumber', digits);
                                }}
                                placeholder="Numer telefonu"
                                className={`flex-1 p-3 rounded-xl border bg-white text-base md:text-sm focus:outline-none focus:border-[#161616] ${showOrderErrors && orderErrors.phoneNumber ? 'border-red-400' : 'border-[#D6C7AE]'}`}
                              />
                            </div>
                            {showOrderErrors && orderErrors.phoneNumber && (
                              <p className="text-xs text-red-500">
                                {!formData.phoneNumber.trim()
                                  ? 'Wpisz numer telefonu (tylko cyfry).'
                                  : formData.phoneCode === '+48'
                                    ? 'Podaj poprawny numer telefonu (9 cyfr, bez zera na początku).'
                                    : 'Podaj poprawny numer telefonu dla Twojego kraju.'}
                              </p>
                            )}
                          </div>

                          <div
                            onClick={() => updateFormField('includePhoneCode', formData.includePhoneCode === 'tak' ? 'nie' : 'tak')}
                                className={`cursor-pointer rounded-none p-4 border transition-colors duration-300 flex items-center justify-between ${
                              formData.includePhoneCode === 'tak' ? 'border-[#3A5A40] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                            }`}
                          >
                            <span className="text-base font-medium text-[#161616] pr-4">
                              Umieść numer kierunkowy na adresówce
                              <span className="block text-sm font-normal text-[#7A736C] mt-1">+{DIAL_CODE_PRICE} zł</span>
                            </span>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${formData.includePhoneCode === 'tak' ? 'border-[#3A5A40] bg-[#3A5A40]' : 'border-zinc-300'}`}>
                              {formData.includePhoneCode === 'tak' && <span className="text-white text-xs font-bold">✓</span>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {currentStep < totalSteps && (
              <div
                className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:self-start"
                style={{ top: topStackHeight + 16 }}
              >
                <div className="bg-[#F9F5ED] p-5 md:p-8 border border-[#D6C7AE] space-y-6">
                  <h3 className="font-serif font-light text-2xl text-[#161616] border-b border-[#D6C7AE] pb-4">
                    Twoje podsumowanie
                  </h3>
                  {summaryLines}
                </div>
                <div className="hidden lg:flex justify-center mt-4">
                  {renderNextButton()}
                </div>
              </div>
              )}

            </div>
          </div>
        )}
      </main>
    </div>
  );
}