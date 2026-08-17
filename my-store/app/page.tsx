'use client';

import { useLayoutEffect, useRef, useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('configurator');
  const [currentStep, setCurrentStep] = useState(1);
  const [isHeaderOpen, setIsHeaderOpen] = useState(false);
  const topStackRef = useRef<HTMLDivElement>(null);
  const [topStackHeight, setTopStackHeight] = useState(40);
  const totalSteps = 11;

  const [formData, setFormData] = useState({
    ringColor: 'złoty',
    baseOption: '1',
    charmOption: '1',
    wantExtraCharms: 'nie',
    extraCharms: [] as string[],
    karabinerOption: '1',
    wantExtraKarabiners: 'nie',
    extraKarabiners: [] as string[],
    wantString: 'nie',
    stringLength: '',
    premiumStrings: [] as string[],
    classicStrings: [] as string[],
    wantStopers: 'nie',
    extraStopers: '',
    wantSticker: 'nie',
    stickerOption: '',
    accessoryType: 'szelki',
    firstName: '',
    lastName: '',
    email: '',
    phoneCode: '+48',
    phoneNumber: '',
    petName: '',
    tagPhoneCode: '+48',
    tagPhoneNumber: '',
  });

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
    { id: 10, label: 'Podsumowanie zamówienia', icon: '🛒' },
    { id: 11, label: 'Dane zamówienia', icon: '📝' },
  ];

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const goToTab = (tab: string) => {
    setActiveTab(tab);
    setIsHeaderOpen(tab !== 'configurator');
  };

  const imageGridClass = (count: number) => {
    if (count <= 1) return 'grid grid-cols-1 gap-6';
    if (count === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-6';
    return 'grid grid-cols-1 md:grid-cols-3 gap-6';
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
  const isEmailChars = (value: string) => /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~@-]*$/.test(value);
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const updateFormField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const [showOrderErrors, setShowOrderErrors] = useState(false);
  const orderErrors = {
    firstName: !formData.firstName.trim(),
    lastName: !formData.lastName.trim(),
    email: !isValidEmail(formData.email),
    phoneNumber: !formData.phoneNumber.trim(),
    petName: !formData.petName.trim(),
    tagPhoneNumber: !formData.tagPhoneNumber.trim(),
  };
  const isOrderValid = !Object.values(orderErrors).some(Boolean);

  const submitOrder = () => {
    setShowOrderErrors(true);
    if (!isOrderValid) return;
    alert('Zamówienie złożone!');
  };

  const backButtonClass = "px-4 py-2 rounded-full border border-[#E8E2D8] text-xs md:text-sm font-medium text-[#2C2623] hover:bg-[#F3EFEA] transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap shrink-0";
  const nextButtonClass = "px-4 md:px-6 py-2 rounded-full bg-[#2C2623] text-[#FBF9F5] text-xs md:text-sm font-medium hover:bg-[#433A35] transition-all shadow-sm whitespace-nowrap shrink-0";
  const payButtonClass = "px-4 md:px-6 py-2 rounded-full bg-[#8C6D53] text-[#FBF9F5] text-xs md:text-sm font-medium hover:bg-[#725741] transition-all shadow-sm whitespace-nowrap shrink-0";

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
    currentStep < 10 ? (
      <button onClick={nextStep} className={nextButtonClass}>
        Dalej &rarr;
      </button>
    ) : currentStep === 10 ? (
      <button onClick={nextStep} className={payButtonClass}>
        Zamawiam i płacę
      </button>
    ) : (
      <button onClick={submitOrder} className={payButtonClass}>
        Zamawiam i płacę
      </button>
    )
  );

  const ringsList = [
    { id: 'złoty', title: 'Złoty', image: '/Rings/Gold.jpg' },
    { id: 'srebrny', title: 'Srebrny', image: '/Rings/silver.jpg' },
  ];

  const goldBases = Array.from({ length: 16 }, (_, i) => ({
    id: String(i + 1),
    title: `Podpis ${i + 1}`,
    image: `/Baza/${i + 1}.jpg`,
  }));

  const silverBases = Array.from({ length: 8 }, (_, i) => ({
    id: String(i + 17),
    title: `Podpis ${i + 17}`,
    image: `/Baza/${i + 17}.jpg`,
  }));

  const charmsList = Array.from({ length: 53 }, (_, i) => ({
    id: String(i + 1),
    title: `Podpis ${i + 1}`,
    image: `/Charms/${i + 1}.jpg`,
  }));

  const karabinersList = Array.from({ length: 12 }, (_, i) => ({
    id: String(i + 1),
    title: `Podpis ${i + 1}`,
    image: `/Karabinczyk/${i + 1}.jpg`,
  }));

  const premiumStringsList = Array.from({ length: 8 }, (_, i) => ({
    id: String(i + 1),
    title: `Podpis ${i + 1}`,
    image: `/Sznurek/${i + 1}.jpg`,
  }));

  const stopersList = [
    { id: '1', title: 'Złote', image: '/Stopery/1.png' },
    { id: '2', title: 'Srebrne', image: '/Stopery/2.png' },
  ];

  const stickersList = [
    { id: '1', title: 'Pies 1', image: '/Naklejki/1.png' },
    { id: '2', title: 'Pies 2', image: '/Naklejki/2.png' },
    { id: '3', title: 'Pies 3', image: '/Naklejki/3.png' },
    { id: '4', title: 'Pies 4', image: '/Naklejki/4.png' },
    { id: '5', title: 'Pies 5', image: '/Naklejki/5.png' },
    { id: '6', title: 'Pies 6', image: '/Naklejki/6.png' },
  ];

  const classicStringsList = [
    { id: '9', title: 'Podpis 1', image: '/Sznurek/9.png' },
    { id: '10', title: 'Podpis 2', image: '/Sznurek/10.png' },
    { id: '11', title: 'Podpis 3', image: '/Sznurek/11.png' },
    { id: '12', title: 'Podpis 4', image: '/Sznurek/12.png' },
    { id: '13', title: 'Podpis 5', image: '/Sznurek/13.png' },
    { id: '14', title: 'Podpis 6', image: '/Sznurek/14.png' },
    { id: '15', title: 'Podpis 7', image: '/Sznurek/15.png' },
    { id: '16', title: 'Podpis 8', image: '/Sznurek/16.png' },
    { id: '17', title: 'Podpis 9', image: '/Sznurek/17.png' },
    { id: '18', title: 'Podpis 10', image: '/Sznurek/18.png' },
  ];

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
      <div className="space-y-3 text-sm text-[#6E635B]">
        <div className="flex justify-between items-center">
          <span className="font-serif font-bold text-lg text-[#2C2623]">Adresówka</span>
          <span className="font-bold text-lg text-[#2C2623]">50 zł</span>
        </div>

        {formData.wantExtraCharms === 'tak' && formData.extraCharms.length > 0 && (
          <div className="flex justify-between text-xs italic pl-3 text-[#7E746C]">
            <span>Dodatkowe charms x{formData.extraCharms.length}</span>
            <span>+{formData.extraCharms.length * 5} zł (5 zł/szt)</span>
          </div>
        )}

        {formData.wantExtraKarabiners === 'tak' && formData.extraKarabiners.length > 0 && (
          <div className="flex justify-between text-xs italic pl-3 text-[#7E746C]">
            <span>Dodatkowe karabińczyki x{formData.extraKarabiners.length}</span>
            <span>+{formData.extraKarabiners.length * 5} zł (5 zł/szt)</span>
          </div>
        )}

        {formData.wantString === 'tak' && formData.premiumStrings.length > 0 && (
          <div className="flex justify-between text-xs italic pl-3 text-[#7E746C]">
            <span>Sznurek Premium x{formData.premiumStrings.length}</span>
            <span>+{formData.premiumStrings.length * 8} zł (8 zł/szt)</span>
          </div>
        )}

        {formData.wantString === 'tak' && formData.classicStrings.length > 0 && (
          <div className="flex justify-between text-xs italic pl-3 text-[#7E746C]">
            <span>Sznurek Klasyczny x{formData.classicStrings.length}</span>
            <span>+{formData.classicStrings.length * 6} zł (6 zł/szt)</span>
          </div>
        )}

        {formData.wantStopers === 'tak' && formData.extraStopers && (
          <div className="flex justify-between text-xs italic pl-3 text-[#7E746C]">
            <span>Stopery ({formData.extraStopers === '1' ? 'Złote' : 'Srebrne'})</span>
            <span>+5 zł</span>
          </div>
        )}

        {formData.wantSticker === 'tak' && formData.stickerOption && (
          <div className="flex justify-between text-xs italic pl-3 text-[#7E746C]">
            <span>Naklejka (Pies {formData.stickerOption})</span>
            <span>+5 zł</span>
          </div>
        )}
      </div>

      <div className="border-t border-[#E8E2D8] pt-4">
        <div className="flex justify-between items-baseline">
          <span className="text-base font-serif font-bold text-[#2C2623]">Cena całkowita:</span>
          <span className="text-2xl font-bold text-[#2C2623]">{totalPrice} zł</span>
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

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#2C2623] flex flex-col font-sans selection:bg-[#E3DCD2]">
      
      <div ref={topStackRef} className="sticky top-0 z-50 bg-[#FBF9F5]">
        {/* Pasek sterujący zwijaniem górnej belki */}
        <div className="bg-[#EFECE6] border-b border-[#E8E2D8] px-6 py-2 text-xs flex justify-between items-center">
          <span className="font-medium text-[#6E635B]">
            {activeTab === 'configurator' ? 'Tryb konfiguratora' : `Zakładka: ${activeTab}`}
          </span>
          <button
            onClick={() => setIsHeaderOpen(!isHeaderOpen)}
            className="font-bold text-[#2C2623] hover:text-[#8C6D53] transition-colors flex items-center gap-1"
          >
            {isHeaderOpen ? '▲ Zwiń górne menu' : '▼ Pokaż górne menu'}
          </button>
        </div>

        {/* Navbar z zakładkami */}
        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isHeaderOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            <header className="border-b border-[#E8E2D8] bg-[#FBF9F5]/90 backdrop-blur-md">
              <div className="max-w-6xl mx-auto px-6 h-24 flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => goToTab('home')}>
                  <span className="w-10 h-10 rounded-full bg-[#EFECE6] flex items-center justify-center text-lg border border-[#E2DCD2]">
                    🐾
                  </span>
                  <span className="font-serif font-medium text-2xl tracking-wide text-[#2C2623]">
                    PetTagi<span className="text-[#8C6D53]">.</span>
                  </span>
                </div>

                <nav className="hidden md:flex items-center gap-8">
                  <button 
                    onClick={() => goToTab('home')}
                    className={`text-sm font-medium transition-colors ${activeTab === 'home' ? 'text-[#2C2623] font-bold border-b-2 border-[#2C2623] pb-1' : 'text-[#6E635B] hover:text-[#2C2623]'}`}
                  >
                    O nas
                  </button>
                  <button 
                    onClick={() => goToTab('products')}
                    className={`text-sm font-medium transition-colors ${activeTab === 'products' ? 'text-[#2C2623] font-bold border-b-2 border-[#2C2623] pb-1' : 'text-[#6E635B] hover:text-[#2C2623]'}`}
                  >
                    Produkty
                  </button>
                  <button 
                    onClick={() => goToTab('configurator')}
                    className={`text-sm font-medium transition-colors ${activeTab === 'configurator' ? 'text-[#2C2623] font-bold border-b-2 border-[#2C2623] pb-1' : 'text-[#6E635B] hover:text-[#2C2623]'}`}
                  >
                    Skonfiguruj adresówkę
                  </button>
                </nav>

                <div>
                  <button 
                    onClick={() => goToTab('configurator')}
                    className="bg-[#2C2623] hover:bg-[#433A35] text-[#FBF9F5] px-6 py-3 rounded-full text-sm font-medium transition-all shadow-sm flex items-center gap-2"
                  >
                    <span>Koszyk</span>
                    <span className="bg-[#433A35] text-[#FBF9F5] px-2 py-0.5 rounded-full text-xs">0</span>
                  </button>
                </div>
              </div>
            </header>
          </div>
        </div>

        {activeTab === 'configurator' && (
          <div className="bg-white border-b border-[#E8E2D8] py-2 shadow-xs">
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
                        step.id === currentStep ? 'border-[#2C2623] bg-[#FBF9F5]' : 'border-[#E8E2D8] bg-white'
                      }`}>
                        {step.icon}
                      </div>
                      <span className="text-[7px] md:text-[8px] font-medium uppercase tracking-wider hidden md:block">{step.label}</span>
                    </div>
                  ))}
                </div>
                <div className="h-1 bg-[#E8E2D8] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#2C2623] transition-all duration-500" 
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
          <div className="max-w-4xl mx-auto px-6 py-20 space-y-12 text-center">
            <span className="text-[#8C6D53] font-medium uppercase tracking-widest text-xs">Witaj w świecie PetTagi</span>
            <h1 className="text-4xl md:text-5xl font-serif font-normal text-[#2C2623]">
              Tworzymy wyjątkowe akcesoria dla Twojego pupila
            </h1>
            <p className="text-lg text-[#6E635B] max-w-2xl mx-auto leading-relaxed">
              Nasze adresówki i zawieszki powstają z pasji do zwierząt i dbałości o każdy detal. Łączymy unikalny design z najwyższą trwałością, aby Twój czworonożny przyjaciel wyglądał stylowo i był bezpieczny.
            </p>
            <div className="pt-6">
              <button 
                onClick={() => goToTab('configurator')}
                className="bg-[#2C2623] hover:bg-[#433A35] text-[#FBF9F5] px-8 py-4 rounded-full font-medium text-base transition-all shadow-md"
              >
                Przejdź do kreatora adresówek
              </button>
            </div>
          </div>
        )}

        {/* ZAKŁADKA: Produkty */}
        {activeTab === 'products' && (
          <div className="max-w-5xl mx-auto px-6 py-16 space-y-10">
            <div className="text-center space-y-2">
              <span className="text-[#8C6D53] font-medium uppercase tracking-widest text-xs">Nasza oferta</span>
              <h1 className="text-3xl md:text-4xl font-serif font-normal text-[#2C2623]">Nasze Produkty</h1>
              <p className="text-sm text-[#6E635B]">Poznaj nasze flagowe kolekcje ręcznie robionych akcesoriów.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-3xl border border-[#E8E2D8] shadow-sm space-y-4">
                <div className="w-full h-72 bg-[#F3EFEA] rounded-2xl flex items-center justify-center text-4xl">💍</div>
                <h3 className="text-xl font-serif font-medium">Personalizowane Adresówki</h3>
                <p className="text-sm text-[#6E635B]">W pełni personalizowane zawieszki z imieniem i numerem telefonu, dostępne w wielu wzorach.</p>
                <button 
                  onClick={() => goToTab('configurator')}
                  className="text-sm font-bold text-[#2C2623] underline underline-offset-4 hover:text-[#8C6D53]"
                >
                  Skonfiguruj własną &rarr;
                </button>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#E8E2D8] shadow-sm space-y-4">
                <div className="w-full h-72 bg-[#F3EFEA] rounded-2xl flex items-center justify-center text-4xl">🦮</div>
                <h3 className="text-xl font-serif font-medium">Szelki i Obroże</h3>
                <p className="text-sm text-[#6E635B]">Wygodne, bezpieczne i stylowe zestawy spacerowe dopasowane do każdej rasy psa.</p>
                <button 
                  onClick={() => goToTab('configurator')}
                  className="text-sm font-bold text-[#2C2623] underline underline-offset-4 hover:text-[#8C6D53]"
                >
                  Stwórz zestaw &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ZAKŁADKA: Skonfiguruj adresówkę */}
        {activeTab === 'configurator' && (
          <div>
            {/* Układ dwukolumnowy z panelem podsumowania po prawej */}
            <div className={`mx-auto px-6 py-12 flex flex-col gap-8 ${currentStep >= 10 ? 'max-w-3xl' : 'max-w-6xl lg:flex-row'}`}>
              
              {/* Kolumna główna (formularz/opcje) */}
              <div className="flex-grow">
                <div className="bg-white p-8 md:p-14 rounded-3xl border border-[#E8E2D8] shadow-sm min-h-[450px] flex flex-col">
                  <div className="space-y-6">
                    <span className="text-[#8C6D53] font-medium uppercase tracking-widest text-xs">Krok {currentStep} z {totalSteps}</span>
                    <h2 className="text-3xl font-serif text-[#2C2623]">
                      {stepsInfo[currentStep - 1].label}
                    </h2>
                    
                    <div className="pt-4">
                      {currentStep === 1 && (
                        <div className="space-y-4">
                          <p className="font-bold text-base text-[#2C2623]">Wybierz kolor obręczy:</p>
                          <div className={imageGridClass(ringsList.length)}>
                            {ringsList.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => setFormData({...formData, ringColor: item.id})}
                                className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col items-center text-center ${
                                  formData.ringColor === item.id ? 'border-[#2C2623] bg-[#FBF9F5] shadow-md' : 'border-[#E8E2D8] bg-white hover:border-[#D5CEC3]'
                                }`}
                              >
                                <div className="w-full h-64 bg-[#F3EFEA] rounded-xl mb-4 overflow-hidden border border-[#E8E2D8] flex items-center justify-center relative">
                                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-base font-medium text-[#2C2623]">{item.title}</span>
                                <div className={`w-5 h-5 rounded-full border mt-3 flex items-center justify-center transition-all ${formData.ringColor === item.id ? 'border-[#2C2623] bg-[#2C2623]' : 'border-zinc-300'}`}>
                                  {formData.ringColor === item.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentStep === 2 && (
                        <div className="space-y-4">
                          <p className="font-bold text-base text-[#2C2623]">
                            Wybierz bazę (dla koloru obręczy: <span className="uppercase text-[#8C6D53]">{formData.ringColor}</span>):
                          </p>
                          <div className={imageGridClass((formData.ringColor === 'złoty' ? goldBases : silverBases).length)}>
                            {(formData.ringColor === 'złoty' ? goldBases : silverBases).map((base) => (
                              <div
                                key={base.id}
                                onClick={() => setFormData({...formData, baseOption: base.id})}
                                className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col items-center text-center ${
                                  formData.baseOption === base.id ? 'border-[#2C2623] bg-[#FBF9F5] shadow-md' : 'border-[#E8E2D8] bg-white hover:border-[#D5CEC3]'
                                }`}
                              >
                                <div className="w-full h-64 bg-[#F3EFEA] rounded-xl mb-4 overflow-hidden border border-[#E8E2D8] flex items-center justify-center relative">
                                  <img src={base.image} alt={base.title} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-base font-medium text-[#2C2623]">{base.title}</span>
                                <div className={`w-5 h-5 rounded-full border mt-3 flex items-center justify-center transition-all ${formData.baseOption === base.id ? 'border-[#2C2623] bg-[#2C2623]' : 'border-zinc-300'}`}>
                                  {formData.baseOption === base.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentStep === 3 && (
                        <div className="space-y-4">
                          <p className="font-bold text-base text-[#2C2623]">Wybierz swój darmowy charms:</p>
                          <div className={imageGridClass(charmsList.length)}>
                            {charmsList.map((charm) => (
                              <div
                                key={charm.id}
                                onClick={() => setFormData({...formData, charmOption: charm.id})}
                                className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col items-center text-center ${
                                  formData.charmOption === charm.id ? 'border-[#2C2623] bg-[#FBF9F5] shadow-md' : 'border-[#E8E2D8] bg-white hover:border-[#D5CEC3]'
                                }`}
                              >
                                <div className="w-full h-64 bg-[#F3EFEA] rounded-xl mb-4 overflow-hidden border border-[#E8E2D8] flex items-center justify-center relative">
                                  <img src={charm.image} alt={charm.title} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-base font-medium text-[#2C2623]">{charm.title}</span>
                                <div className={`w-5 h-5 rounded-full border mt-3 flex items-center justify-center transition-all ${formData.charmOption === charm.id ? 'border-[#2C2623] bg-[#2C2623]' : 'border-zinc-300'}`}>
                                  {formData.charmOption === charm.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentStep === 4 && (
                        <div className="space-y-6">
                          <p className="font-bold text-base text-[#2C2623]">Czy chcesz wybrać dodatkowe, płatne charms?</p>
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
                                className={`cursor-pointer rounded-2xl p-6 border-2 transition-all flex items-center justify-between ${
                                  formData.wantExtraCharms === option.id ? 'border-[#2C2623] bg-[#FBF9F5] shadow-md' : 'border-[#E8E2D8] bg-white hover:border-[#D5CEC3]'
                                }`}
                              >
                                <span className="text-lg font-medium text-[#2C2623]">{option.label}</span>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formData.wantExtraCharms === option.id ? 'border-[#2C2623] bg-[#2C2623]' : 'border-zinc-300'}`}>
                                  {formData.wantExtraCharms === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>

                          {formData.wantExtraCharms === 'tak' && (
                            <div className="space-y-4 pt-6 border-t border-[#E8E2D8]">
                              <p className="font-bold text-base text-[#2C2623]">Wybierz dodatkowe charms (możesz zaznaczyć wiele):</p>
                              <div className={imageGridClass(charmsList.length)}>
                                {charmsList.map((charm) => {
                                  const isSelected = formData.extraCharms.includes(charm.id);
                                  return (
                                    <div
                                      key={charm.id}
                                      onClick={() => toggleExtraCharm(charm.id)}
                                      className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col items-center text-center ${
                                        isSelected ? 'border-[#2C2623] bg-[#FBF9F5] shadow-md' : 'border-[#E8E2D8] bg-white hover:border-[#D5CEC3]'
                                      }`}
                                    >
                                      <div className="w-full h-64 bg-[#F3EFEA] rounded-xl mb-4 overflow-hidden border border-[#E8E2D8] flex items-center justify-center relative">
                                        <img src={charm.image} alt={charm.title} className="w-full h-full object-cover" />
                                      </div>
                                      <span className="text-base font-medium text-[#2C2623]">{charm.title}</span>
                                      <div className={`w-5 h-5 rounded-md border mt-3 flex items-center justify-center transition-all ${isSelected ? 'border-[#2C2623] bg-[#2C2623]' : 'border-zinc-300'}`}>
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
                          <p className="font-bold text-base text-[#2C2623]">Wybierz swój darmowy karabińczyk:</p>
                          <div className={imageGridClass(karabinersList.length)}>
                            {karabinersList.map((karabiner) => (
                              <div
                                key={karabiner.id}
                                onClick={() => setFormData({...formData, karabinerOption: karabiner.id})}
                                className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col items-center text-center ${
                                  formData.karabinerOption === karabiner.id ? 'border-[#2C2623] bg-[#FBF9F5] shadow-md' : 'border-[#E8E2D8] bg-white hover:border-[#D5CEC3]'
                                }`}
                              >
                                <div className="w-full h-64 bg-[#F3EFEA] rounded-xl mb-4 overflow-hidden border border-[#E8E2D8] flex items-center justify-center relative">
                                  <img src={karabiner.image} alt={karabiner.title} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-base font-medium text-[#2C2623]">{karabiner.title}</span>
                                <div className={`w-5 h-5 rounded-full border mt-3 flex items-center justify-center transition-all ${formData.karabinerOption === karabiner.id ? 'border-[#2C2623] bg-[#2C2623]' : 'border-zinc-300'}`}>
                                  {formData.karabinerOption === karabiner.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentStep === 6 && (
                        <div className="space-y-6">
                          <p className="font-bold text-base text-[#2C2623]">Czy chcesz wybrać dodatkowe, płatne karabińczyki?</p>
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
                                className={`cursor-pointer rounded-2xl p-6 border-2 transition-all flex items-center justify-between ${
                                  formData.wantExtraKarabiners === option.id ? 'border-[#2C2623] bg-[#FBF9F5] shadow-md' : 'border-[#E8E2D8] bg-white hover:border-[#D5CEC3]'
                                }`}
                              >
                                <span className="text-lg font-medium text-[#2C2623]">{option.label}</span>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formData.wantExtraKarabiners === option.id ? 'border-[#2C2623] bg-[#2C2623]' : 'border-zinc-300'}`}>
                                  {formData.wantExtraKarabiners === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>

                          {formData.wantExtraKarabiners === 'tak' && (
                            <div className="space-y-4 pt-6 border-t border-[#E8E2D8]">
                              <p className="font-bold text-base text-[#2C2623]">Wybierz dodatkowe karabińczyki (możesz zaznaczyć wiele):</p>
                              <div className={imageGridClass(karabinersList.length)}>
                                {karabinersList.map((karabiner) => {
                                  const isSelected = formData.extraKarabiners.includes(karabiner.id);
                                  return (
                                    <div
                                      key={karabiner.id}
                                      onClick={() => toggleExtraKarabiner(karabiner.id)}
                                      className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col items-center text-center ${
                                        isSelected ? 'border-[#2C2623] bg-[#FBF9F5] shadow-md' : 'border-[#E8E2D8] bg-white hover:border-[#D5CEC3]'
                                      }`}
                                    >
                                      <div className="w-full h-64 bg-[#F3EFEA] rounded-xl mb-4 overflow-hidden border border-[#E8E2D8] flex items-center justify-center relative">
                                        <img src={karabiner.image} alt={karabiner.title} className="w-full h-full object-cover" />
                                      </div>
                                      <span className="text-base font-medium text-[#2C2623]">{karabiner.title}</span>
                                      <div className={`w-5 h-5 rounded-md border mt-3 flex items-center justify-center transition-all ${isSelected ? 'border-[#2C2623] bg-[#2C2623]' : 'border-zinc-300'}`}>
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
                          <p className="font-bold text-base text-[#2C2623]">Czy chcesz dodać sznurek?</p>
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
                                className={`cursor-pointer rounded-2xl p-6 border-2 transition-all flex items-center justify-between ${
                                  formData.wantString === option.id ? 'border-[#2C2623] bg-[#FBF9F5] shadow-md' : 'border-[#E8E2D8] bg-white hover:border-[#D5CEC3]'
                                }`}
                              >
                                <span className="text-lg font-medium text-[#2C2623]">{option.label}</span>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formData.wantString === option.id ? 'border-[#2C2623] bg-[#2C2623]' : 'border-zinc-300'}`}>
                                  {formData.wantString === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>

                          {formData.wantString === 'tak' && (
                            <div className="space-y-6 pt-6 border-t border-[#E8E2D8]">
                              <div className="space-y-2">
                                <label className="block font-bold text-base text-[#2C2623]">Podaj obwód szyi Twojego pieska w centymetrach:</label>
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
                                  className="w-full md:w-1/2 p-3 rounded-xl border border-[#E8E2D8] focus:outline-none focus:border-[#2C2623] bg-white"
                                />
                              </div>

                              <div className="space-y-4 pt-4">
                                <h3 className="font-bold text-lg text-[#2C2623]">Dodaj sznurek Premium (możesz wybrać wiele)</h3>
                                <div className={imageGridClass(premiumStringsList.length)}>
                                  {premiumStringsList.map((item) => {
                                    const isSelected = formData.premiumStrings.includes(item.id);
                                    return (
                                      <div
                                        key={item.id}
                                        onClick={() => togglePremiumString(item.id)}
                                        className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col items-center text-center ${
                                          isSelected ? 'border-[#2C2623] bg-[#FBF9F5] shadow-md' : 'border-[#E8E2D8] bg-white hover:border-[#D5CEC3]'
                                        }`}
                                      >
                                        <div className="w-full h-64 bg-[#F3EFEA] rounded-xl mb-4 overflow-hidden border border-[#E8E2D8] flex items-center justify-center relative">
                                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-base font-medium text-[#2C2623]">{item.title}</span>
                                        <div className={`w-5 h-5 rounded-md border mt-3 flex items-center justify-center transition-all ${isSelected ? 'border-[#2C2623] bg-[#2C2623]' : 'border-zinc-300'}`}>
                                          {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="space-y-4 pt-4">
                                <h3 className="font-bold text-lg text-[#2C2623]">Dodaj sznurek Klasyczny (możesz wybrać wiele)</h3>
                                <div className={imageGridClass(classicStringsList.length)}>
                                  {classicStringsList.map((item) => {
                                    const isSelected = formData.classicStrings.includes(item.id);
                                    return (
                                      <div
                                        key={item.id}
                                        onClick={() => toggleClassicString(item.id)}
                                        className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col items-center text-center ${
                                          isSelected ? 'border-[#2C2623] bg-[#FBF9F5] shadow-md' : 'border-[#E8E2D8] bg-white hover:border-[#D5CEC3]'
                                        }`}
                                      >
                                        <div className="w-full h-64 bg-[#F3EFEA] rounded-xl mb-4 overflow-hidden border border-[#E8E2D8] flex items-center justify-center relative">
                                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-base font-medium text-[#2C2623]">{item.title}</span>
                                        <div className={`w-5 h-5 rounded-md border mt-3 flex items-center justify-center transition-all ${isSelected ? 'border-[#2C2623] bg-[#2C2623]' : 'border-zinc-300'}`}>
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
                          <p className="font-bold text-base text-[#2C2623]">Czy chcesz dodać stopery?</p>
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
                                className={`cursor-pointer rounded-2xl p-6 border-2 transition-all flex items-center justify-between ${
                                  formData.wantStopers === option.id ? 'border-[#2C2623] bg-[#FBF9F5] shadow-md' : 'border-[#E8E2D8] bg-white hover:border-[#D5CEC3]'
                                }`}
                              >
                                <span className="text-lg font-medium text-[#2C2623]">{option.label}</span>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formData.wantStopers === option.id ? 'border-[#2C2623] bg-[#2C2623]' : 'border-zinc-300'}`}>
                                  {formData.wantStopers === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>

                          {formData.wantStopers === 'tak' && (
                            <div className="space-y-4 pt-6 border-t border-[#E8E2D8]">
                              <p className="font-bold text-base text-[#2C2623]">Wybierz stopery:</p>
                              <div className={imageGridClass(stopersList.length)}>
                                {stopersList.map((stoper) => (
                                  <div
                                    key={stoper.id}
                                    onClick={() => setFormData({ ...formData, extraStopers: stoper.id })}
                                    className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col items-center text-center ${
                                      formData.extraStopers === stoper.id ? 'border-[#2C2623] bg-[#FBF9F5] shadow-md' : 'border-[#E8E2D8] bg-white hover:border-[#D5CEC3]'
                                    }`}
                                  >
                                    <div className="w-full h-64 bg-[#F3EFEA] rounded-xl mb-4 overflow-hidden border border-[#E8E2D8] flex items-center justify-center relative">
                                      <img src={stoper.image} alt={stoper.title} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-base font-medium text-[#2C2623]">{stoper.title}</span>
                                    <div className={`w-5 h-5 rounded-full border mt-3 flex items-center justify-center transition-all ${formData.extraStopers === stoper.id ? 'border-[#2C2623] bg-[#2C2623]' : 'border-zinc-300'}`}>
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
                          <p className="font-bold text-base text-[#2C2623]">Czy chcesz dodać naklejkę Twojego pieska?</p>
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
                                className={`cursor-pointer rounded-2xl p-6 border-2 transition-all flex items-center justify-between ${
                                  formData.wantSticker === option.id ? 'border-[#2C2623] bg-[#FBF9F5] shadow-md' : 'border-[#E8E2D8] bg-white hover:border-[#D5CEC3]'
                                }`}
                              >
                                <span className="text-lg font-medium text-[#2C2623]">{option.label}</span>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formData.wantSticker === option.id ? 'border-[#2C2623] bg-[#2C2623]' : 'border-zinc-300'}`}>
                                  {formData.wantSticker === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </div>
                            ))}
                          </div>

                          {formData.wantSticker === 'tak' && (
                            <div className="space-y-4 pt-6 border-t border-[#E8E2D8]">
                              <p className="font-bold text-base text-[#2C2623]">Wybierz naklejkę:</p>
                              <div className={imageGridClass(stickersList.length)}>
                                {stickersList.map((sticker) => (
                                  <div
                                    key={sticker.id}
                                    onClick={() => setFormData({ ...formData, stickerOption: sticker.id })}
                                    className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col items-center text-center ${
                                      formData.stickerOption === sticker.id ? 'border-[#2C2623] bg-[#FBF9F5] shadow-md' : 'border-[#E8E2D8] bg-white hover:border-[#D5CEC3]'
                                    }`}
                                  >
                                    <div className="w-full h-64 bg-[#F3EFEA] rounded-xl mb-4 overflow-hidden border border-[#E8E2D8] flex items-center justify-center relative">
                                      <img src={sticker.image} alt={sticker.title} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-base font-medium text-[#2C2623]">{sticker.title}</span>
                                    <div className={`w-5 h-5 rounded-full border mt-3 flex items-center justify-center transition-all ${formData.stickerOption === sticker.id ? 'border-[#2C2623] bg-[#2C2623]' : 'border-zinc-300'}`}>
                                      {formData.stickerOption === sticker.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {currentStep === 10 && (
                        <div className="space-y-6">
                          {summaryLines}
                        </div>
                      )}

                      {currentStep === 11 && (
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <label className="block font-bold text-base text-[#2C2623]">Imię</label>
                            <input
                              type="text"
                              value={formData.firstName}
                              onChange={(e) => {
                                if (isLettersOnly(e.target.value)) updateFormField('firstName', e.target.value);
                              }}
                              placeholder="Wpisz imię"
                              className={`w-full p-3 rounded-xl border bg-white focus:outline-none focus:border-[#2C2623] ${showOrderErrors && orderErrors.firstName ? 'border-red-400' : 'border-[#E8E2D8]'}`}
                            />
                            {showOrderErrors && orderErrors.firstName && (
                              <p className="text-xs text-red-500">Podaj imię (tylko litery).</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="block font-bold text-base text-[#2C2623]">Nazwisko</label>
                            <input
                              type="text"
                              value={formData.lastName}
                              onChange={(e) => {
                                if (isLettersOnly(e.target.value)) updateFormField('lastName', e.target.value);
                              }}
                              placeholder="Wpisz nazwisko"
                              className={`w-full p-3 rounded-xl border bg-white focus:outline-none focus:border-[#2C2623] ${showOrderErrors && orderErrors.lastName ? 'border-red-400' : 'border-[#E8E2D8]'}`}
                            />
                            {showOrderErrors && orderErrors.lastName && (
                              <p className="text-xs text-red-500">Podaj nazwisko (tylko litery).</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="block font-bold text-base text-[#2C2623]">Adres e-mail</label>
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => {
                                if (isEmailChars(e.target.value)) updateFormField('email', e.target.value);
                              }}
                              placeholder="np. jan@example.com"
                              className={`w-full p-3 rounded-xl border bg-white focus:outline-none focus:border-[#2C2623] ${showOrderErrors && orderErrors.email ? 'border-red-400' : 'border-[#E8E2D8]'}`}
                            />
                            {showOrderErrors && orderErrors.email && (
                              <p className="text-xs text-red-500">Podaj poprawny adres e-mail.</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="block font-bold text-base text-[#2C2623]">Numer telefonu</label>
                            <div className="flex gap-3">
                              <select
                                value={formData.phoneCode}
                                onChange={(e) => updateFormField('phoneCode', e.target.value)}
                                className="w-44 p-3 rounded-xl border border-[#E8E2D8] bg-white focus:outline-none focus:border-[#2C2623]"
                              >
                                {countryCodes.map((item) => (
                                  <option key={item.code} value={item.code}>{item.label}</option>
                                ))}
                              </select>
                              <input
                                type="tel"
                                inputMode="numeric"
                                value={formData.phoneNumber}
                                onChange={(e) => {
                                  if (isDigitsOnly(e.target.value)) updateFormField('phoneNumber', e.target.value);
                                }}
                                placeholder="Numer telefonu"
                                className={`flex-1 p-3 rounded-xl border bg-white focus:outline-none focus:border-[#2C2623] ${showOrderErrors && orderErrors.phoneNumber ? 'border-red-400' : 'border-[#E8E2D8]'}`}
                              />
                            </div>
                            {showOrderErrors && orderErrors.phoneNumber && (
                              <p className="text-xs text-red-500">Podaj numer telefonu (tylko cyfry).</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="block font-bold text-base text-[#2C2623]">Imię Twojego psa</label>
                            <input
                              type="text"
                              value={formData.petName}
                              onChange={(e) => {
                                if (isLettersOnly(e.target.value)) updateFormField('petName', e.target.value);
                              }}
                              placeholder="Wpisz imię psa"
                              className={`w-full p-3 rounded-xl border bg-white focus:outline-none focus:border-[#2C2623] ${showOrderErrors && orderErrors.petName ? 'border-red-400' : 'border-[#E8E2D8]'}`}
                            />
                            {showOrderErrors && orderErrors.petName && (
                              <p className="text-xs text-red-500">Podaj imię psa (tylko litery).</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="block font-bold text-base text-[#2C2623]">Numer telefonu do adresówki</label>
                            <div className="flex gap-3">
                              <select
                                value={formData.tagPhoneCode}
                                onChange={(e) => updateFormField('tagPhoneCode', e.target.value)}
                                className="w-44 p-3 rounded-xl border border-[#E8E2D8] bg-white focus:outline-none focus:border-[#2C2623]"
                              >
                                {countryCodes.map((item) => (
                                  <option key={`tag-${item.code}`} value={item.code}>{item.label}</option>
                                ))}
                              </select>
                              <input
                                type="tel"
                                inputMode="numeric"
                                value={formData.tagPhoneNumber}
                                onChange={(e) => {
                                  if (isDigitsOnly(e.target.value)) updateFormField('tagPhoneNumber', e.target.value);
                                }}
                                placeholder="Numer do adresówki"
                                className={`flex-1 p-3 rounded-xl border bg-white focus:outline-none focus:border-[#2C2623] ${showOrderErrors && orderErrors.tagPhoneNumber ? 'border-red-400' : 'border-[#E8E2D8]'}`}
                              />
                            </div>
                            {showOrderErrors && orderErrors.tagPhoneNumber && (
                              <p className="text-xs text-red-500">Podaj numer telefonu do adresówki (tylko cyfry).</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {currentStep < 10 && (
              <div className="w-full lg:w-80 flex-shrink-0">
                <div className="bg-white p-6 rounded-3xl border border-[#E8E2D8] shadow-sm sticky space-y-6" style={{ top: topStackHeight + 16 }}>
                  <h3 className="font-serif font-medium text-xl text-[#2C2623] border-b border-[#E8E2D8] pb-4">
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