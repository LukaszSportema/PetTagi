'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createOrder } from './actions/orders';
import AdminPanel from './AdminPanel';
import FurgonetkaMap from './FurgonetkaMap';
import { fulfillmentMessage, PAYMENT_RECIPIENTS, type PaymentRecipientId } from '@/lib/payment';

type FormDataState = {
  ringColor: string;
  baseOption: string;
  charmOption: string;
  wantExtraCharms: string;
  extraCharms: string[];
  karabinerOption: string;
  wantExtraKarabiners: string;
  extraKarabiners: string[];
  wantString: string;
  stringLength: string;
  premiumStrings: string[];
  classicStrings: string[];
  wantStopers: string;
  extraStopers: string;
  wantSticker: string;
  stickerOption: string;
  accessoryType: string;
  petName: string;
  phoneCode: string;
  phoneNumber: string;
  includePhoneCode: string;
};

type CartItem = {
  id: string;
  quantity: number;
  price: number;
  image: string;
  options: { label: string; values: string[] }[];
  config: FormDataState;
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
  { id: 'paczkomat', title: 'Paczkomat 24/7', price: 16.49, image: '/inpost-paczkomat.svg' },
  { id: 'kurier', title: 'Kurier', price: 19.49, image: '/inpost-kurier.svg' },
];

const initialFormData: FormDataState = {
  ringColor: 'złoty',
  baseOption: '1',
  charmOption: '1',
  wantExtraCharms: 'nie',
  extraCharms: [],
  karabinerOption: '1',
  wantExtraKarabiners: 'nie',
  extraKarabiners: [],
  wantString: 'nie',
  stringLength: '',
  premiumStrings: [],
  classicStrings: [],
  wantStopers: 'nie',
  extraStopers: '',
  wantSticker: 'nie',
  stickerOption: '',
  accessoryType: 'szelki',
  petName: '',
  phoneCode: '+48',
  phoneNumber: '',
  includePhoneCode: 'nie',
};

type PlacedOrder = {
  orderId: string;
  total: number;
  fastDelivery: boolean;
  paymentRecipient: PaymentRecipientId;
};

const formatPrice = (value: number) => `${value.toFixed(2).replace('.', ',')} zł`;

export default function Home() {
  const [activeTab, setActiveTab] = useState('configurator');
  const [currentStep, setCurrentStep] = useState(1);
  const [isHeaderOpen, setIsHeaderOpen] = useState(false);
  const topStackRef = useRef<HTMLDivElement>(null);
  const [topStackHeight, setTopStackHeight] = useState(40);
  const totalSteps = 11;

  const [formData, setFormData] = useState<FormDataState>(initialFormData);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState('');
  const [showAddedToCart, setShowAddedToCart] = useState(false);
  const addedToCartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showRemovedFromCart, setShowRemovedFromCart] = useState(false);
  const removedFromCartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>(initialCheckoutData);
  const [showCheckoutErrors, setShowCheckoutErrors] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [checkoutSubmitError, setCheckoutSubmitError] = useState('');

  // --- LOGIKA OBLICZANIA CENY ---
  const basePrice = 50;
  const extraCharmsCost = formData.wantExtraCharms === 'tak' ? formData.extraCharms.length * 5 : 0;
  const extraKarabinersCost = formData.wantExtraKarabiners === 'tak' ? formData.extraKarabiners.length * 5 : 0;
  const extraStopersCost = formData.wantStopers === 'tak' && formData.extraStopers ? 5 : 0;
  const stickerCost = formData.wantSticker === 'tak' && formData.stickerOption ? 5 : 0;
  
  const premiumStringsCost = formData.wantString === 'tak' ? formData.premiumStrings.length * 8 : 0;
  const classicStringsCost = formData.wantString === 'tak' ? formData.classicStrings.length * 6 : 0;

  const totalPrice = basePrice + extraCharmsCost + extraKarabinersCost + extraStopersCost + stickerCost + premiumStringsCost + classicStringsCost;

  const stepsInfo = [
    { id: 1, label: 'Obręcz', icon: '💍' },
    { id: 2, label: 'Baza', icon: '🎨' },
    { id: 3, label: 'Darmowy charms', icon: '🦮' },
    { id: 4, label: 'Dodatkowe charms', icon: '🪝' },
    { id: 5, label: 'Darmowy karabińczyk', icon: '✍️' },
    { id: 6, label: 'Dodatkowe karabińczyki', icon: '✨' },
    { id: 7, label: 'Sznurek', icon: '📏' },
    { id: 8, label: 'Stopery', icon: '🧵' },
    { id: 9, label: 'Naklejka', icon: '🏷️' },
    { id: 10, label: 'Dane na adresówce', icon: '📝' },
    { id: 11, label: 'Podsumowanie zamówienia', icon: '🛒' },
  ];

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const goToTab = (tab: string) => {
    setActiveTab(tab);
    setIsHeaderOpen(tab !== 'configurator' && tab !== 'admin');
  };

  const imageGridClass = (count: number) => {
    if (count <= 1) return 'grid grid-cols-1 gap-10 md:gap-14';
    return 'grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14';
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
  const orderErrors = {
    petName: !formData.petName.trim(),
    phoneNumber: !isValidPhoneNumber(formData.phoneCode, formData.phoneNumber),
  };
  const isOrderValid = !Object.values(orderErrors).some(Boolean);

  const nextStep = () => {
    if (currentStep === 10) {
      setShowOrderErrors(true);
      if (!isOrderValid) return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const backButtonClass = "px-5 py-2.5 rounded-none border border-[#D6C7AE] text-[10px] md:text-[11px] uppercase tracking-[0.22em] font-light text-[#161616] hover:bg-[#EBE4D6] transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap shrink-0";
  const nextButtonClass = "px-5 md:px-7 py-2.5 rounded-none bg-[#161616] text-[#F4EFE6] text-[10px] md:text-[11px] uppercase tracking-[0.22em] font-light hover:bg-[#3A3A3A] transition-colors duration-300 whitespace-nowrap shrink-0";

  const renderBackButton = () => (
    <button
      onClick={prevStep}
      disabled={currentStep === 1}
      className={backButtonClass}
    >
      &larr; Wstecz
    </button>
  );

  const renderNextButton = () => (
    currentStep < 11 ? (
      <button onClick={nextStep} className={nextButtonClass}>
        Dalej &rarr;
      </button>
    ) : (
      <span className="px-4 md:px-6 py-2 text-xs md:text-sm whitespace-nowrap shrink-0 invisible" aria-hidden>
        Dodaj do koszyka
      </span>
    )
  );

  const ringsList = [
    { id: 'złoty', title: 'Złoty', image: '/rings/gold.jpg' },
    { id: 'srebrny', title: 'Srebrny', image: '/rings/silver.jpg' },
  ];

  const goldBases = Array.from({ length: 16 }, (_, i) => ({
    id: String(i + 1),
    title: `Podpis ${i + 1}`,
    image: `/baza/${i + 1}.jpg`,
  }));

  const silverBases = Array.from({ length: 8 }, (_, i) => ({
    id: String(i + 17),
    title: `Podpis ${i + 17}`,
    image: `/baza/${i + 17}.jpg`,
  }));

  const charmsList = Array.from({ length: 53 }, (_, i) => ({
    id: String(i + 1),
    title: `Podpis ${i + 1}`,
    image: `/charms/${i + 1}.jpg`,
  }));

  const karabinersList = Array.from({ length: 12 }, (_, i) => ({
    id: String(i + 1),
    title: `Podpis ${i + 1}`,
    image: `/karabinczyk/${i + 1}.jpg`,
  }));

  const premiumStringsList = Array.from({ length: 8 }, (_, i) => ({
    id: String(i + 1),
    title: `Podpis ${i + 1}`,
    image: `/sznurek/${i + 1}.jpg`,
  }));

  const stopersList = [
    { id: '1', title: 'Złote', image: '/stopery/1.png' },
    { id: '2', title: 'Srebrne', image: '/stopery/2.png' },
  ];

  const stickersList = [
    { id: '1', title: 'Pies 1', image: '/naklejki/1.png' },
    { id: '2', title: 'Pies 2', image: '/naklejki/2.png' },
    { id: '3', title: 'Pies 3', image: '/naklejki/3.png' },
    { id: '4', title: 'Pies 4', image: '/naklejki/4.png' },
    { id: '5', title: 'Pies 5', image: '/naklejki/5.png' },
    { id: '6', title: 'Pies 6', image: '/naklejki/6.png' },
  ];

  const classicStringsList = [
    { id: '9', title: 'Podpis 1', image: '/sznurek/9.jpg' },
    { id: '10', title: 'Podpis 2', image: '/sznurek/10.jpg' },
    { id: '11', title: 'Podpis 3', image: '/sznurek/11.jpg' },
    { id: '12', title: 'Podpis 4', image: '/sznurek/12.jpg' },
    { id: '13', title: 'Podpis 5', image: '/sznurek/13.jpg' },
    { id: '14', title: 'Podpis 6', image: '/sznurek/14.jpg' },
    { id: '15', title: 'Podpis 7', image: '/sznurek/15.jpg' },
    { id: '16', title: 'Podpis 8', image: '/sznurek/16.jpg' },
    { id: '17', title: 'Podpis 9', image: '/sznurek/17.jpg' },
    { id: '18', title: 'Podpis 10', image: '/sznurek/18.jpg' },
  ];

  const findTitle = (list: { id: string; title: string }[], id: string, fallback: string) =>
    list.find((item) => item.id === id)?.title ?? fallback;

  const buildCartItem = (): CartItem => {
    const bases = formData.ringColor === 'złoty' ? goldBases : silverBases;
    const options = [
      { label: 'Obręcz', values: [formData.ringColor === 'złoty' ? 'Złoty' : 'Srebrny'] },
      { label: 'Baza', values: [findTitle(bases, formData.baseOption, `Opcja nr ${formData.baseOption}`)] },
      { label: 'Darmowy charms', values: [findTitle(charmsList, formData.charmOption, `Opcja nr ${formData.charmOption}`)] },
    ];

    if (formData.wantExtraCharms === 'tak' && formData.extraCharms.length > 0) {
      options.push({
        label: 'Dodatkowe charms',
        values: formData.extraCharms.map((id) => findTitle(charmsList, id, id)),
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

    if (formData.wantString === 'tak' && formData.stringLength) {
      options.push({
        label: 'Obwód szyi',
        values: [`${formData.stringLength} cm`],
      });
    }

    if (formData.wantStopers === 'tak' && formData.extraStopers) {
      options.push({
        label: 'Stopery',
        values: [formData.extraStopers === '1' ? 'Złote' : 'Srebrne'],
      });
    }

    if (formData.wantSticker === 'tak' && formData.stickerOption) {
      options.push({
        label: 'Naklejka',
        values: [findTitle(stickersList, formData.stickerOption, `Pies ${formData.stickerOption}`)],
      });
    }

    options.push({ label: 'Imię pupila', values: [formData.petName] });
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
      quantity: 1,
      price: totalPrice,
      image: [...goldBases, ...silverBases].find((base) => base.id === formData.baseOption)?.image
        ?? bases[0]?.image
        ?? `/baza/${formData.baseOption}.jpg`,
      options,
      config: { ...formData },
    };
  };

  const addToCart = () => {
    setShowOrderErrors(true);
    if (!isOrderValid || showAddedToCart) return;
    setCartItems((prev) => [...prev, buildCartItem()]);
    setShowAddedToCart(true);
    if (addedToCartTimeoutRef.current) clearTimeout(addedToCartTimeoutRef.current);
    addedToCartTimeoutRef.current = setTimeout(() => {
      setFormData(initialFormData);
      setShowOrderErrors(false);
      setCurrentStep(1);
      goToTab('configurator');
      setShowAddedToCart(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1000);
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    setShowRemovedFromCart(true);
    if (removedFromCartTimeoutRef.current) clearTimeout(removedFromCartTimeoutRef.current);
    removedFromCartTimeoutRef.current = setTimeout(() => setShowRemovedFromCart(false), 3000);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartProductsValue = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const selectedShipping = shippingOptions.find((option) => option.id === checkoutData.shippingMethod);
  const shippingCost = selectedShipping?.price ?? 0;
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
    street: !checkoutData.street.trim(),
    postalCode: checkoutData.postalCode.replace(/\D/g, '').length !== 5,
    city: !checkoutData.city.trim(),
    shippingMethod: !checkoutData.shippingMethod,
    pickupPoint: checkoutData.shippingMethod === 'paczkomat' && !checkoutData.pickupPointName,
    acceptTerms: !checkoutData.acceptTerms,
  };
  const isCheckoutValid = !Object.values(checkoutErrors).some(Boolean);

  const checkoutInputClass = (hasError: boolean) =>
    `w-full bg-white rounded-none border px-4 py-3 text-sm focus:outline-none ${
      showCheckoutErrors && hasError ? 'border-red-400' : 'border-[#D6C7AE] focus:border-[#C4A574]'
    }`;
  const checkoutLabelClass = 'block text-[11px] font-light tracking-[0.22em] text-[#9A9288] uppercase mb-1.5';
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
      clientAddress: checkoutData.street,
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
          ringColor: config.ringColor,
          baseColor: config.baseOption,
          baseCharms: config.charmOption,
          extraCharms: config.wantExtraCharms === 'tak' ? config.extraCharms : [],
          baseCarabiner: config.karabinerOption,
          extraCarabiner: config.wantExtraKarabiners === 'tak' ? config.extraKarabiners : [],
          stringPremium: config.wantString === 'tak' ? config.premiumStrings : [],
          stringClassic: config.wantString === 'tak' ? config.classicStrings : [],
          dogNeck: config.wantString === 'tak' && config.stringLength ? `${config.stringLength} cm` : null,
          stoppers: config.wantStopers === 'tak' && config.extraStopers
            ? (config.extraStopers === '1' ? 'złote' : 'srebrne')
            : null,
          sticker: config.wantSticker === 'tak' ? config.stickerOption || null : null,
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

  const toggleExtraCharm = (id: string) => {
    setFormData((prev) => {
      const exists = prev.extraCharms.includes(id);
      if (exists) {
        return { ...prev, extraCharms: prev.extraCharms.filter((item) => item !== id) };
      } else {
        return { ...prev, extraCharms: [...prev.extraCharms, id] };
      }
    });
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
      if (exists) {
        return { ...prev, premiumStrings: prev.premiumStrings.filter((item) => item !== id) };
      } else {
        return { ...prev, premiumStrings: [...prev.premiumStrings, id] };
      }
    });
  };

  const toggleClassicString = (id: string) => {
    setFormData((prev) => {
      const exists = prev.classicStrings.includes(id);
      if (exists) {
        return { ...prev, classicStrings: prev.classicStrings.filter((item) => item !== id) };
      } else {
        return { ...prev, classicStrings: [...prev.classicStrings, id] };
      }
    });
  };

  const summaryLines = (
    <>
      <div className="space-y-3 text-sm text-[#7A736C]">
        <div className="flex justify-between items-start gap-4">
          <span className="font-serif font-bold text-lg text-[#161616]">Adresówka</span>
          <span className="font-bold text-lg text-[#161616] shrink-0 text-right tabular-nums">50 zł</span>
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
            <span className="shrink-0 text-right whitespace-nowrap tabular-nums">+{formData.premiumStrings.length * 8} zł (8 zł/szt)</span>
          </div>
        )}

        {formData.wantString === 'tak' && formData.classicStrings.length > 0 && (
          <div className="flex justify-between items-start gap-4 text-xs italic text-[#7E746C]">
            <span className="min-w-0 pl-3">Sznurek Klasyczny x{formData.classicStrings.length}</span>
            <span className="shrink-0 text-right whitespace-nowrap tabular-nums">+{formData.classicStrings.length * 6} zł (6 zł/szt)</span>
          </div>
        )}

        {formData.wantStopers === 'tak' && formData.extraStopers && (
          <div className="flex justify-between items-start gap-4 text-xs italic text-[#7E746C]">
            <span className="min-w-0 pl-3">Stopery ({formData.extraStopers === '1' ? 'Złote' : 'Srebrne'})</span>
            <span className="shrink-0 text-right whitespace-nowrap tabular-nums">+5 zł</span>
          </div>
        )}

        {formData.wantSticker === 'tak' && formData.stickerOption && (
          <div className="flex justify-between items-start gap-4 text-xs italic text-[#7E746C]">
            <span className="min-w-0 pl-3">Naklejka (Pies {formData.stickerOption})</span>
            <span className="shrink-0 text-right whitespace-nowrap tabular-nums">+5 zł</span>
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
  }, [isHeaderOpen, activeTab]);

  useEffect(() => {
    return () => {
      if (addedToCartTimeoutRef.current) clearTimeout(addedToCartTimeoutRef.current);
      if (removedFromCartTimeoutRef.current) clearTimeout(removedFromCartTimeoutRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#161616] flex flex-col font-sans selection:bg-[#D6C7AE]">
      {showRemovedFromCart && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-[#161616] text-[#F4EFE6] px-6 py-3 rounded-full shadow-lg text-sm font-medium">
          Usunięto produkt z koszyka
        </div>
      )}
      <div ref={topStackRef} className="sticky top-0 z-50 bg-[#F4EFE6]">
        <div className="bg-[#161616] text-[#F4EFE6] px-6 py-2.5 text-center">
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] font-light">
            Darmowa dostawa od 299 zł
          </p>
        </div>
        {/* Pasek sterujący zwijaniem górnej belki */}
        <div className="bg-[#EBE4D6] border-b border-[#D6C7AE] px-6 py-2 text-xs flex justify-between items-center">
          <span className="font-medium text-[#7A736C]">
            {activeTab === 'configurator' ? 'Tryb konfiguratora' : activeTab === 'cart' ? 'Koszyk' : activeTab === 'checkout' && placedOrder ? 'Dziękujemy' : activeTab === 'checkout' ? 'Dane i dostawa' : activeTab === 'admin' ? 'Panel administratora' : `Zakładka: ${activeTab}`}
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => goToTab('admin')}
              className={`px-4 py-1.5 rounded-none text-[10px] uppercase tracking-[0.2em] font-light transition-colors duration-300 ${
                activeTab === 'admin'
                  ? 'bg-[#161616] text-[#F4EFE6]'
                  : 'bg-transparent text-[#161616] border border-[#D6C7AE] hover:border-[#161616]'
              }`}
            >
              Panel
            </button>
            <button
              onClick={() => setIsHeaderOpen(!isHeaderOpen)}
              className="text-[10px] uppercase tracking-[0.2em] font-light text-[#161616] hover:text-[#C4A574] transition-colors flex items-center gap-1"
            >
              {isHeaderOpen ? '▲ Zwiń górne menu' : '▼ Pokaż górne menu'}
            </button>
          </div>
        </div>

        {/* Navbar z zakładkami */}
        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isHeaderOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            <header className="border-b border-[#D6C7AE] bg-[#F4EFE6]/90 backdrop-blur-md">
              <div className="max-w-6xl mx-auto px-8 md:px-12 h-28 flex items-center justify-between">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => goToTab('home')}>
                  <span className="font-serif font-light text-3xl tracking-[0.18em] uppercase text-[#161616]">
                    PetTagi
                  </span>
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
                  <button 
                    onClick={() => goToTab('configurator')}
                    className={`text-[11px] uppercase tracking-[0.22em] font-light transition-colors ${activeTab === 'configurator' ? 'text-[#161616] border-b border-[#161616] pb-1' : 'text-[#7A736C] hover:text-[#161616]'}`}
                  >
                    Skonfiguruj adresówkę
                  </button>
                </nav>

                <div>
                  <button 
                    onClick={() => goToTab('cart')}
                    className={`bg-[#161616] hover:bg-[#3A3A3A] text-[#F4EFE6] px-7 py-3 rounded-none text-[11px] uppercase tracking-[0.22em] font-light transition-colors duration-300 flex items-center gap-3 ${activeTab === 'cart' ? 'outline outline-1 outline-[#C4A574]' : ''}`}
                  >
                    <span>Koszyk</span>
                    <span className="bg-[#3A3A3A] text-[#F4EFE6] px-2 py-0.5 rounded-full text-xs">{cartCount}</span>
                  </button>
                </div>
              </div>
            </header>
          </div>
        </div>

        {activeTab === 'configurator' && (
          <div className="bg-white border-b border-[#D6C7AE] py-2 shadow-xs">
            <div className="px-3 md:px-4 flex items-center gap-2 md:gap-4">
              {renderBackButton()}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1.5">
                  {stepsInfo.map((step) => (
                    <div 
                      key={step.id} 
                      className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${
                        step.id === currentStep ? 'scale-105 opacity-100' : 'opacity-40'
                      }`}
                    >
                      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm border-2 ${
                        step.id === currentStep ? 'border-[#161616] bg-[#F4EFE6]' : 'border-[#D6C7AE] bg-white'
                      }`}>
                        {step.icon}
                      </div>
                      <span className="text-[7px] md:text-[8px] font-medium uppercase tracking-wider hidden md:block">{step.label}</span>
                    </div>
                  ))}
                </div>
                <div className="h-1 bg-[#D6C7AE] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#161616] transition-all duration-500" 
                    style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }} 
                  />
                </div>
              </div>
              {renderNextButton()}
            </div>
          </div>
        )}
      </div>

      <main className="flex-grow">
        
        {/* ZAKŁADKA: O nas */}
        {activeTab === 'home' && (
          <div className="max-w-4xl mx-auto px-8 md:px-12 py-28 space-y-16 text-center">
            <span className="text-[#C4A574] font-light uppercase tracking-[0.28em] text-[11px]">Witaj w świecie PetTagi</span>
            <h1 className="text-5xl md:text-7xl font-serif font-light text-[#161616] leading-[1.15]">
              Tworzymy wyjątkowe akcesoria dla Twojego pupila
            </h1>
            <p className="text-base md:text-lg text-[#7A736C] max-w-2xl mx-auto leading-relaxed font-light">
              Nasze adresówki i zawieszki powstają z pasji do zwierząt i dbałości o każdy detal. Łączymy unikalny design z najwyższą trwałością, aby Twój czworonożny przyjaciel wyglądał stylowo i był bezpieczny.
            </p>
            <div className="pt-4">
              <button 
                onClick={() => goToTab('configurator')}
                className="bg-[#161616] hover:bg-[#3A3A3A] text-[#F4EFE6] px-10 py-4 rounded-none text-[11px] uppercase tracking-[0.22em] font-light transition-colors duration-300"
              >
                Przejdź do kreatora adresówek
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 pt-16 text-left border-t border-[#D6C7AE]">
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
          <div className="max-w-5xl mx-auto px-8 md:px-12 py-24 space-y-16">
            <div className="text-center space-y-5">
              <span className="text-[#C4A574] font-light uppercase tracking-[0.28em] text-[11px]">Kolekcja</span>
              <h1 className="text-4xl md:text-6xl font-serif font-light text-[#161616]">Nasze produkty</h1>
              <p className="text-sm text-[#7A736C] font-light tracking-wide">Ręcznie tworzone adresówki i akcesoria o rzeźbiarskim detalu.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20">
              <div className="space-y-6">
                <div className="w-full aspect-[4/5] bg-[#EFE8DC] flex items-center justify-center text-5xl border border-[#D6C7AE]">💍</div>
                <h3 className="text-2xl md:text-3xl font-serif font-light">Personalizowane adresówki</h3>
                <p className="text-sm text-[#7A736C] font-light leading-relaxed">W pełni personalizowane zawieszki z imieniem i numerem telefonu, dostępne w wielu wzorach.</p>
                <button 
                  onClick={() => goToTab('configurator')}
                  className="text-[11px] uppercase tracking-[0.22em] font-light text-[#161616] border-b border-[#161616] pb-1 hover:text-[#C4A574] hover:border-[#C4A574] transition-colors"
                >
                  Skonfiguruj własną
                </button>
              </div>

              <div className="space-y-6">
                <div className="w-full aspect-[4/5] bg-[#EFE8DC] flex items-center justify-center text-5xl border border-[#D6C7AE]">🦮</div>
                <h3 className="text-2xl md:text-3xl font-serif font-light">Szelki i obroże</h3>
                <p className="text-sm text-[#7A736C] font-light leading-relaxed">Wygodne, bezpieczne i stylowe zestawy spacerowe dopasowane do każdej rasy psa.</p>
                <button 
                  onClick={() => goToTab('configurator')}
                  className="text-[11px] uppercase tracking-[0.22em] font-light text-[#161616] border-b border-[#161616] pb-1 hover:text-[#C4A574] hover:border-[#C4A574] transition-colors"
                >
                  Stwórz zestaw
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ZAKŁADKA: Koszyk */}
        {activeTab === 'cart' && (
          <div className="max-w-6xl mx-auto px-8 md:px-12 py-16 md:py-20">
            <h1 className="text-4xl md:text-6xl font-serif font-light text-[#161616] mb-14">Twój koszyk</h1>

            {cartItems.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center space-y-4 border border-[#D6C7AE]">
                <p className="text-[#7A736C]">Twój koszyk jest pusty.</p>
                <button
                  onClick={() => goToTab('configurator')}
                  className="bg-[#161616] hover:bg-[#3A3A3A] text-[#F4EFE6] px-10 py-3.5 rounded-none text-[11px] uppercase tracking-[0.22em] font-light transition-colors duration-300"
                >
                  Skonfiguruj adresówkę
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
                      <div className="w-24 h-24 md:w-32 md:h-32 overflow-hidden bg-[#EFE8DC] shrink-0 border border-[#D6C7AE]">
                        <img src={item.image} alt="Adresówka" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                          <div>
                            <h3 className="text-xl font-serif font-light text-[#161616]">
                              Adresówka{petName ? ` dla ${petName}` : ''}
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

                <aside className="w-full lg:w-[380px] shrink-0 bg-[#EBE4D6] p-8 md:p-10 space-y-6">
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
                    className="w-full bg-[#161616] hover:bg-[#3A3A3A] text-[#F4EFE6] py-3.5 rounded-none text-[11px] uppercase tracking-[0.22em] font-light transition-colors duration-300 flex items-center justify-center gap-2"
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
          <div className="max-w-3xl mx-auto px-8 md:px-12 py-16 md:py-20">
            <h1 className="text-4xl md:text-6xl font-serif font-light text-[#161616] mb-14">
              Dziękujemy za złożenie zamówienia
            </h1>
            <div className="bg-white rounded-3xl border border-[#D6C7AE] p-6 md:p-8 space-y-6">
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
                      <p>{PAYMENT_RECIPIENTS[placedOrder.paymentRecipient].accountNumber}</p>
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
          <div className="max-w-6xl mx-auto px-8 md:px-12 py-16 md:py-20">
            <button
              onClick={() => goToTab('cart')}
              className="text-[#161616] text-sm font-medium mb-6 hover:underline"
            >
              ← Wróć do koszyka
            </button>
            <h1 className="text-4xl md:text-6xl font-serif font-light text-[#161616] mb-14">Dane i dostawa</h1>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex-1 space-y-10 w-full">
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-none bg-[#161616] text-[#F4EFE6] flex items-center justify-center text-[11px] tracking-widest font-light">1</span>
                    <h2 className="text-2xl md:text-3xl font-serif font-light text-[#161616]">Dane do wysyłki</h2>
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
                            className={`w-[3.85rem] shrink-0 appearance-none bg-white rounded-xl border pl-1.5 pr-4 py-3 text-sm focus:outline-none bg-[length:10px] bg-[right_5px_center] bg-no-repeat ${
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
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-none bg-[#161616] text-[#F4EFE6] flex items-center justify-center text-[11px] tracking-widest font-light">2</span>
                    <h2 className="text-2xl md:text-3xl font-serif font-light text-[#161616]">Czas realizacji</h2>
                  </div>
                  <div className="space-y-4">
                    <p className="bg-[#EBE4D6] rounded-2xl px-5 py-4 text-sm text-[#7A736C]">
                      Standardowy czas realizacji adresówki wynosi 7-10 dni roboczych
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
                        Skróć czas realizacji do 3-5 dni roboczych - 15 zł
                      </span>
                    </label>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-none bg-[#161616] text-[#F4EFE6] flex items-center justify-center text-[11px] tracking-widest font-light">3</span>
                    <h2 className="text-2xl md:text-3xl font-serif font-light text-[#161616]">Metoda wysyłki</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
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
                          className={`bg-white rounded-2xl p-5 border-2 transition-all flex flex-col items-center ${
                            isSelected ? 'border-[#161616] shadow-md' : 'border-[#D6C7AE] hover:border-[#C4A574]'
                          } ${showCheckoutErrors && checkoutErrors.shippingMethod ? 'border-red-400' : ''}`}
                        >
                          <img
                            src={option.image}
                            alt={`InPost ${option.title}`}
                            className="h-16 w-auto max-w-[200px] object-contain"
                          />
                          <span className="mt-3 font-bold text-base text-[#161616]">{formatPrice(option.price)}</span>
                          <span className={`mt-3 w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#161616] bg-[#161616]' : 'border-zinc-300'}`}>
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
              </div>

              <aside className="w-full lg:w-[380px] shrink-0 bg-[#EBE4D6] p-8 md:p-10 space-y-6">
                <h2 className="text-2xl font-serif font-light text-[#161616]">Podsumowanie zamówienia</h2>

                <div className="space-y-4">
                  {cartItems.map((item) => {
                    const petName = item.options.find((option) => option.label === 'Imię pupila')?.values[0];
                    return (
                      <div key={item.id} className="flex gap-3 items-center">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-white shrink-0 border border-[#D6C7AE]">
                          <img src={item.image} alt="Adresówka" className="w-full h-full object-cover" />
                        </div>
                        <p className="flex-1 min-w-0 font-bold text-[#161616]">
                          Adresówka{petName ? ` dla ${petName}` : ''}
                        </p>
                        <span className="font-bold text-[#161616] whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <p className="text-sm text-[#7A736C] mb-2">Masz kod rabatowy?</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                      placeholder="KOD RABATOWY..."
                      className="flex-1 rounded-none border border-[#D6C7AE] bg-white px-4 py-2 text-sm focus:outline-none focus:border-[#C4A574]"
                    />
                    <button
                      onClick={() => setAppliedDiscount(discountInput.trim())}
                      className="bg-[#161616] hover:bg-[#3A3A3A] text-[#F4EFE6] px-6 py-2.5 rounded-none text-[11px] uppercase tracking-[0.22em] font-light shrink-0 transition-colors duration-300"
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
                  <div className="flex justify-between">
                    <span>Dostawa</span>
                    <span>{selectedShipping ? formatPrice(selectedShipping.price) : 'wybierz metodę wysyłki'}</span>
                  </div>
                  {checkoutData.fastDelivery && (
                    <div className="flex justify-between">
                      <span>Ekspresowy czas realizacji</span>
                      <span className="font-medium text-[#161616]">{formatPrice(fastDeliveryCost)}</span>
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
                  className="w-full bg-[#161616] hover:bg-[#3A3A3A] text-[#F4EFE6] py-3.5 rounded-none text-[11px] uppercase tracking-[0.22em] font-light transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPlacingOrder ? 'Składanie zamówienia...' : 'Złóż zamówienie'}
                </button>
              </aside>
            </div>
          </div>
        )}

        {/* ZAKŁADKA: Panel administratora */}
        {activeTab === 'admin' && <AdminPanel />}

        {/* ZAKŁADKA: Skonfiguruj adresówkę */}
        {activeTab === 'configurator' && (
          <div>
            {/* Układ dwukolumnowy z panelem podsumowania po prawej */}
            <div className={`mx-auto px-8 md:px-12 py-16 md:py-20 flex flex-col gap-12 ${currentStep >= 10 ? 'max-w-3xl' : 'max-w-6xl lg:flex-row'}`}>
              
              {/* Kolumna główna (formularz/opcje) */}
              <div className="flex-grow">
                <div className="bg-[#F9F5ED] p-8 md:p-16 border border-[#D6C7AE] min-h-[450px] flex flex-col">
                  <div className="space-y-8">
                    <span className="text-[#C4A574] font-light uppercase tracking-[0.28em] text-[11px]">Krok {currentStep} z {totalSteps}</span>
                    <h2 className="text-3xl md:text-4xl font-serif font-light text-[#161616]">
                      {stepsInfo[currentStep - 1].label}
                    </h2>
                    
                    <div className="pt-4">
                      {currentStep === 1 && (
                        <div className="space-y-4">
                          <p className="font-bold text-base text-[#161616]">Wybierz kolor obręczy:</p>
                          <div className={imageGridClass(ringsList.length)}>
                            {ringsList.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => setFormData({
                                  ...formData,
                                  ringColor: item.id,
                                  baseOption: item.id === 'złoty' ? '1' : '17',
                                })}
                                className={`cursor-pointer rounded-none p-6 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
                                  formData.ringColor === item.id ? 'border-[#161616] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                }`}
                              >
                                <div className="w-full aspect-[4/5] bg-[#EFE8DC] mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
                                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-base font-medium text-[#161616]">{item.title}</span>
                                <div className={`w-5 h-5 rounded-full border mt-3 flex items-center justify-center transition-all ${formData.ringColor === item.id ? 'border-[#161616] bg-[#161616]' : 'border-zinc-300'}`}>
                                  {formData.ringColor === item.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentStep === 2 && (
                        <div className="space-y-4">
                          <p className="font-bold text-base text-[#161616]">
                            Wybierz bazę (dla koloru obręczy: <span className="uppercase text-[#C4A574]">{formData.ringColor}</span>):
                          </p>
                          <div className={imageGridClass((formData.ringColor === 'złoty' ? goldBases : silverBases).length)}>
                            {(formData.ringColor === 'złoty' ? goldBases : silverBases).map((base) => (
                              <div
                                key={base.id}
                                onClick={() => setFormData({...formData, baseOption: base.id})}
                                className={`cursor-pointer rounded-none p-6 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
                                  formData.baseOption === base.id ? 'border-[#161616] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                }`}
                              >
                                <div className="w-full aspect-[4/5] bg-[#EFE8DC] mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
                                  <img src={base.image} alt={base.title} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-base font-medium text-[#161616]">{base.title}</span>
                                <div className={`w-5 h-5 rounded-full border mt-3 flex items-center justify-center transition-all ${formData.baseOption === base.id ? 'border-[#161616] bg-[#161616]' : 'border-zinc-300'}`}>
                                  {formData.baseOption === base.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentStep === 3 && (
                        <div className="space-y-4">
                          <p className="font-bold text-base text-[#161616]">Wybierz swój darmowy charms:</p>
                          <div className={imageGridClass(charmsList.length)}>
                            {charmsList.map((charm) => (
                              <div
                                key={charm.id}
                                onClick={() => setFormData({...formData, charmOption: charm.id})}
                                className={`cursor-pointer rounded-none p-6 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
                                  formData.charmOption === charm.id ? 'border-[#161616] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                }`}
                              >
                                <div className="w-full aspect-[4/5] bg-[#EFE8DC] mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
                                  <img src={charm.image} alt={charm.title} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-base font-medium text-[#161616]">{charm.title}</span>
                                <div className={`w-5 h-5 rounded-full border mt-3 flex items-center justify-center transition-all ${formData.charmOption === charm.id ? 'border-[#161616] bg-[#161616]' : 'border-zinc-300'}`}>
                                  {formData.charmOption === charm.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentStep === 4 && (
                        <div className="space-y-6">
                          <p className="font-bold text-base text-[#161616]">Czy chcesz wybrać dodatkowe, płatne charms?</p>
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
                                  extraCharms: option.id === 'nie' ? [] : formData.extraCharms
                                })}
                                className={`cursor-pointer rounded-none p-6 border transition-colors duration-300 flex items-center justify-between ${
                                  formData.wantExtraCharms === option.id ? 'border-[#161616] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                }`}
                              >
                                <span className="text-lg font-medium text-[#161616]">{option.label}</span>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formData.wantExtraCharms === option.id ? 'border-[#161616] bg-[#161616]' : 'border-zinc-300'}`}>
                                  {formData.wantExtraCharms === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>

                          {formData.wantExtraCharms === 'tak' && (
                            <div className="space-y-4 pt-6 border-t border-[#D6C7AE]">
                              <p className="font-bold text-base text-[#161616]">Wybierz dodatkowe charms (możesz zaznaczyć wiele):</p>
                              <div className={imageGridClass(charmsList.length)}>
                                {charmsList.map((charm) => {
                                  const isSelected = formData.extraCharms.includes(charm.id);
                                  return (
                                    <div
                                      key={charm.id}
                                      onClick={() => toggleExtraCharm(charm.id)}
                                      className={`cursor-pointer rounded-none p-6 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
                                        isSelected ? 'border-[#161616] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                      }`}
                                    >
                                      <div className="w-full aspect-[4/5] bg-[#EFE8DC] mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
                                        <img src={charm.image} alt={charm.title} className="w-full h-full object-cover" />
                                      </div>
                                      <span className="text-base font-medium text-[#161616]">{charm.title}</span>
                                      <div className={`w-5 h-5 rounded-md border mt-3 flex items-center justify-center transition-all ${isSelected ? 'border-[#161616] bg-[#161616]' : 'border-zinc-300'}`}>
                                        {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {currentStep === 5 && (
                        <div className="space-y-4">
                          <p className="font-bold text-base text-[#161616]">Wybierz swój darmowy karabińczyk:</p>
                          <div className={imageGridClass(karabinersList.length)}>
                            {karabinersList.map((karabiner) => (
                              <div
                                key={karabiner.id}
                                onClick={() => setFormData({...formData, karabinerOption: karabiner.id})}
                                className={`cursor-pointer rounded-none p-6 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
                                  formData.karabinerOption === karabiner.id ? 'border-[#161616] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                }`}
                              >
                                <div className="w-full aspect-[4/5] bg-[#EFE8DC] mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
                                  <img src={karabiner.image} alt={karabiner.title} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-base font-medium text-[#161616]">{karabiner.title}</span>
                                <div className={`w-5 h-5 rounded-full border mt-3 flex items-center justify-center transition-all ${formData.karabinerOption === karabiner.id ? 'border-[#161616] bg-[#161616]' : 'border-zinc-300'}`}>
                                  {formData.karabinerOption === karabiner.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentStep === 6 && (
                        <div className="space-y-6">
                          <p className="font-bold text-base text-[#161616]">Czy chcesz wybrać dodatkowe, płatne karabińczyki?</p>
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
                                  formData.wantExtraKarabiners === option.id ? 'border-[#161616] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                }`}
                              >
                                <span className="text-lg font-medium text-[#161616]">{option.label}</span>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formData.wantExtraKarabiners === option.id ? 'border-[#161616] bg-[#161616]' : 'border-zinc-300'}`}>
                                  {formData.wantExtraKarabiners === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>

                          {formData.wantExtraKarabiners === 'tak' && (
                            <div className="space-y-4 pt-6 border-t border-[#D6C7AE]">
                              <p className="font-bold text-base text-[#161616]">Wybierz dodatkowe karabińczyki (możesz zaznaczyć wiele):</p>
                              <div className={imageGridClass(karabinersList.length)}>
                                {karabinersList.map((karabiner) => {
                                  const isSelected = formData.extraKarabiners.includes(karabiner.id);
                                  return (
                                    <div
                                      key={karabiner.id}
                                      onClick={() => toggleExtraKarabiner(karabiner.id)}
                                      className={`cursor-pointer rounded-none p-6 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
                                        isSelected ? 'border-[#161616] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                      }`}
                                    >
                                      <div className="w-full aspect-[4/5] bg-[#EFE8DC] mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
                                        <img src={karabiner.image} alt={karabiner.title} className="w-full h-full object-cover" />
                                      </div>
                                      <span className="text-base font-medium text-[#161616]">{karabiner.title}</span>
                                      <div className={`w-5 h-5 rounded-md border mt-3 flex items-center justify-center transition-all ${isSelected ? 'border-[#161616] bg-[#161616]' : 'border-zinc-300'}`}>
                                        {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* KROK 7: Sznurek */}
                      {currentStep === 7 && (
                        <div className="space-y-6">
                          <p className="font-bold text-base text-[#161616]">Czy chcesz dodać sznurek?</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                              { id: 'tak', label: 'Tak' },
                              { id: 'nie', label: 'Nie' },
                            ].map((option) => (
                              <div
                                key={option.id}
                                onClick={() => setFormData({
                                  ...formData, 
                                  wantString: option.id,
                                  stringLength: option.id === 'nie' ? '' : formData.stringLength,
                                  premiumStrings: option.id === 'nie' ? [] : formData.premiumStrings,
                                  classicStrings: option.id === 'nie' ? [] : formData.classicStrings,
                                })}
                                className={`cursor-pointer rounded-none p-6 border transition-colors duration-300 flex items-center justify-between ${
                                  formData.wantString === option.id ? 'border-[#161616] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                }`}
                              >
                                <span className="text-lg font-medium text-[#161616]">{option.label}</span>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formData.wantString === option.id ? 'border-[#161616] bg-[#161616]' : 'border-zinc-300'}`}>
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
                                  value={formData.stringLength}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val)) {
                                      setFormData({ ...formData, stringLength: val });
                                    }
                                  }}
                                  placeholder="wpisz obwód szyi"
                                  className="w-full md:w-1/2 p-3 rounded-xl border border-[#D6C7AE] focus:outline-none focus:border-[#161616] bg-white"
                                />
                              </div>

                              <div className="space-y-4 pt-4">
                                <h3 className="font-bold text-lg text-[#161616]">Dodaj sznurek Premium (możesz wybrać wiele)</h3>
                                <div className={imageGridClass(premiumStringsList.length)}>
                                  {premiumStringsList.map((item) => {
                                    const isSelected = formData.premiumStrings.includes(item.id);
                                    return (
                                      <div
                                        key={item.id}
                                        onClick={() => togglePremiumString(item.id)}
                                        className={`cursor-pointer rounded-none p-6 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
                                          isSelected ? 'border-[#161616] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                        }`}
                                      >
                                        <div className="w-full aspect-[4/5] bg-[#EFE8DC] mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
                                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-base font-medium text-[#161616]">{item.title}</span>
                                        <div className={`w-5 h-5 rounded-md border mt-3 flex items-center justify-center transition-all ${isSelected ? 'border-[#161616] bg-[#161616]' : 'border-zinc-300'}`}>
                                          {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="space-y-4 pt-4">
                                <h3 className="font-bold text-lg text-[#161616]">Dodaj sznurek Klasyczny (możesz wybrać wiele)</h3>
                                <div className={imageGridClass(classicStringsList.length)}>
                                  {classicStringsList.map((item) => {
                                    const isSelected = formData.classicStrings.includes(item.id);
                                    return (
                                      <div
                                        key={item.id}
                                        onClick={() => toggleClassicString(item.id)}
                                        className={`cursor-pointer rounded-none p-6 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
                                          isSelected ? 'border-[#161616] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                        }`}
                                      >
                                        <div className="w-full aspect-[4/5] bg-[#EFE8DC] mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
                                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-base font-medium text-[#161616]">{item.title}</span>
                                        <div className={`w-5 h-5 rounded-md border mt-3 flex items-center justify-center transition-all ${isSelected ? 'border-[#161616] bg-[#161616]' : 'border-zinc-300'}`}>
                                          {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {currentStep === 8 && (
                        <div className="space-y-6">
                          <p className="font-bold text-base text-[#161616]">Czy chcesz dodać stopery?</p>
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
                                  extraStopers: option.id === 'nie' ? '' : formData.extraStopers
                                })}
                                className={`cursor-pointer rounded-none p-6 border transition-colors duration-300 flex items-center justify-between ${
                                  formData.wantStopers === option.id ? 'border-[#161616] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                }`}
                              >
                                <span className="text-lg font-medium text-[#161616]">{option.label}</span>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formData.wantStopers === option.id ? 'border-[#161616] bg-[#161616]' : 'border-zinc-300'}`}>
                                  {formData.wantStopers === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>

                          {formData.wantStopers === 'tak' && (
                            <div className="space-y-4 pt-6 border-t border-[#D6C7AE]">
                              <p className="font-bold text-base text-[#161616]">Wybierz stopery:</p>
                              <div className={imageGridClass(stopersList.length)}>
                                {stopersList.map((stoper) => (
                                  <div
                                    key={stoper.id}
                                    onClick={() => setFormData({ ...formData, extraStopers: stoper.id })}
                                    className={`cursor-pointer rounded-none p-6 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
                                      formData.extraStopers === stoper.id ? 'border-[#161616] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                    }`}
                                  >
                                    <div className="w-full aspect-[4/5] bg-[#EFE8DC] mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
                                      <img src={stoper.image} alt={stoper.title} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-base font-medium text-[#161616]">{stoper.title}</span>
                                    <div className={`w-5 h-5 rounded-full border mt-3 flex items-center justify-center transition-all ${formData.extraStopers === stoper.id ? 'border-[#161616] bg-[#161616]' : 'border-zinc-300'}`}>
                                      {formData.extraStopers === stoper.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {currentStep === 9 && (
                        <div className="space-y-6">
                          <p className="font-bold text-base text-[#161616]">Czy chcesz dodać naklejkę Twojego pieska?</p>
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
                                  formData.wantSticker === option.id ? 'border-[#161616] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                }`}
                              >
                                <span className="text-lg font-medium text-[#161616]">{option.label}</span>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formData.wantSticker === option.id ? 'border-[#161616] bg-[#161616]' : 'border-zinc-300'}`}>
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
                                    className={`cursor-pointer rounded-none p-6 md:p-8 border transition-colors duration-300 flex flex-col items-center text-center ${
                                      formData.stickerOption === sticker.id ? 'border-[#161616] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                                    }`}
                                  >
                                    <div className="w-full aspect-[4/5] bg-[#EFE8DC] mb-5 overflow-hidden border border-[#D6C7AE] flex items-center justify-center relative">
                                      <img src={sticker.image} alt={sticker.title} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-base font-medium text-[#161616]">{sticker.title}</span>
                                    <div className={`w-5 h-5 rounded-full border mt-3 flex items-center justify-center transition-all ${formData.stickerOption === sticker.id ? 'border-[#161616] bg-[#161616]' : 'border-zinc-300'}`}>
                                      {formData.stickerOption === sticker.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {currentStep === 11 && (
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
                                : 'bg-[#161616] text-[#F4EFE6] hover:bg-[#3A3A3A]'
                            }`}
                          >
                            {showAddedToCart ? 'Dodano do koszyka' : 'Dodaj do koszyka'}
                          </button>
                        </div>
                      )}

                      {currentStep === 10 && (
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <label className="block font-bold text-base text-[#161616]">Imię Twojego psa</label>
                            <input
                              type="text"
                              value={formData.petName}
                              onChange={(e) => {
                                const value = e.target.value.toLocaleUpperCase('pl-PL');
                                if (isLettersOnly(value)) updateFormField('petName', value);
                              }}
                              placeholder="Wpisz imię"
                              className={`w-full p-3 rounded-xl border bg-white focus:outline-none focus:border-[#161616] ${showOrderErrors && orderErrors.petName ? 'border-red-400' : 'border-[#D6C7AE]'}`}
                            />
                            {showOrderErrors && orderErrors.petName && (
                              <p className="text-xs text-red-500">Wpisz imię psa (tylko litery).</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="block font-bold text-base text-[#161616]">Numer telefonu</label>
                            <div className="flex gap-3">
                              <select
                                value={formData.phoneCode}
                                onChange={(e) => updateFormField('phoneCode', e.target.value)}
                                className="w-44 p-3 rounded-xl border border-[#D6C7AE] bg-white focus:outline-none focus:border-[#161616]"
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
                                className={`flex-1 p-3 rounded-xl border bg-white focus:outline-none focus:border-[#161616] ${showOrderErrors && orderErrors.phoneNumber ? 'border-red-400' : 'border-[#D6C7AE]'}`}
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
                              formData.includePhoneCode === 'tak' ? 'border-[#161616] bg-[#F4EFE6] shadow-md' : 'border-[#D6C7AE] bg-white hover:border-[#C4A574]'
                            }`}
                          >
                            <span className="text-base font-medium text-[#161616] pr-4">Umieść numer kierunkowy na adresówce</span>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${formData.includePhoneCode === 'tak' ? 'border-[#161616] bg-[#161616]' : 'border-zinc-300'}`}>
                              {formData.includePhoneCode === 'tak' && <span className="text-white text-xs font-bold">✓</span>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {currentStep < 10 && (
              <div className="w-full lg:w-80 flex-shrink-0">
                <div className="bg-[#F9F5ED] p-8 border border-[#D6C7AE] sticky space-y-6" style={{ top: topStackHeight + 16 }}>
                  <h3 className="font-serif font-light text-2xl text-[#161616] border-b border-[#D6C7AE] pb-4">
                    Twoje podsumowanie
                  </h3>
                  {summaryLines}
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