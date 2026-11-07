import { CLASSIC_TAG_PRODUCT, getCatalogProduct, productLineTitle, ROGALIK_TAG_PRODUCT } from "@/lib/catalog"
import { charmSummaryLine } from "@/lib/charm-pricing"
import { BASE_OPTIONS, beadNecklaceColorLabels, BEAD_NECKLACE_TAG_MODEL_ID, CHARM_LABEL_OPTIONS, charmMountingLabel, CLASSIC_STRING_OPTIONS, GLOW_STRING_OPTIONS, KARABINER_OPTIONS, nameLayoutLabel, optionLabel, oprawaDisplayAdjective, PREMIUM_STRING_OPTIONS, stopperIdsFromStored, stopperSelectionLabel, stickerLabel, tagModelKarabinersAllUnitsPaid, tagModelLabel, isStringWithoutKarabinerTagModel, isTagOnlyWithKarabinerTagModel } from "@/lib/catalog-options"
import { ROGALIK_ORDER_RING_COLOR } from "@/lib/order-from-cart"
import {
  ROGALIK_BEADS_OPTIONS,
  ROGALIK_CHARM_OPTIONS,
  ROGALIK_COLOR_OPTIONS,
  ROGALIK_CORD_COLOR_OPTIONS,
  rogalikMountingTileLabel,
  rogalikMountingUsesKarabinerStep,
  rogalikOptionLabel,
} from "@/lib/rogalik-options"
import { rogalikBaseUnitPriceForMounting, type RogalikMountingBasePrices } from "@/lib/rogalik-admin-pricing"
import { fulfillmentRangeCompact } from "@/lib/fulfillment-dates"
import { formatPolishMobile, normalizePolishPhone } from "@/lib/phone"
import { rogalikPriceBreakdown, type RogalikPriceLine } from "@/lib/rogalik-pricing"
import {
  classicTagPriceBreakdown,
  type ClassicTagPricingContext,
} from "@/lib/classic-tag-pricing"
import {
  appendBeadNecklaceOrderedOptions,
  appendJewelryConfiguratorAddonOptions,
  isBeadNecklaceTagModel,
} from "@/lib/configurator-options-order"
import {
  inferGlowTextColorFromKarabiners,
  karabinerCatalogRingKey,
  karabinerQuantitiesFromOrder,
  karabinerQuantitiesTotal,
  karabinerSummaryLines,
} from "@/lib/karabiner-pricing"
import {
  classicStringUnitPrice,
  glowStringUnitPrice,
  premiumStringUnitPrice,
  stringSizeFromNeckCm,
  stringSummaryLine,
} from "@/lib/pricing"
import type { DeliveryType, OrderItemRecord, OrderStatus } from "@/lib/types/order"

export const formatPrice = (value: number) =>
  `${value.toFixed(2).replace(".", ",")} zł`

export const cartItemModelDisplay = (tagModel: string | null | undefined) => {
  const id = tagModel?.trim()
  return id ? tagModelLabel(id) : null
}

export type CartItemClassicConfigSummary = {
  model: string | null
  /** Rodzaj oprawy (złota, srebrna, kwiat) — wyświetlany po prawej obok etykiety „Oprawa”. */
  oprawaRodzaj: string | null
  kolor: string | null
}

/** Model, oprawa i kolor bazy — koszyk / checkout (adresówka biżuteryjna). */
export const cartItemClassicConfigSummary = (
  productSlug: string,
  config: { tagModel?: string | null; ringColor?: string; baseOption?: string },
): CartItemClassicConfigSummary | null => {
  if (getCatalogProduct(productSlug)?.configuratorId !== "classic-tag") return null

  const ring = config.ringColor?.trim() ?? ""
  const baseId = config.baseOption?.trim() ?? ""

  return {
    model: cartItemModelDisplay(config.tagModel),
    oprawaRodzaj: ring && ring !== "glow" ? oprawaDisplayAdjective(ring) : null,
    kolor: baseId ? optionLabel(BASE_OPTIONS, baseId) : null,
  }
}

export const orderPetNamesLabel = (names: string[]) => {
  const unique: string[] = []
  for (const name of names) {
    const trimmed = name.trim()
    if (!trimmed || unique.includes(trimmed)) continue
    unique.push(trimmed)
  }
  return unique.length > 0 ? unique.join(", ") : "—"
}

export const formatRogalikPriceLineAmount = (line: RogalikPriceLine, quantity = 1) => {
  const value = line.amountPln * quantity
  const formatted = formatPrice(value)
  return line.isBase ? formatted : `+${formatted}`
}

export const orderItemTitle = (
  item: Pick<OrderItemRecord, "dogName"> & { productName?: string | null },
) => productLineTitle(item.productName || CLASSIC_TAG_PRODUCT.name, item.dogName)

export const formatOrderDate = (iso: string) =>
  new Date(iso).toLocaleString("pl-PL", {
    timeZone: "Europe/Warsaw",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

export const formatOrderDateOnly = (iso: string) =>
  new Date(iso).toLocaleDateString("pl-PL", {
    timeZone: "Europe/Warsaw",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

export const formatAddress = (street: string, postcode: string, city: string) =>
  [street.trim(), [postcode.trim(), city.trim()].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ")

export const deliveryLabel = (type: DeliveryType) =>
  type === "paczkomat" ? "Paczkomat 24/7" : "Kurier"

export const fulfillmentLabel = (fastDelivery: boolean) =>
  fastDelivery ? "Przyspieszony (3-4 dni robocze)" : "Standardowy (6-10 dni roboczych)"

export const ringColorLabel = (ringColor: string) => {
  if (ringColor === "glow") return "Glow"
  if (ringColor === "złoty") return "Złoty"
  if (ringColor === "srebrny") return "Srebrny"
  if (ringColor === "kwiat") return "Kwiat"
  return ringColor
}

export type OrderFrameBaseSource = Pick<OrderItemRecord, "ringColor" | "baseColor" | "productSlug"> & {
  quantity?: number
}

export const isRogalikOrderItem = (
  item: Pick<OrderItemRecord, "productSlug" | "ringColor">,
) =>
  item.productSlug === ROGALIK_TAG_PRODUCT.slug || item.ringColor === ROGALIK_ORDER_RING_COLOR

export const orderItemFrameBaseLabel = (item: OrderFrameBaseSource) => {
  const suffix = item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : ""
  if (isRogalikOrderItem(item)) {
    const color = rogalikOptionLabel(ROGALIK_COLOR_OPTIONS, item.baseColor)
    return `Rogalik · ${color}${suffix}`
  }
  return `${ringColorLabel(item.ringColor)} · ${optionLabel(BASE_OPTIONS, item.baseColor)}${suffix}`
}

export const orderFrameBaseLines = (items: OrderFrameBaseSource[]) =>
  items.map((item) => orderItemFrameBaseLabel(item))

export const fulfillmentRangeLabel = (fastDelivery: boolean, orderCreatedAt: string) => {
  const prefix = fastDelivery ? "Ekspresowy" : "Standardowy"
  return `${prefix} — ${fulfillmentRangeCompact(fastDelivery, new Date(orderCreatedAt))}`
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Oczekuje na płatność",
  paid: "Opłacone",
  processing: "Zalane",
  shipped: "Wysłane",
  completed: "Zrealizowane",
  cancelled: "Anulowane",
}

export const ADMIN_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: STATUS_LABELS.pending },
  { value: "paid", label: STATUS_LABELS.paid },
  { value: "processing", label: STATUS_LABELS.processing },
  { value: "shipped", label: STATUS_LABELS.shipped },
  { value: "cancelled", label: STATUS_LABELS.cancelled },
]

const STATUSES_BLOCKING_PENDING: OrderStatus[] = ["paid", "processing", "shipped", "completed"]

export const canSetOrderStatusToPending = (currentStatus: OrderStatus) =>
  !STATUSES_BLOCKING_PENDING.includes(currentStatus)

export const statusOptionsForOrder = (currentStatus: OrderStatus) => {
  const base =
    currentStatus === "completed"
      ? [{ value: "completed" as const, label: statusLabel("completed") }, ...ADMIN_STATUS_OPTIONS]
      : ADMIN_STATUS_OPTIONS

  if (!canSetOrderStatusToPending(currentStatus)) {
    return base.filter((option) => option.value !== "pending")
  }

  return base
}

export const statusLabel = (status: OrderStatus) =>
  STATUS_LABELS[status] ?? status

const optionTitle = (id: string) => optionLabel(KARABINER_OPTIONS, id)

const capitalize = (value: string) =>
  value ? value.charAt(0).toLocaleUpperCase("pl-PL") + value.slice(1) : value

export type OrderOption = { label: string; values: string[] }

export type OrderItemOptionsSource = Pick<
  OrderItemRecord,
  | "productSlug"
  | "tagModel"
  | "beadNecklaceColors"
  | "ringColor"
  | "baseColor"
  | "baseCharms"
  | "extraCharms"
  | "baseCarabiner"
  | "extraCarabiner"
  | "stringPremium"
  | "stringClassic"
  | "stringGlow"
  | "dogNeck"
  | "stoppers"
  | "sticker"
  | "dogName"
  | "numberOnTag"
  | "dialCodeInfo"
  | "charmMounting"
  | "nameLayout"
  | "rogalikMounting"
  | "rogalikCordColor"
  | "rogalikBeads"
  | "rogalikCharms"
  | "baseUnitPricePln"
>

export const rogalikOrderItemPriceLines = (
  item: OrderItemOptionsSource,
  charmPrices?: import("@/lib/charm-unit-pricing").CharmUnitPrices,
  rogalikBaseFallbacks?: {
    mountingBasePrices?: RogalikMountingBasePrices
    legacySingleBasePln?: number
  },
): RogalikPriceLine[] => {
  const karabinerQuantities = karabinerQuantitiesFromOrder(
    item.baseCarabiner ?? "-",
    item.extraCarabiner ?? [],
  )
  const rogalikKarabinerRing = karabinerCatalogRingKey({
    configuratorId: "rogalik-tag",
    ringColor: item.ringColor ?? "",
    glowTextColor: "",
  })
  return rogalikPriceBreakdown({
    rogalikMounting: item.rogalikMounting ?? "",
    dogNeck: item.dogNeck,
    rogalikCordColor: item.rogalikCordColor,
    rogalikBeads: item.rogalikBeads,
    rogalikCharms: item.rogalikCharms,
    karabinerQuantities,
    karabinerCatalogRingKey: rogalikKarabinerRing,
    includeDialCode: item.dialCodeInfo,
    charmUnitPrices: charmPrices,
    baseUnitPricePln:
      item.baseUnitPricePln != null
        ? item.baseUnitPricePln
        : rogalikBaseFallbacks?.mountingBasePrices
          ? rogalikBaseUnitPriceForMounting(item.rogalikMounting, rogalikBaseFallbacks.mountingBasePrices)
          : rogalikBaseFallbacks?.legacySingleBasePln,
  })
}

export const classicOrderItemPriceLines = (
  item: OrderItemOptionsSource,
  ctx: ClassicTagPricingContext = {},
): RogalikPriceLine[] => {
  if (isRogalikOrderItem(item)) return []
  return classicTagPriceBreakdown(
    {
      productSlug: item.productSlug,
      tagModel: item.tagModel,
      ringColor: item.ringColor ?? "złoty",
      baseCarabiner: item.baseCarabiner,
      extraCharms: item.extraCharms ?? [],
      extraCarabiner: item.extraCarabiner ?? [],
      stringPremium: item.stringPremium ?? [],
      stringClassic: item.stringClassic ?? [],
      stringGlow: item.stringGlow ?? [],
      dogNeck: item.dogNeck,
      stoppers: item.stoppers,
      sticker: item.sticker,
      dialCodeInfo: item.dialCodeInfo,
      beadNecklaceColors: item.beadNecklaceColors,
    },
    ctx,
  )
}

const formatTagPhoneNumber = (numberOnTag: string, includeDialCode = false) => {
  const trimmed = numberOnTag.trim()
  if (!trimmed) return trimmed
  const digits = normalizePolishPhone(trimmed)
  const grouped = formatPolishMobile(digits)
  if (includeDialCode && /^\d{9}$/.test(digits)) {
    return `+48 ${grouped}`
  }
  return grouped
}

const tagPhoneDisplay = (numberOnTag: string, dialCodeInfo: boolean) =>
  formatTagPhoneNumber(numberOnTag, dialCodeInfo)

export type RogalikConfiguratorOptionsInput = {
  rogalikColor: string
  rogalikMounting: string
  /** Gotowy tekst obwodu (np. z zamówienia) lub złożony w koszyku. */
  dogNeckDisplay?: string | null
  rogalikCordColor?: string | null
  rogalikBeads?: string | null
  rogalikCharms?: string[]
  karabinerOption?: string
  extraKarabiners?: string[]
  karabinerQuantities?: Record<string, number>
  petName: string
  phoneNumber: string
  includeDialCode?: boolean
}

/** Lista opcji rogalika — koszyk, admin, maile (ten sam układ). */
export const rogalikConfiguratorOptions = (
  input: RogalikConfiguratorOptionsInput,
  charmPrices?: import("@/lib/charm-unit-pricing").CharmUnitPrices,
): OrderOption[] => {
  const options: OrderOption[] = []
  const mounting = input.rogalikMounting ?? ""
  const charms = input.rogalikCharms ?? []

  if (mounting) {
    options.push({
      label: "Model",
      values: [rogalikMountingTileLabel(mounting)],
    })
  }
  options.push({
    label: "Kolor rogalika",
    values: [rogalikOptionLabel(ROGALIK_COLOR_OPTIONS, input.rogalikColor)],
  })

  if (input.dogNeckDisplay) {
    options.push({ label: "Obwód szyi", values: [input.dogNeckDisplay] })
  }
  if (input.rogalikCordColor) {
    options.push({
      label: "Kolor sznureczka",
      values: [rogalikOptionLabel(ROGALIK_CORD_COLOR_OPTIONS, input.rogalikCordColor)],
    })
  }
  if (input.rogalikBeads) {
    options.push({
      label: "Koraliki",
      values: [rogalikOptionLabel(ROGALIK_BEADS_OPTIONS, input.rogalikBeads)],
    })
  }

  if (rogalikMountingUsesKarabinerStep(mounting)) {
    const fromQuantities = input.karabinerQuantities ?? {}
    const quantities =
      karabinerQuantitiesTotal(fromQuantities) > 0
        ? fromQuantities
        : karabinerQuantitiesFromOrder(input.karabinerOption ?? "-", input.extraKarabiners ?? [])
    if (karabinerQuantitiesTotal(quantities) > 0) {
      const rogalikKarabinerRing = karabinerCatalogRingKey({
        configuratorId: "rogalik-tag",
        ringColor: "",
        glowTextColor: "",
      })
      options.push({
        label: "Karabińczyki",
        values: karabinerSummaryLines(quantities, rogalikKarabinerRing, optionTitle),
      })
    }
  }

  if (charms.length > 0) {
    options.push({
      label: "Charmsy",
      values: charms.map((id) =>
        charmSummaryLine(id, rogalikOptionLabel(ROGALIK_CHARM_OPTIONS, id), charmPrices),
      ),
    })
  }

  options.push({ label: "Imię pupila", values: [input.petName] })
  options.push({
    label: "Nr telefonu",
    values: [formatTagPhoneNumber(input.phoneNumber, input.includeDialCode === true)],
  })

  return options
}

const rogalikOrderItemOptions = (
  item: OrderItemOptionsSource,
  charmPrices?: import("@/lib/charm-unit-pricing").CharmUnitPrices,
): OrderOption[] =>
  rogalikConfiguratorOptions({
    rogalikColor: item.baseColor,
    rogalikMounting: item.rogalikMounting ?? "",
    dogNeckDisplay: item.dogNeck,
    rogalikCordColor: item.rogalikCordColor,
    rogalikBeads: item.rogalikBeads,
    rogalikCharms: item.rogalikCharms,
    karabinerOption: item.baseCarabiner,
    extraKarabiners: item.extraCarabiner,
    petName: item.dogName,
    phoneNumber: item.numberOnTag,
    includeDialCode: item.dialCodeInfo,
  },
  charmPrices,
  )

export const orderItemOptions = (
  item: OrderItemOptionsSource,
  charmPrices?: import("@/lib/charm-unit-pricing").CharmUnitPrices,
): OrderOption[] => {
  if (isRogalikOrderItem(item)) {
    return rogalikOrderItemOptions(item, charmPrices)
  }

  const options: OrderOption[] = []

  if (item.tagModel) {
    options.push({
      label: "Model",
      values: [tagModelLabel(item.tagModel)],
    })
  }

  if (item.ringColor && item.ringColor !== "glow") {
    options.push({
      label: "Oprawa",
      values: [oprawaDisplayAdjective(item.ringColor)],
    })
  }

  if (item.baseColor?.trim()) {
    options.push({
      label: item.ringColor === "glow" ? "Baza" : "Kolor",
      values: [optionLabel(BASE_OPTIONS, item.baseColor)],
    })
  }

  const product = getCatalogProduct(item.productSlug)
  const configuratorId = product?.configuratorId
  const beadNecklace = isBeadNecklaceTagModel(item.tagModel)
  const stringWithoutKarabiner = isStringWithoutKarabinerTagModel(item.tagModel)
  const tagOnlyWithKarabiner = isTagOnlyWithKarabinerTagModel(item.tagModel)
  const usesUnifiedKarabiners =
    configuratorId === "classic-tag" || configuratorId === "glow-tag"

  const charmIds: string[] = []
  const legacyFreeCharm =
    item.baseCharms.trim() !== "" && item.baseCharms !== "-" && item.baseCharms !== "—"
  if (legacyFreeCharm) {
    charmIds.push(item.baseCharms)
  }
  for (const id of item.extraCharms) {
    if (!charmIds.includes(id)) charmIds.push(id)
  }

  const charmsBlock: OrderOption | null =
    charmIds.length > 0
      ? {
          label: "Charms (zawieszki)",
          values: charmIds.map((id) => charmSummaryLine(id, undefined, charmPrices)),
        }
      : null

  const legacyCharmMountingBlock: OrderOption | null =
    legacyFreeCharm && item.charmMounting
      ? {
          label: "Mocowanie charms",
          values: [charmMountingLabel(item.charmMounting)],
        }
      : null

  let karabinersBlock: OrderOption | null = null
  const legacyKarabiners: OrderOption[] = []
  if (usesUnifiedKarabiners) {
    const quantities = karabinerQuantitiesFromOrder(
      item.baseCarabiner ?? "-",
      item.extraCarabiner,
    )
    const entries = Object.entries(quantities).filter(([, qty]) => qty > 0)
    if (entries.length > 0) {
      const glowTextColor =
        configuratorId === "glow-tag"
          ? inferGlowTextColorFromKarabiners(item.baseCarabiner ?? "-", item.extraCarabiner)
          : ""
      const karabinerRing = karabinerCatalogRingKey({
        configuratorId,
        ringColor: item.ringColor ?? "",
        glowTextColor,
      })
      karabinersBlock = {
        label: "Karabińczyki",
        values: karabinerSummaryLines(quantities, karabinerRing, optionTitle, {
          allUnitsPaid: tagModelKarabinersAllUnitsPaid(item.tagModel),
        }),
      }
    }
  } else {
    legacyKarabiners.push({
      label: "Darmowy karabińczyk",
      values: [optionTitle(item.baseCarabiner)],
    })
    if (item.extraCarabiner.length > 0) {
      legacyKarabiners.push({
        label: "Dodatkowe karabińczyki",
        values: item.extraCarabiner.map(optionTitle),
      })
    }
  }

  const stickerBlock: OrderOption | null = item.sticker
    ? { label: "Naklejka", values: [stickerLabel(item.sticker)] }
    : null

  const stringSize = stringSizeFromNeckCm(item.dogNeck)
  const premiumUnitPrice = premiumStringUnitPrice(stringSize)
  const classicUnitPrice = classicStringUnitPrice(stringSize)
  const glowUnitPrice = glowStringUnitPrice(stringSize)

  const stringsPremiumBlock: OrderOption | null =
    item.stringPremium.length > 0
      ? {
          label: "Sznurek Premium",
          values: item.stringPremium.map((id) =>
            stringSummaryLine(optionLabel(PREMIUM_STRING_OPTIONS, id), premiumUnitPrice),
          ),
        }
      : null

  const stringsClassicBlock: OrderOption | null =
    item.stringClassic.length > 0
      ? {
          label: "Sznurek Klasyczny",
          values: item.stringClassic.map((id) =>
            stringSummaryLine(optionLabel(CLASSIC_STRING_OPTIONS, id), classicUnitPrice),
          ),
        }
      : null

  const stringsGlowBlock: OrderOption | null =
    item.stringGlow.length > 0
      ? {
          label: "Sznurek Glow",
          values: item.stringGlow.map((id) =>
            stringSummaryLine(optionLabel(GLOW_STRING_OPTIONS, id), glowUnitPrice),
          ),
        }
      : null

  const beadNecklaceBlock: OrderOption | null = item.beadNecklaceColors?.length
    ? {
        label: "Koraliki",
        values: beadNecklaceColorLabels(item.beadNecklaceColors),
      }
    : null

  const neckCircumferenceBlock: OrderOption | null = item.dogNeck
    ? { label: "Obwód szyi", values: [item.dogNeck] }
    : null

  const stopersBlock: OrderOption | null = item.stoppers
    ? {
        label: "Stopery",
        values: [
          stopperIdsFromStored(item.stoppers).length > 0
            ? stopperSelectionLabel(stopperIdsFromStored(item.stoppers))
            : item.stoppers,
        ],
      }
    : null

  const dialCodeBlock: OrderOption | null = item.dialCodeInfo
    ? { label: "Numer kierunkowy na adresówce", values: ["Tak"] }
    : null

  if (beadNecklace) {
    appendBeadNecklaceOrderedOptions(options, {
      ringColor: item.ringColor ?? "",
      sticker: stickerBlock,
      beadNecklace: beadNecklaceBlock,
      neckCircumference: neckCircumferenceBlock,
      stringsPremium: stringsPremiumBlock,
      stringsClassic: stringsClassicBlock,
      stringsGlow: stringsGlowBlock,
      charms: charmsBlock,
      karabiners: karabinersBlock,
      stopers: stopersBlock,
      dialCode: dialCodeBlock,
    })
  } else if (stringWithoutKarabiner) {
    appendBeadNecklaceOrderedOptions(options, {
      ringColor: item.ringColor ?? "",
      sticker: stickerBlock,
      beadNecklace: null,
      neckCircumference: neckCircumferenceBlock,
      stringsPremium: stringsPremiumBlock,
      stringsClassic: stringsClassicBlock,
      stringsGlow: stringsGlowBlock,
      charms: charmsBlock,
      karabiners: karabinersBlock,
      stopers: stopersBlock,
      dialCode: dialCodeBlock,
    })
  } else if (tagOnlyWithKarabiner) {
    appendBeadNecklaceOrderedOptions(options, {
      ringColor: item.ringColor ?? "",
      sticker: stickerBlock,
      beadNecklace: null,
      neckCircumference: null,
      stringsPremium: null,
      stringsClassic: null,
      stringsGlow: null,
      charms: charmsBlock,
      karabiners: karabinersBlock,
      stopers: null,
      dialCode: dialCodeBlock,
    })
  } else {
    appendJewelryConfiguratorAddonOptions(options, {
      configuratorId,
      ringColor: item.ringColor ?? "",
      tagModel: item.tagModel,
      charms: charmsBlock,
      karabiners: karabinersBlock,
      sticker: stickerBlock,
      legacyKarabiners,
      legacyCharmMounting: legacyCharmMountingBlock,
    })

    if (stringsPremiumBlock) options.push(stringsPremiumBlock)
    if (stringsClassicBlock) options.push(stringsClassicBlock)
    if (stringsGlowBlock) options.push(stringsGlowBlock)

    if (neckCircumferenceBlock) options.push(neckCircumferenceBlock)
    if (stopersBlock) options.push(stopersBlock)
  }

  options.push({ label: "Imię pupila", values: [item.dogName] })

  if (item.nameLayout) {
    options.push({
      label: "Układ liter na adresówce",
      values: [nameLayoutLabel(item.nameLayout, item.dogName.trim().length)],
    })
  }

  options.push({ label: "Nr telefonu", values: [tagPhoneDisplay(item.numberOnTag, item.dialCodeInfo)] })

  return options
}
