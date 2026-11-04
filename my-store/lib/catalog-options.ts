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

const oprawaAdjectiveLower = (ringColor: string) => {
  if (ringColor === "złoty") return "złota"
  if (ringColor === "srebrny") return "srebrna"
  if (ringColor === "kwiat") return "kwiat"
  return ringColor
}

/** Rodzaj oprawy po prawej w podsumowaniu / koszyku / mailu (np. „Złota”). */
export const oprawaDisplayAdjective = (ringColor: string) => {
  const adj = oprawaAdjectiveLower(ringColor)
  if (!adj) return adj
  return adj.charAt(0).toLocaleUpperCase("pl-PL") + adj.slice(1)
}

export const oprawaDisplayPhrase = (ringColor: string) => {
  const adj = oprawaAdjectiveLower(ringColor)
  return adj ? `Oprawa ${adj}` : ringColor
}

export type TagModelOption = {
  id: string
  image: string
  label: string
}

export const TAG_MODEL_OPTIONS: TagModelOption[] = [
  { id: "sznurek-karabinier", image: "/model/2.jpg", label: "Na sznurku z karabińczykiem" },
  { id: "sznurek-bez-karabinier", image: "/model/1.jpg", label: "Na sznurku (bez karabińczyka)" },
  { id: "naszyjnik-koraliki", image: "/model/3.jpg", label: "Naszyjnik z koralikami i adresówką" },
  { id: "sama-karabinier", image: "/model/4.jpg", label: "Sama adresówka z karabińczykiem" },
]

export const BEAD_NECKLACE_TAG_MODEL_ID = "naszyjnik-koraliki"

export const STRING_WITHOUT_KARABINER_TAG_MODEL_ID = "sznurek-bez-karabinier"

export const TAG_ONLY_WITH_KARABINER_TAG_MODEL_ID = "sama-karabinier"

export const isBeadNecklaceTagModel = (tagModel?: string | null) =>
  tagModel?.trim() === BEAD_NECKLACE_TAG_MODEL_ID

export const isStringWithoutKarabinerTagModel = (tagModel?: string | null) =>
  tagModel?.trim() === STRING_WITHOUT_KARABINER_TAG_MODEL_ID

export const isTagOnlyWithKarabinerTagModel = (tagModel?: string | null) =>
  tagModel?.trim() === TAG_ONLY_WITH_KARABINER_TAG_MODEL_ID

/** Karabińczyk w cenie bazowej — bez kroku konfiguratora i bez dopłaty. */
export const tagModelKarabinerIncludedInBasePrice = (tagModel?: string | null) =>
  isTagOnlyWithKarabinerTagModel(tagModel)

/** Bez dopłat za sznurki i stopery (model „Sama adresówka z karabińczykiem”). Karabińczyki — osobny krok i dopłaty jak na sznurku z karabińczykiem. */
export const tagModelSkipsStringAndStopperAddonCharges = (tagModel?: string | null) =>
  isTagOnlyWithKarabinerTagModel(tagModel)

/** @alias Zachowane dla wcześniejszych importów — dotyczy tylko sznurków i stoperów. */
export const tagModelSkipsStringAndKarabinerAddonCharges = tagModelSkipsStringAndStopperAddonCharges

/** Karabińczyki — każda sztuka płatna (naszyjnik z koralikami, sznurek bez karabińczyka w komplecie). */
export const tagModelKarabinersAllUnitsPaid = (tagModel?: string | null) =>
  tagModel?.trim() === BEAD_NECKLACE_TAG_MODEL_ID ||
  tagModel?.trim() === STRING_WITHOUT_KARABINER_TAG_MODEL_ID

/** Ten sam krok karabińczyków co w modelu naszyjnik z koralikami (siatka, mocowanie, brak „1 gratis”). */
export const tagModelUsesNecklaceStyleKarabinerStep = (tagModel?: string | null) =>
  tagModelKarabinersAllUnitsPaid(tagModel)

/** W kroku karabińczyków dopuszczalne zero szt. (np. sznurek bez karabińczyka w komplecie). */
export const tagModelKarabinersOptionalInConfigurator = (tagModel?: string | null) =>
  isStringWithoutKarabinerTagModel(tagModel)

/** Nie ustawiaj domyślnie 1 szt. karabińczyka (wybór modelu / oprawy). */
export const tagModelSkipsDefaultKarabinerSelection = (tagModel?: string | null) =>
  isBeadNecklaceTagModel(tagModel) || isStringWithoutKarabinerTagModel(tagModel)

export const classicTagShowsDetailedPriceBreakdown = (tagModel?: string | null) =>
  isBeadNecklaceTagModel(tagModel) ||
  isStringWithoutKarabinerTagModel(tagModel) ||
  isTagOnlyWithKarabinerTagModel(tagModel)

/** Rozbicie cen w koszyku / mailu — modele z dopłatami lub dopłata za oprawę kwiat. */
export const classicTagShowsItemPriceBreakdown = (
  tagModel?: string | null,
  ringColor?: string | null,
) => classicTagShowsDetailedPriceBreakdown(tagModel) || ringColor?.trim() === "kwiat"

export const tagModelLabel = (id: string) =>
  TAG_MODEL_OPTIONS.find((option) => option.id === id)?.label ?? id

export type BeadNecklaceColorOption = CatalogOption & { image: string }

/** Kolory koralików — model „Naszyjnik z koralikami i adresówką”. */
export const BEAD_NECKLACE_COLOR_OPTIONS: BeadNecklaceColorOption[] = [
  {
    id: "czekoladowy-braz",
    label: "Czekoladowy brąz",
    image: "/koraliki/Czekoladowy_braz.jpg",
  },
  {
    id: "karmelowy-marmur",
    label: "Karmelowy marmur",
    image: "/koraliki/Karmelowy_marmur.jpg",
  },
  {
    id: "bezowy-marmur",
    label: "Beżowy marmur",
    image: "/koraliki/Bezowy_marmur.jpg",
  },
  {
    id: "mleczny-bez",
    label: "Mleczny bez",
    image: "/koraliki/Mleczny_bez_(polprzezroczysty).jpg",
  },
]

export const beadNecklaceColorLabel = (id: string) =>
  BEAD_NECKLACE_COLOR_OPTIONS.find((option) => option.id === id)?.label ?? id

export const MAX_BEAD_NECKLACE_COLOR_SELECTIONS = 2

export const beadNecklaceColorLabels = (ids: readonly string[]) =>
  ids.map((id) => beadNecklaceColorLabel(id)).filter(Boolean)

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
  { id: "29", label: "Perła biała", image: "/baza/goldperlabiala.jpg" },
  { id: "30", label: "Perła brązowa", image: "/baza/goldperlabraz.jpg" },
  { id: "31", label: "Jasny brąz", image: "/baza/goldjasnybraz.jpg" },
  { id: "8", label: "Ecru", image: "/baza/goldecru.jpg" },
  { id: "11", label: "Kremowy", image: "/baza/goldkremowy.jpg" },
  { id: "1", label: "Beżowy", image: "/baza/goldbezowy.jpg" },
  { id: "5", label: "Cappuccino", image: "/baza/goldcappuccino.jpg" },
  { id: "13", label: "Oliwkowy", image: "/baza/goldoliwkowy.jpg" },
  { id: "16", label: "Zielony", image: "/baza/goldzielony.jpg" },
  { id: "14", label: "Pastelowy róż", image: "/baza/goldpastelowyroz.jpg" },
  { id: "28", label: "Jasnoróżowy", image: "/baza/goldjasnorozowy.jpg" },
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
  { id: "32", label: "Perła biała", image: "/baza/silverperlabiala.jpg" },
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
  /** Wymiary pod miniaturą w konfiguratorze, np. „8×8 mm”. */
  sizeLabel?: string
  /** Cena w konfiguratorze (PLN). Domyślnie — EXTRA_CHARM_PRICE z lib/pricing. */
  pricePln?: number
}

export const CHARM_STEEL_CATALOG: CharmCatalogItem[] = [
  { id: "stal_serce", label: "Serce", image: "/charms/Stal_Serce.jpg", sizeLabel: "8×8 mm" },
  { id: "stal_lapka", label: "Łapka", image: "/charms/Stal_Lapka.jpg", sizeLabel: "7×7 mm", pricePln: 5 },
  { id: "stal_kokardka", label: "Kokardka", image: "/charms/Stal_Kokardka.jpg", sizeLabel: "15×9 mm", pricePln: 6 },
  { id: "stal_gwiazdka", label: "Gwiazdka", image: "/charms/Stal_Gwiazdka.jpg", sizeLabel: "10×10 mm", pricePln: 3 },
]

export const CHARM_DELICATE_CATALOG: CharmCatalogItem[] = [
  {
    id: "delikatne_biala_kostka",
    label: "Biała kostka",
    image: "/charms/Delikatne_Biala_kostka.jpg",
    sizeLabel: "13×8 mm",
    pricePln: 3,
  },
  {
    id: "delikatne_perelka",
    label: "Perełka",
    image: "/charms/Delikatne_Perelka.jpg",
    sizeLabel: "8×8 mm",
    pricePln: 4,
  },
  {
    id: "delikatne_lapka_ii",
    label: "Łapka II",
    image: "/charms/Delikatne_Lapka_II.jpg",
    sizeLabel: "10×9 mm",
    pricePln: 3,
  },
  {
    id: "delikatne_zlota_kostka",
    label: "Złota kostka",
    image: "/charms/Delikatne_Zlota_kostka.jpg",
    sizeLabel: "10×4 mm",
    pricePln: 3,
  },
  {
    id: "delikatne_motylek_bialy",
    label: "Motylek biały",
    image: "/charms/Delikatne_Motylek_bialy.jpg",
    sizeLabel: "9×6 mm",
    pricePln: 3,
  },
  {
    id: "delikatne_korona_delikatnie_rozowa",
    label: "Korona delikatnie różowa",
    image: "/charms/Deliaktne_Korona_delikatnie_rozowa.jpg",
    sizeLabel: "10×8 mm",
    pricePln: 4,
  },
  {
    id: "delikatne_korona_biala",
    label: "Korona biała",
    image: "/charms/Delikatne_Korona_biala.jpg",
    sizeLabel: "10×8 mm",
    pricePln: 4,
  },
  {
    id: "delikatne_serce_biale",
    label: "Serce białe",
    image: "/charms/Delikatne_Serce_biale.jpg",
    sizeLabel: "8×8 mm",
    pricePln: 3,
  },
  {
    id: "delikatne_serce_delikatnie_rozowe",
    label: "Serce delikatnie różowe",
    image: "/charms/Delikatne_Serce_delikatnie_rozowe.jpg",
    sizeLabel: "8×8 mm",
    pricePln: 3,
  },
  {
    id: "delikatne_muszelka",
    label: "Muszelka",
    image: "/charms/Delikatne_Muszelka.jpg",
    sizeLabel: "15×15 mm",
    pricePln: 4,
  },
]

export const CHARM_SILVER_STEEL_CATALOG: CharmCatalogItem[] = [
  { id: "srebrne_serce", label: "Serce", image: "/charms/Srebrne_Serce.jpg", sizeLabel: "8×8 mm" },
  { id: "srebrne_lapka", label: "Łapka", image: "/charms/Srebrne_Lapka.jpg", sizeLabel: "7×7 mm", pricePln: 5 },
  {
    id: "srebrne_kokardka",
    label: "Kokardka",
    image: "/charms/Srebrne_Kokardka.jpg",
    sizeLabel: "15×9 mm",
    pricePln: 6,
  },
  {
    id: "srebrne_gwiazdka",
    label: "Gwiazdka",
    image: "/charms/Srebrne_Gwiazdka.jpg",
    sizeLabel: "10×10 mm",
    pricePln: 3,
  },
]

export const CHARM_SILVER_DELICATE_CATALOG: CharmCatalogItem[] = [
  {
    id: "srebrne_perelka",
    label: "Perełka",
    image: "/charms/Srebrne_Perelka.jpg",
    sizeLabel: "8×8 mm",
  },
  {
    id: "srebrne_kostka",
    label: "Kostka",
    image: "/charms/Srebrne_kostka.jpg",
    sizeLabel: "10×4 mm",
  },
  {
    id: "srebrne_lapka_ii",
    label: "Łapka II",
    image: "/charms/Srebrne_Lapka_II.jpg",
    sizeLabel: "10×9 mm",
  },
  {
    id: "srebrne_kwiatuszek_rozowy",
    label: "Kwiatuszek różowy",
    image: "/charms/Srebrne_Kwiatuszek_rozowy.jpg",
    sizeLabel: "10×10 mm",
  },
  {
    id: "srebrne_kwiatuszek_bialy",
    label: "Kwiatuszek biały",
    image: "/charms/Srebrne_Kwiatuszek_bialy.jpg",
    sizeLabel: "10×10 mm",
  },
]

export const CHARM_BOLD_CATALOG: CharmCatalogItem[] = [
  {
    id: "wyraziste_rogal_croissant",
    label: "Rogal – croissant",
    image: "/charms/Wyraziste_Rogal_croissant.jpg",
    sizeLabel: "16×10 mm",
    pricePln: 5,
  },
  {
    id: "wyraziste_wasy_brazowe",
    label: "Wąsy brązowe",
    image: "/charms/Wyraziste_Wasy_brazowe.jpg",
    sizeLabel: "16×7 mm",
    pricePln: 4,
  },
  {
    id: "wyraziste_hot_dog",
    label: "Hot dog",
    image: "/charms/Wyraziste_Hot_dog.jpg",
    sizeLabel: "20×7 mm",
    pricePln: 4,
  },
  {
    id: "wyraziste_papryczka_chili",
    label: "Papryczka chili",
    image: "/charms/Wyraziste_Papryczka_chili.jpg",
    sizeLabel: "5×12 mm",
    pricePln: 5,
  },
  {
    id: "wyraziste_serce_czerwone",
    label: "Serce czerwone",
    image: "/charms/Wyraziste_Serce_czerwone.jpg",
    sizeLabel: "8×8 mm",
    pricePln: 3,
  },
  {
    id: "wyraziste_serce_arbuzowe",
    label: "Serce arbuzowe",
    image: "/charms/Wyraziste_Serce_arbuzowe.jpg",
    sizeLabel: "8×8 mm",
    pricePln: 3,
  },
  {
    id: "wyraziste_pszczolka",
    label: "Pszczółka",
    image: "/charms/Wyraziste_Pszczolka.jpg",
    sizeLabel: "10×7 mm",
    pricePln: 3,
  },
  {
    id: "wyraziste_czarna_kostka",
    label: "Czarna kostka",
    image: "/charms/Wyraziste_Czarna_kostka.jpg",
    sizeLabel: "13×8 mm",
  },
  {
    id: "wyraziste_koniczyna",
    label: "Koniczyna",
    image: "/charms/Wyraziste_Koniczyna.jpg",
    sizeLabel: "12×12 mm",
  },
]

export const CHARM_LARGE_HANGING_CATALOG: CharmCatalogItem[] = [
  {
    id: "duze_kawa",
    label: "Kawa",
    image: "/charms/Duze_Kawa.jpg",
    sizeLabel: "10×15 mm",
  },
  {
    id: "duze_rogalik_ii",
    label: "Rogalik II",
    image: "/charms/Duze_Rogalik_II.jpg",
    sizeLabel: "25×15 mm",
  },
  {
    id: "duze_rogalik_iii",
    label: "Rogalik III",
    image: "/charms/Duze_Rogalik_III.jpg",
    sizeLabel: "25×16 mm",
  },
  {
    id: "duze_precelek",
    label: "Precel",
    image: "/charms/Duze_Precelek.jpg",
    sizeLabel: "20×20 mm",
  },
  {
    id: "duze_kwiatuszek_delikatnie_rozowy",
    label: "Kwiatuszek delikatnie różowy",
    image: "/charms/Duze_Kwiatuszek_delikatnie_rozowy.jpg",
    sizeLabel: "15×15 mm",
  },
  {
    id: "duze_kwiatuszek_lawendowy",
    label: "Kwiatuszek lawendowy",
    image: "/charms/Duze_Kwiatuszek_lawendowy.jpg",
    sizeLabel: "15×15 mm",
  },
  {
    id: "duze_lapka_czarna",
    label: "Łapka czarna",
    image: "/charms/Duze_Lapka_czarna.jpg",
    sizeLabel: "15×14 mm",
  },
  {
    id: "duze_oko",
    label: "Oko",
    image: "/charms/Duze_Oko.jpg",
    sizeLabel: "15×15 mm",
  },
]

export type CharmConfiguratorSection = {
  title: string
  subtitle?: string
  items: CharmCatalogItem[]
}

export const CHARM_GOLD_KWIAT_CONFIGURATOR_SECTIONS: CharmConfiguratorSection[] = [
  { title: "Stal nierdzewna", items: CHARM_STEEL_CATALOG },
  { title: "Delikatne akcenty", items: CHARM_DELICATE_CATALOG },
  { title: "Wyraziste akcenty", items: CHARM_BOLD_CATALOG },
  {
    title: "Duże zawieszki",
    subtitle: "Polecane do modeli bez karabińczyka oraz z koralikami",
    items: CHARM_LARGE_HANGING_CATALOG,
  },
]

export const CHARM_SILVER_CONFIGURATOR_SECTIONS: CharmConfiguratorSection[] = [
  { title: "Stal nierdzewna", items: CHARM_SILVER_STEEL_CATALOG },
  { title: "Delikatne akcenty", items: CHARM_SILVER_DELICATE_CATALOG },
]

/** Pełny katalog charmsów w magazynie (wszystkie oprawy). */
export const CHARM_CONFIGURATOR_SECTIONS_ALL: CharmConfiguratorSection[] = [
  ...CHARM_GOLD_KWIAT_CONFIGURATOR_SECTIONS,
  ...CHARM_SILVER_CONFIGURATOR_SECTIONS,
]

/** Sekcje widoczne w konfiguratorze dla wybranej oprawy (classic-tag, glow-tag). */
export function charmConfiguratorSectionsForRing(ringColor: string): CharmConfiguratorSection[] {
  if (ringColor === "srebrny") return CHARM_SILVER_CONFIGURATOR_SECTIONS
  return CHARM_GOLD_KWIAT_CONFIGURATOR_SECTIONS
}

/** Katalog charmsów w konfiguratorze (classic-tag, glow-tag) — zależnie od oprawy / bazy. */
export function configuratorCharmCatalogForRing(ringColor: string): CharmCatalogItem[] {
  return charmConfiguratorSectionsForRing(ringColor).flatMap((section) => section.items)
}

/** @deprecated Użyj charmConfiguratorSectionsForRing — złoto/kwiat bez srebra. */
export const CHARM_CONFIGURATOR_SECTIONS = CHARM_GOLD_KWIAT_CONFIGURATOR_SECTIONS

export const CONFIGURATOR_CHARM_CATALOG: CharmCatalogItem[] = [
  ...CHARM_STEEL_CATALOG,
  ...CHARM_DELICATE_CATALOG,
  ...CHARM_BOLD_CATALOG,
  ...CHARM_LARGE_HANGING_CATALOG,
  ...CHARM_SILVER_STEEL_CATALOG,
  ...CHARM_SILVER_DELICATE_CATALOG,
]

/** Etykiety starych ID charmsów (zamówienia sprzed migracji katalogu). */
const LEGACY_CHARM_LABEL_OPTIONS: CatalogOption[] = [
  { id: "kostkabiala", label: "Biała kostka" },
  { id: "rogalcroissant", label: "Rogal – croissant" },
  { id: "sercestalnierdzewna", label: "Serce – stal nierdzewna" },
  { id: "pszczolkadelikatna", label: "Pszczółka – delikatna" },
  { id: "perelka", label: "Perełka" },
  { id: "lapkastalnierdzewna", label: "Łapka – stal nierdzewna" },
  { id: "lapka", label: "Łapka" },
  { id: "gwiazdkastalnierdzewna", label: "Gwiazdka – stal nierdzewna" },
  { id: "kokardkastalnierdzewna", label: "Kokardka – stal nierdzewna" },
  { id: "zlotakostka", label: "Złota kostka" },
  { id: "czarnakostka", label: "Czarna kostka" },
  { id: "serceintensywnierozowe", label: "Serce – intensywnie różowe" },
  { id: "sercebiale", label: "Serce – białe" },
  { id: "sercedelikatnierozowe", label: "Serce – delikatnie różowe" },
  { id: "sercelimonkowe", label: "Serce – limonkowe" },
  { id: "sercezolte", label: "Serce – żółte" },
  { id: "sercepomaranczowe", label: "Serce – pomarańczowe" },
  { id: "serceczerwone", label: "Serce – czerwone" },
  { id: "sercefioletowe", label: "Serce – fioletowe" },
  { id: "serceczarne", label: "Serce – czarne" },
  { id: "serceblekitne", label: "Serce – błękitne" },
  { id: "koronadelikatnierozowa", label: "Korona – delikatnie różowa" },
  { id: "koronabiala", label: "Korona – biała" },
  { id: "koronaczarna", label: "Korona – czarna" },
  { id: "koronablekitna", label: "Korona – błękitna" },
  { id: "hotdog", label: "Hot dog" },
  { id: "motylekrozowy", label: "Motylek – różowy" },
  { id: "motylekbialy", label: "Motylek – biały" },
  { id: "motylekblekitny", label: "Motylek – błękitny" },
  { id: "motylekdelikatnierozowy", label: "Motylek – delikatnie różowy" },
  { id: "motylekfioletowy", label: "Motylek – fioletowy" },
  { id: "motylekpomaranczowy", label: "Motylek – pomarańczowy" },
  { id: "motylekzielony", label: "Motylek – zielony" },
  { id: "motylekczerwony", label: "Motylek – czerwony" },
  { id: "motylekczarny", label: "Motylek – czarny" },
  { id: "papryczkachili", label: "Papryczka chili" },
  { id: "wasybrazowe", label: "Wąsy – brązowe" },
  { id: "srebrokwiatuszekrozowy", label: "Kwiatuszek – różowy" },
  { id: "srebrokwiatuszekbialy", label: "Kwiatuszek – biały" },
  { id: "srebrosercestalnierdzewna", label: "Serce – stal nierdzewna" },
  { id: "srebrolapkastalnierdzewna", label: "Łapka – stal nierdzewna" },
  { id: "srebrolapka", label: "Łapka" },
  { id: "srebrogwiazdkastalnierdzewna", label: "Gwiazdka – stal nierdzewna" },
  { id: "srebroperelka", label: "Perełka" },
  { id: "srebrosrebrnakostka", label: "Srebrna kostka" },
  { id: "srebrokokardkastalnierdzewna", label: "Kokardka" },
  { id: "duzypiesek", label: "Piesek" },
  { id: "duzalapkaczarna", label: "Łapka – czarna" },
  { id: "duzykwiatuszekrozowy", label: "Kwiatuszek – różowy" },
  { id: "duzykwiatuszekdelikatnierozowy", label: "Kwiatuszek – delikatnie różowy" },
  { id: "duzykwiatuszeklawendowy", label: "Kwiatuszek – lawendowy" },
  { id: "duzamuszelka", label: "Muszelka" },
  { id: "duzeoko", label: "Oko" },
]

export const CHARM_OPTIONS: CatalogOption[] = [
  ...CONFIGURATOR_CHARM_CATALOG.map(({ id, label }) => ({ id, label })),
  ...LEGACY_CHARM_LABEL_OPTIONS,
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

export type NameLayoutId = "imie6" | "imie6plus"

/** Etykieta układu liter na adresówce (krok „Dane na adresówce”). */
export const nameLayoutLabel = (layout: NameLayoutId | string, petNameLength: number) => {
  if (petNameLength > 6 || layout === "imie6plus") return "Na dole"
  if (layout === "imie6") return "Na środku"
  return layout
}

export type KarabinerOption = CatalogOption & {
  image: string
  material: string
}

const coloredClassicKarabiners = (): KarabinerOption[] => [
  {
    id: "pomaranczowyklasyczny",
    label: "Pomarańczowy klasyczny 20 mm",
    material: "metal",
    image: "/karabinczyk/karabinczykpomaranczowyklasyczny.jpg",
  },
  {
    id: "zoltyklasyczny",
    label: "Żółty klasyczny 20 mm",
    material: "metal",
    image: "/karabinczyk/karabinczykzoltyklasyczny.jpg",
  },
  {
    id: "bialyklasyczny",
    label: "Biały klasyczny 20 mm",
    material: "metal",
    image: "/karabinczyk/karabinczykbialyklasyczny.jpg",
  },
  {
    id: "zielonyklasyczny",
    label: "Zielony klasyczny 20 mm",
    material: "metal",
    image: "/karabinczyk/karabinczykzielonyklasyczny.jpg",
  },
  {
    id: "niebieskiklasyczny",
    label: "Niebieski klasyczny 20 mm",
    material: "metal",
    image: "/karabinczyk/karabinczykniebieskiklasyczny.jpg",
  },
  {
    id: "jasnorozowyklasyczny",
    label: "Jasnoróżowy klasyczny 20 mm",
    material: "metal",
    image: "/karabinczyk/karabinczykjasnorozowyklasyczny.jpg",
  },
]

/** Oprawa złota lub kwiat — lista karabińczyków w konfiguratorze. */
export const GOLD_RING_KARABINERS: KarabinerOption[] = [
  {
    id: "klasyczny20g",
    label: "Karabińczyk klasyczny 20 mm",
    material: "metal",
    image: "/karabinczyk/1.jpg",
  },
  {
    id: "kolko20g",
    label: "Kółko łącznikowe 20 mm",
    material: "stal nierdzewna",
    image: "/karabinczyk/2.jpg",
  },
  {
    id: "kolko25g",
    label: "Kółko łącznikowe 25 mm",
    material: "stal nierdzewna",
    image: "/karabinczyk/3.jpg",
  },
  {
    id: "serce22g",
    label: "Karabińczyk serce 22\u00A0×\u00A022\u00A0mm",
    material: "stop metali",
    image: "/karabinczyk/4.jpg",
  },
  {
    id: "serce25g",
    label: "Karabińczyk serce duże 25\u00A0×\u00A025\u00A0mm",
    material: "stop cynku",
    image: "/karabinczyk/5.jpg",
  },
  {
    id: "duzy25g",
    label: "Karabińczyk duży 25 mm",
    material: "metal",
    image: "/karabinczyk/6.jpg",
  },
  {
    id: "kolko28g",
    label: "Kółko łącznikowe 28 mm",
    material: "stal nierdzewna",
    image: "/karabinczyk/7.jpg",
  },
  {
    id: "klasyczny17g",
    label: "Karabińczyk klasyczny 17 mm",
    material: "stal nierdzewna",
    image: "/karabinczyk/8.jpg",
  },
  {
    id: "serce16g",
    label: "Karabińczyk serce 16,4\u00A0×\u00A015,4\u00A0mm",
    material: "stal nierdzewna",
    image: "/karabinczyk/9.jpg",
  },
  {
    id: "mini14g",
    label: "Karabińczyk mini 14,4 mm",
    material: "stal nierdzewna",
    image: "/karabinczyk/10.jpg",
  },
  {
    id: "koralikowy23g",
    label: "Karabińczyk koralikowy 23\u00A0×\u00A010,5\u00A0mm",
    material: "stal nierdzewna",
    image: "/karabinczyk/11.jpg",
  },
  ...coloredClassicKarabiners(),
]

/** Oprawa srebrna — lista karabińczyków w konfiguratorze. */
export const SILVER_RING_KARABINERS: KarabinerOption[] = [
  {
    id: "klasyczny20s",
    label: "Karabińczyk klasyczny 20 mm",
    material: "metal",
    image: "/karabinczyk/12.jpg",
  },
  {
    id: "kolko20s",
    label: "Kółko łącznikowe 20 mm",
    material: "stal nierdzewna",
    image: "/karabinczyk/13.jpg",
  },
  {
    id: "kolko25s",
    label: "Kółko łącznikowe 25 mm",
    material: "stal nierdzewna",
    image: "/karabinczyk/14.jpg",
  },
  {
    id: "serce22s",
    label: "Karabińczyk serce 22\u00A0×\u00A022\u00A0mm",
    material: "stop metali",
    image: "/karabinczyk/15.jpg",
  },
  {
    id: "klasyczny17s",
    label: "Karabińczyk klasyczny 17 mm",
    material: "stal nierdzewna",
    image: "/karabinczyk/16.jpg",
  },
  {
    id: "duzy25s",
    label: "Karabińczyk duży 25 mm",
    material: "metal",
    image: "/karabinczyk/17.jpg",
  },
  {
    id: "kolko28s",
    label: "Kółko łącznikowe 28 mm",
    material: "stal nierdzewna",
    image: "/karabinczyk/18.jpg",
  },
  ...coloredClassicKarabiners(),
]

/** Etykiety starych ID (zamówienia sprzed zmiany katalogu). */
const LEGACY_KARABINER_OPTIONS: KarabinerOption[] = [
  {
    id: "kolkozlote",
    label: "Kółko złote",
    material: "stal nierdzewna",
    image: "/karabinczyk/kolkozlote.jpg",
  },
  {
    id: "kolkozlotesrednie",
    label: "Kółko złote średnie",
    material: "stal nierdzewna",
    image: "/karabinczyk/kolkozlotesrednie.jpg",
  },
  {
    id: "kolkozloteduze",
    label: "Kółko złote duże",
    material: "stal nierdzewna",
    image: "/karabinczyk/kolkozloteduze.jpg",
  },
  {
    id: "kolkosrebrne",
    label: "Kółko srebrne",
    material: "stal nierdzewna",
    image: "/karabinczyk/kolkosrebrne.jpg",
  },
  {
    id: "klasyczny",
    label: "Klasyczny",
    material: "metal",
    image: "/karabinczyk/karabinczykklasyczny.jpg",
  },
  {
    id: "serduszko",
    label: "Serduszko",
    material: "stop metali",
    image: "/karabinczyk/karabinczykserduszko.jpg",
  },
  {
    id: "duzy",
    label: "Duży",
    material: "metal",
    image: "/karabinczyk/karabinczykduzy.jpg",
  },
  {
    id: "klasycznysrebrny",
    label: "Klasyczny srebrny",
    material: "stal nierdzewna",
    image: "/karabinczyk/karabinczykklasycznysrebrny.jpg",
  },
  {
    id: "serduszkosrebrne",
    label: "Serduszko srebrne",
    material: "stop metali",
    image: "/karabinczyk/karabinczykserduszkosrebrne.jpg",
  },
  {
    id: "duzysrebrny",
    label: "Duży srebrny",
    material: "metal",
    image: "/karabinczyk/karabinczykduzysrebrny.jpg",
  },
]

export const karabinersForRingColor = (ringColor: string): KarabinerOption[] =>
  ringColor === "srebrny" ? SILVER_RING_KARABINERS : GOLD_RING_KARABINERS

export const defaultKarabinerForRing = (ringColor: string) =>
  karabinersForRingColor(ringColor)[0]?.id ?? "klasyczny20g"

export const CONNECTING_RING_KARABINER_IDS = [
  "kolko20g",
  "kolko25g",
  "kolko28g",
  "kolko20s",
  "kolko25s",
  "kolko28s",
  "kolkozlote",
  "kolkozlotesrednie",
  "kolkozloteduze",
  "kolkosrebrne",
] as const

const uniqueKarabinersById = (items: KarabinerOption[]) => {
  const byId = new Map<string, KarabinerOption>()
  for (const item of items) {
    if (!byId.has(item.id)) byId.set(item.id, item)
  }
  return [...byId.values()]
}

export const KARABINER_CATALOG: KarabinerOption[] = uniqueKarabinersById([
  ...GOLD_RING_KARABINERS,
  ...SILVER_RING_KARABINERS,
  ...LEGACY_KARABINER_OPTIONS,
])

/** Karabińczyki z konfiguratora (te same ID co w koszyku) — bez archiwalnych pozycji. */
export const CONFIGURATOR_KARABINER_CATALOG: KarabinerOption[] = uniqueKarabinersById([
  ...GOLD_RING_KARABINERS,
  ...SILVER_RING_KARABINERS,
])

/** Mapowanie starych ID magazynu / zamówień na aktualne ID konfiguratora. */
export const LEGACY_KARABINER_ID_TO_CONFIGURATOR: Record<string, string> = {
  kolkozlote: "kolko20g",
  kolkozlotesrednie: "kolko25g",
  kolkozloteduze: "kolko28g",
  kolkosrebrne: "kolko20s",
  klasyczny: "klasyczny20g",
  klasycznysrebrny: "klasyczny20s",
  serduszko: "serce22g",
  serduszkosrebrne: "serce22s",
  duzy: "duzy25g",
  duzysrebrny: "duzy25s",
}

export const KARABINER_OPTIONS: CatalogOption[] = KARABINER_CATALOG.map(({ id, label }) => ({ id, label }))

export const PREMIUM_STRING_CATALOG: StringOption[] = [
  { id: "cappuccino", label: "Cappuccino", images: ["/sznurek/premiumcappuccino.jpg"] },
  { id: "czekoladowy", label: "Czekoladowy", images: ["/sznurek/premiumczekoladowy.jpg"] },
  { id: "ecru", label: "Ecru", images: ["/sznurek/premiumecru.jpg"] },
  { id: "jasny-braz", label: "Jasny brąz", images: ["/sznurek/premiumjasnybraz.jpg"] },
  { id: "kremowy", label: "Kremowy", images: ["/sznurek/premiumkremowy.jpg"] },
  { id: "lawenda", label: "Lawenda", images: ["/sznurek/premiumlawenda.jpg"] },
  { id: "teal", label: "Teal", images: ["/sznurek/premiumteal.jpg"] },
  { id: "winny", label: "Winny", images: ["/sznurek/premiumwinny.jpg"] },
]

export const PREMIUM_STRING_OPTIONS: CatalogOption[] = PREMIUM_STRING_CATALOG.map(({ id, label }) => ({
  id,
  label,
}))

export const CLASSIC_STRING_CATALOG: StringOption[] = [
  { id: "bezowy", label: "Beżowy", images: ["/sznurek/klasycznybezowy.jpg"] },
  { id: "braz", label: "Brąz", images: ["/sznurek/klasycznybraz.jpg"] },
  { id: "butelkowy", label: "Butelkowy", images: ["/sznurek/klasycznybutelkowy.jpg"] },
  { id: "ciemny-bez", label: "Ciemny beż", images: ["/sznurek/klasycznyciemnybez.jpg"] },
  { id: "czarny", label: "Czarny", images: ["/sznurek/klasycznyczarny.jpg"] },
  { id: "czerwony", label: "Czerwony", images: ["/sznurek/klasycznyczerwony.jpg"] },
  { id: "granatowy", label: "Granatowy", images: ["/sznurek/klasycznygranatowy.jpg"] },
  { id: "jasnorozowy", label: "Jasnoróżowy", images: ["/sznurek/klasycznyjasnorozowy.jpg"] },
  { id: "niebieski", label: "Niebieski", images: ["/sznurek/klasycznyniebieski.jpg"] },
  { id: "srebrny", label: "Srebrny", images: ["/sznurek/klasycznysrebrny.jpg"] },
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

export const stopperLabel = (id: string) =>
  STOPPER_OPTIONS.find((option) => option.id === id)?.label ?? id

export const stopperSelectionLabel = (ids: string[]) => {
  const counts = new Map<string, number>()
  for (const id of ids) {
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([id, count]) => (count > 1 ? `${stopperLabel(id)} ×${count}` : stopperLabel(id)))
    .join(", ")
}

export const stopperIdsFromStored = (value: string | null) => {
  if (!value) return []
  if (value === "złote") return ["1"]
  if (value === "srebrne") return ["2"]
  return value.split(",").map((part) => part.trim()).filter(Boolean)
}

export const stopperCountFromStored = (value: string | null) =>
  stopperIdsFromStored(value).length

export const STICKER_COUNT = 49

export const STICKER_CATALOG: { id: string; label: string; image: string }[] = Array.from(
  { length: STICKER_COUNT },
  (_, index) => {
    const n = index + 1
    return {
      id: String(n),
      label: `Pupil ${n}`,
      image: `/naklejki/${n}.jpg`,
    }
  },
)

export const STICKER_OPTIONS: CatalogOption[] = STICKER_CATALOG.map(({ id, label }) => ({
  id,
  label,
}))

export const optionLabel = (options: CatalogOption[], id: string) =>
  options.find((option) => option.id === id)?.label ?? `Podpis ${id}`

export const stickerLabel = (id: string) => optionLabel(STICKER_OPTIONS, id)
