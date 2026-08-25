export type CatalogOption = { id: string; label: string }

export type StringOption = CatalogOption & {
  images: string[]
}

export type BaseOption = CatalogOption & {
  images: string[]
}

export type SingleBaseOption = CatalogOption & {
  image: string
}

const numbered = (count: number, start = 1): CatalogOption[] =>
  Array.from({ length: count }, (_, index) => {
    const id = String(start + index)
    return { id, label: `Podpis ${id}` }
  })

export const RING_OPTIONS: CatalogOption[] = [
  { id: "złoty", label: "Złoty" },
  { id: "srebrny", label: "Srebrny" },
  { id: "kwiat", label: "Kwiat" },
  { id: "glow", label: "Glow" },
]

export const GLOW_BASE_CATALOG: BaseOption[] = [
  {
    id: "glow1",
    label: "Sorbet kokosowy (biała)",
    images: ["/glow/biala1.jpg", "/glow/biala2.jpg"],
  },
  {
    id: "glow2",
    label: "Guma balonowa (niebieska)",
    images: ["/glow/niebieska1.jpg", "/glow/niebieska2.jpg"],
  },
  {
    id: "glow3",
    label: "Sorbet mango-marakuja (pomarańczowa)",
    images: ["/glow/pomaranczowa1.jpg", "/glow/pomaranczowa2.jpg"],
  },
  {
    id: "glow4",
    label: "Orzeźwiająca limonka (zielona)",
    images: ["/glow/zielona1.jpg", "/glow/zielona2.jpg"],
  },
  {
    id: "glow5",
    label: "Sorbet cytrynowy (żółta)",
    images: ["/glow/zolta1.jpg", "/glow/zolta2.jpg"],
  },
]

export type GlowTextOption = {
  id: string
  label: string
  recommendation: string
  image: string
}

export const GLOW_TEXT_OPTIONS: GlowTextOption[] = [
  {
    id: "zloty",
    label: "Złoty",
    recommendation: "polecamy do kolorów: biały, pomarańczowy, żółty",
    image: "/napiszloty.jpg",
  },
  {
    id: "srebrny",
    label: "Srebrny",
    recommendation: "polecamy do kolorów: biały, niebieski, zielony",
    image: "/napissrebrny.jpg",
  },
]

export const GOLD_BASE_CATALOG: SingleBaseOption[] = [
  { id: "8", label: "Ecru", image: "/baza/goldecru.jpg" },
  { id: "11", label: "Kremowy", image: "/baza/goldkremowy.jpg" },
  { id: "1", label: "Beżowy", image: "/baza/goldbezowy.jpg" },
  { id: "5", label: "Cappuccino", image: "/baza/goldcappuccino.jpg" },
  { id: "13", label: "Oliwkowy", image: "/baza/goldoliwkowy.jpg" },
  { id: "16", label: "Zielony", image: "/baza/goldzielony.jpg" },
  { id: "14", label: "Pastelowy róż", image: "/baza/goldpastelowyroz.jpg" },
  { id: "7", label: "Czerwony", image: "/baza/goldczerwony.jpg" },
  { id: "15", label: "Winny", image: "/baza/goldwinny.jpg" },
  { id: "3", label: "Bordowy", image: "/baza/goldbordowy.jpg" },
  { id: "6", label: "Czarny", image: "/baza/goldczarny.jpg" },
  { id: "4", label: "Brązowy", image: "/baza/goldbrazowy.jpg" },
  { id: "12", label: "Lawenda", image: "/baza/goldlawenda.jpg" },
  { id: "9", label: "Fuksja", image: "/baza/goldfuksja.jpg" },
  { id: "2", label: "Błękitny", image: "/baza/goldblekitny.jpg" },
  { id: "10", label: "Granatowy", image: "/baza/goldgranatowy.jpg" },
]

export const SILVER_BASE_CATALOG: SingleBaseOption[] = [
  { id: "23", label: "Ivory", image: "/baza/silverivory.jpg" },
  { id: "24", label: "Jasnoszary", image: "/baza/silverjasnyszary.jpg" },
  { id: "25", label: "Lawenda", image: "/baza/silverlawenda.jpg" },
  { id: "27", label: "Pastelowy turkus", image: "/baza/silverpastelowyturkus.jpg" },
  { id: "20", label: "Fuksja", image: "/baza/silverfuksja.jpg" },
  { id: "17", label: "Błękitny", image: "/baza/silverblekitny.jpg" },
  { id: "21", label: "Grafitowy", image: "/baza/silvergrafitowy.jpg" },
  { id: "22", label: "Granatowy", image: "/baza/silvergranatowy.jpg" },
  { id: "18", label: "Cappuccino", image: "/baza/silvercappuccino.jpg" },
  { id: "26", label: "Pastelowy róż", image: "/baza/silverpastelowyroz.jpg" },
  { id: "19", label: "Czarny", image: "/baza/silverczarny.jpg" },
]

export const FLOWER_BASE_CATALOG: SingleBaseOption[] = [
  { id: "kwiat3", label: "Ecru", image: "/baza/kwiatecru.jpg" },
  { id: "kwiat4", label: "Kremowy", image: "/baza/kwiatkremowy.jpg" },
  { id: "kwiat1", label: "Beżowy", image: "/baza/kwiatbezowy.jpg" },
  { id: "kwiat6", label: "Oliwkowy", image: "/baza/kwiatoliwkowy.jpg" },
  { id: "kwiat7", label: "Pastelowy róż", image: "/baza/kwiatpastelowyroz.jpg" },
  { id: "kwiat5", label: "Lawenda", image: "/baza/kwiatlawenda.jpg" },
  { id: "kwiat2", label: "Czerwony", image: "/baza/kwiatczerwony.jpg" },
]

export const BASE_OPTIONS: CatalogOption[] = [
  ...GOLD_BASE_CATALOG.map(({ id, label }) => ({ id, label })),
  ...SILVER_BASE_CATALOG.map(({ id, label }) => ({ id, label })),
  ...FLOWER_BASE_CATALOG.map(({ id, label }) => ({ id, label })),
  ...GLOW_BASE_CATALOG.map(({ id, label }) => ({ id, label })),
]

export type CharmCatalogItem = SingleBaseOption & {
  unavailable?: boolean
  hit?: boolean
}

export const CHARM_BESTSELLERS: CharmCatalogItem[] = [
  { id: "kostkabiala", label: "Biała kostka", image: "/charms/kostkabiala.jpg", hit: true },
  { id: "rogalcroissant", label: "Rogal – croissant", image: "/charms/rogalcroissant.jpg", hit: true },
  { id: "sercestalnierdzewna", label: "Serce – stal nierdzewna", image: "/charms/sercestalnierdzewna.jpg", hit: true },
  { id: "pszczolkadelikatna", label: "Pszczółka – delikatna", image: "/charms/pszczolkadelikatna.jpg", hit: true },
]

export const CHARM_CATALOG: CharmCatalogItem[] = [
  { id: "perelka", label: "Perełka", image: "/charms/perelka.jpg" },
  { id: "lapkastalnierdzewna", label: "Łapka – stal nierdzewna", image: "/charms/lapkastalnierdzewna.jpg" },
  { id: "lapka", label: "Łapka", image: "/charms/lapka.jpg" },
  { id: "gwiazdkastalnierdzewna", label: "Gwiazdka – stal nierdzewna", image: "/charms/gwiazdkastalnierdzewna.jpg" },
  { id: "kokardkastalnierdzewna", label: "Kokardka – stal nierdzewna", image: "/charms/kokardkastalnierdzewna.jpg" },
  { id: "zlotakostka", label: "Złota kostka", image: "/charms/zlotakostka.jpg" },
  { id: "czarnakostka", label: "Czarna kostka", image: "/charms/czarnakostka.jpg" },
  { id: "serceintensywnierozowe", label: "Serce – intensywnie różowe", image: "/charms/serceintensywnierozowe.jpg" },
  { id: "sercebiale", label: "Serce – białe", image: "/charms/sercebiale.jpg" },
  { id: "sercedelikatnierozowe", label: "Serce – delikatnie różowe", image: "/charms/sercedelikatnierozowe.jpg" },
  { id: "sercelimonkowe", label: "Serce – limonkowe", image: "/charms/sercelimonkowe.jpg" },
  { id: "sercezolte", label: "Serce – żółte", image: "/charms/sercezolte.jpg" },
  { id: "sercepomaranczowe", label: "Serce – pomarańczowe", image: "/charms/sercepomaranczowe.jpg" },
  { id: "serceczerwone", label: "Serce – czerwone", image: "/charms/serceczerwone.jpg" },
  { id: "sercefioletowe", label: "Serce – fioletowe", image: "/charms/sercefioletowe.jpg" },
  { id: "serceczarne", label: "Serce – czarne", image: "/charms/serceczarne.jpg" },
  { id: "serceblekitne", label: "Serce – błękitne", image: "/charms/serceblekitne.jpg" },
  { id: "koronadelikatnierozowa", label: "Korona – delikatnie różowa", image: "/charms/koronadelikatnierozowa.jpg" },
  { id: "koronabiala", label: "Korona – biała", image: "/charms/koronabiala.jpg" },
  { id: "koronaczarna", label: "Korona – czarna", image: "/charms/koronaczarna.jpg" },
  { id: "koronablekitna", label: "Korona – błękitna", image: "/charms/koronablekitna.jpg" },
  { id: "hotdog", label: "Hot dog", image: "/charms/hotdog.jpg" },
  { id: "motylekrozowy", label: "Motylek – różowy", image: "/charms/motylekrozowy.jpg" },
  { id: "motylekbialy", label: "Motylek – biały", image: "/charms/motylekbialy.jpg" },
  { id: "motylekblekitny", label: "Motylek – błękitny", image: "/charms/motylekblekitny.jpg" },
  { id: "motylekdelikatnierozowy", label: "Motylek – delikatnie różowy", image: "/charms/motylekdelikatnierozowy.jpg" },
  { id: "motylekfioletowy", label: "Motylek – fioletowy", image: "/charms/motylekfioletowy.jpg" },
  { id: "motylekpomaranczowy", label: "Motylek – pomarańczowy", image: "/charms/motylekpomaranczowy.jpg" },
  { id: "motylekzielony", label: "Motylek – zielony", image: "/charms/motylekzielony.jpg" },
  {
    id: "motylekczerwony",
    label: "Motylek – czerwony (chwilowo niedostępny)",
    image: "/charms/motylekczerwony.jpg",
    unavailable: true,
  },
  { id: "motylekczarny", label: "Motylek – czarny", image: "/charms/motylekczarny.jpg" },
  { id: "papryczkachili", label: "Papryczka chili", image: "/charms/papryczkachili.jpg" },
  { id: "wasybrazowe", label: "Wąsy – brązowe", image: "/charms/wasybrazowe.jpg" },
]

export const CHARM_SILVER_CATALOG: CharmCatalogItem[] = [
  { id: "srebrokwiatuszekrozowy", label: "Kwiatuszek – różowy", image: "/charms/srebrokwiatuszekrozowy.jpg" },
  { id: "srebrokwiatuszekbialy", label: "Kwiatuszek – biały", image: "/charms/srebrokwiatuszekbialy.jpg" },
  { id: "srebrosercestalnierdzewna", label: "Serce – stal nierdzewna", image: "/charms/srebrosercestalnierdzewna.jpg" },
  { id: "srebrolapkastalnierdzewna", label: "Łapka – stal nierdzewna", image: "/charms/srebrolapkastalnierdzewna.jpg" },
  { id: "srebrolapka", label: "Łapka", image: "/charms/srebrolapka.jpg" },
  { id: "srebrogwiazdkastalnierdzewna", label: "Gwiazdka – stal nierdzewna", image: "/charms/srebrogwiazdkastalnierdzewna.jpg" },
  { id: "srebroperelka", label: "Perełka", image: "/charms/srebroperelka.jpg" },
  { id: "srebrosrebrnakostka", label: "Srebrna kostka", image: "/charms/srebrosrebrnakostka.jpg" },
  { id: "srebrokokardkastalnierdzewna", label: "Kokardka", image: "/charms/srebrokokardkastalnierdzewna.jpg" },
]

export const CHARM_LARGE_CATALOG: CharmCatalogItem[] = [
  { id: "duzypiesek", label: "Piesek", image: "/charms/duzypiesek.jpg" },
  { id: "duzalapkaczarna", label: "Łapka – czarna", image: "/charms/duzalapkaczarna.jpg" },
  { id: "duzykwiatuszekrozowy", label: "Kwiatuszek – różowy", image: "/charms/duzykwiatuszekrozowy.jpg" },
  { id: "duzykwiatuszekdelikatnierozowy", label: "Kwiatuszek – delikatnie różowy", image: "/charms/duzykwiatuszekdelikatnierozowy.jpg" },
  { id: "duzykwiatuszeklawendowy", label: "Kwiatuszek – lawendowy", image: "/charms/duzykwiatuszeklawendowy.jpg" },
  { id: "duzamuszelka", label: "Muszelka", image: "/charms/duzamuszelka.jpg" },
  { id: "duzeoko", label: "Oko", image: "/charms/duzeoko.jpg" },
]

export const CHARM_OPTIONS: CatalogOption[] = [
  ...CHARM_BESTSELLERS.map(({ id, label }) => ({ id, label })),
  ...CHARM_CATALOG.map(({ id, label }) => ({ id, label })),
  ...CHARM_SILVER_CATALOG.map(({ id, label }) => ({ id, label })),
  ...CHARM_LARGE_CATALOG.map(({ id, label }) => ({ id, label })),
]

export const CHARM_LABEL_OPTIONS = CHARM_OPTIONS

export type CharmMountingId = "oddzielne" | "razem"

export type CharmMountingOption = {
  id: CharmMountingId
  label: string
  tileLabel: string
  image: string
  benefits: string[]
}

export const CHARM_MOUNTING_OPTIONS: CharmMountingOption[] = [
  {
    id: "oddzielne",
    label: "Mocowanie oddzielne (standardowe)",
    tileLabel: "Mocowanie oddzielne",
    image: "/charms/mocowanieoddzielne.jpg",
    benefits: [
      "Charms można łatwo zdjąć i wymienić",
      "W każdej chwili możesz zastąpić go innym wzorem",
      "Charms swobodnie porusza się przy adresówce",
    ],
  },
  {
    id: "razem",
    label: "Mocowanie razem z adresówką",
    tileLabel: "Mocowanie razem z adresówką",
    image: "/charms/mocowanierazem.jpg",
    benefits: [
      "Charms jest trwale przymocowany",
      "Trudniejszy do wymiany",
      "Polecany dla osób, które preferują stabilne i trwałe mocowanie",
    ],
  },
]

export const charmMountingLabel = (id: string) =>
  CHARM_MOUNTING_OPTIONS.find((option) => option.id === id)?.label ?? id

export const charmMountingTileLabel = (id: string) =>
  CHARM_MOUNTING_OPTIONS.find((option) => option.id === id)?.tileLabel ?? id

export const KARABINER_OPTIONS = numbered(12)

export const PREMIUM_STRING_CATALOG: StringOption[] = [
  {
    id: "cappuccino",
    label: "Cappuccino",
    images: ["/sznurek/premiumcappuccino1.jpg", "/sznurek/premiumcappuccino2.jpg"],
  },
  {
    id: "czekoladowy",
    label: "Czekoladowy",
    images: ["/sznurek/premiumczekoladowy1.jpg", "/sznurek/premiumczekoladowy2.jpg"],
  },
  {
    id: "ecru",
    label: "Ecru",
    images: ["/sznurek/premiumecru1.jpg", "/sznurek/premiumecru2.jpg"],
  },
  {
    id: "jasny-braz",
    label: "Jasny brąz",
    images: ["/sznurek/premiumjasnybraz1.jpg", "/sznurek/premiumjasnybraz2.jpg"],
  },
  {
    id: "kremowy",
    label: "Kremowy",
    images: ["/sznurek/premiumkremowy1.jpg", "/sznurek/premiumkremowy2.jpg"],
  },
  {
    id: "lawenda",
    label: "Lawenda",
    images: ["/sznurek/premiumlawenda1.jpg", "/sznurek/premiumlawenda2.jpg"],
  },
  {
    id: "teal",
    label: "Teal",
    images: ["/sznurek/premiumteal1.jpg", "/sznurek/premiumteal2.jpg"],
  },
  {
    id: "winny",
    label: "Winny",
    images: ["/sznurek/premiumwinny1.jpg", "/sznurek/premiumwinny2.jpg"],
  },
]

export const PREMIUM_STRING_OPTIONS: CatalogOption[] = PREMIUM_STRING_CATALOG.map(({ id, label }) => ({
  id,
  label,
}))

export const CLASSIC_STRING_CATALOG: StringOption[] = [
  {
    id: "bezowy",
    label: "Beżowy",
    images: ["/sznurek/klasycznybezowy1.jpg", "/sznurek/klasycznybezowy2.jpg"],
  },
  {
    id: "braz",
    label: "Brąz",
    images: ["/sznurek/klasycznybraz1.jpg", "/sznurek/klasycznybraz2.jpg"],
  },
  {
    id: "butelkowy",
    label: "Butelkowy",
    images: ["/sznurek/klasycznybutelkowy1.jpg", "/sznurek/klasycznybutelkowy2.jpg"],
  },
  {
    id: "ciemny-bez",
    label: "Ciemny beż",
    images: ["/sznurek/klasycznyciemnybez1.jpg", "/sznurek/klasycznyciemnybez2.jpg"],
  },
  {
    id: "czarny",
    label: "Czarny",
    images: ["/sznurek/klasycznyczarny1.jpg", "/sznurek/klasycznyczarny2.jpg"],
  },
  {
    id: "czerwony",
    label: "Czerwony",
    images: ["/sznurek/klasycznyczerwony1.jpg", "/sznurek/klasycznyczerwony2.jpg"],
  },
  {
    id: "granatowy",
    label: "Granatowy",
    images: ["/sznurek/klasycznygranatowy1.jpg", "/sznurek/klasycznygranatowy2.jpg"],
  },
  {
    id: "jasnorozowy",
    label: "Jasnoróżowy",
    images: ["/sznurek/klasycznyjasnorozowy1.jpg", "/sznurek/klasycznyjasnorozowy2.jpg"],
  },
  {
    id: "niebieski",
    label: "Niebieski",
    images: ["/sznurek/klasycznyniebieski1.jpg", "/sznurek/klasycznyniebieski2.jpg"],
  },
  {
    id: "srebrny",
    label: "Srebrny",
    images: ["/sznurek/klasycznysrebrny1.jpg", "/sznurek/klasycznysrebrny2.jpg"],
  },
]

export const CLASSIC_STRING_OPTIONS: CatalogOption[] = CLASSIC_STRING_CATALOG.map(({ id, label }) => ({
  id,
  label,
}))

export const GLOW_STRING_CATALOG: StringOption[] = [
  {
    id: "bialo-blekitny",
    label: "Biało-błękitny",
    images: ["/sznurek/glowbialoblekitny1.jpg", "/sznurek/glowbialoblekitny2.jpg"],
  },
  {
    id: "blekitny",
    label: "Błękitny",
    images: ["/sznurek/glowblekitny1.jpg", "/sznurek/glowblekitny2.jpg"],
  },
  {
    id: "delikatny-roz",
    label: "Delikatny róż",
    images: ["/sznurek/glowdelikatnyroz1.jpg", "/sznurek/glowdelikatnyroz2.jpg"],
  },
  {
    id: "pastelowy-zolty",
    label: "Pastelowy żółty",
    images: ["/sznurek/glowpastelowyzolty1.jpg", "/sznurek/glowpastelowyzolty2.jpg"],
  },
]

export const GLOW_STRING_OPTIONS: CatalogOption[] = GLOW_STRING_CATALOG.map(({ id, label }) => ({
  id,
  label,
}))

export const STOPPER_OPTIONS: CatalogOption[] = [
  { id: "1", label: "Złote" },
  { id: "2", label: "Srebrne" },
]

export const STICKER_OPTIONS: CatalogOption[] = Array.from({ length: 6 }, (_, index) => ({
  id: String(index + 1),
  label: `Pies ${index + 1}`,
}))

export const optionLabel = (options: CatalogOption[], id: string) =>
  options.find((option) => option.id === id)?.label ?? `Podpis ${id}`
