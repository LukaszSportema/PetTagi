/**
 * Audyt: walidacja ceny zamówienia (ta sama co konfigurator) = suma składników przychodów.
 * npx tsx scripts/revenue-configurator-audit.ts
 */
import { CLASSIC_TAG_PRODUCT, GLOW_TAG_PRODUCT, ROGALIK_TAG_PRODUCT } from "@/lib/catalog"
import {
  BEAD_NECKLACE_TAG_MODEL_ID,
  tagModelKarabinersAllUnitsPaid,
} from "@/lib/catalog-options"
import { expectedOrderItemUnitPrice } from "@/lib/expected-order-item-price"
import { itemRevenueParts } from "@/lib/pricing"
import { rogalikItemRevenueParts } from "@/lib/rogalik-revenue"
import { ROGALIK_MOUNTING_IDS } from "@/lib/rogalik-mounting-ids"
import { DEFAULT_TAG_MODEL_BASE_PRICES, TAG_MODEL_IDS } from "@/lib/tag-model-pricing"
import { DEFAULT_ROGALIK_MOUNTING_BASE_PRICES } from "@/lib/rogalik-admin-pricing"
import { orderKarabinersFromQuantities } from "@/lib/karabiner-pricing"
import type { CreateOrderItemInput } from "@/lib/types/order"
import { ROGALIK_ORDER_RING_COLOR } from "@/lib/order-from-cart"
import { EXTRA_CHARM_PRICE } from "@/lib/pricing-constants"
import type { CharmUnitPrices } from "@/lib/charm-unit-pricing"

const charmPrices: CharmUnitPrices = {
  stal_serce: EXTRA_CHARM_PRICE,
  "charm-1": EXTRA_CHARM_PRICE,
}

const ctx = {
  charmPrices,
  tagModelBasePrices: DEFAULT_TAG_MODEL_BASE_PRICES,
  rogalikMountingBasePrices: DEFAULT_ROGALIK_MOUNTING_BASE_PRICES,
}

const sumRevenueParts = (parts: ReturnType<typeof itemRevenueParts>) =>
  parts.base +
  parts.charms +
  parts.karabiners +
  parts.strings +
  parts.beads +
  parts.stoppers +
  parts.stickers +
  parts.dialCode

const mismatches: { scenario: string; expected: number; revenueSum: number }[] = []
let scenarios = 0

const checkJewelry = (scenario: string, item: CreateOrderItemInput) => {
  const expected = expectedOrderItemUnitPrice(item, ctx)
  const priced = {
    quantity: 1,
    productSlug: item.productSlug,
    tagModel: item.tagModel,
    ringColor: item.ringColor,
    baseCarabiner: item.baseCarabiner,
    extraCharms: item.extraCharms,
    extraCarabiner: item.extraCarabiner,
    stringPremium: item.stringPremium,
    stringClassic: item.stringClassic,
    stringGlow: item.stringGlow,
    dogNeck: item.dogNeck,
    stoppers: item.stoppers,
    sticker: item.sticker,
    dialCodeInfo: item.dialCodeInfo,
    beadNecklaceColors: item.beadNecklaceColors,
  }
  const revenueSum = sumRevenueParts(itemRevenueParts(priced, ctx))
  scenarios++
  if (Math.abs(expected - revenueSum) > 0.001) {
    mismatches.push({ scenario, expected, revenueSum })
  }
}

const checkRogalik = (scenario: string, item: CreateOrderItemInput) => {
  const expected = expectedOrderItemUnitPrice(item, ctx)
  const priced = {
    quantity: 1,
    productSlug: item.productSlug,
    ringColor: item.ringColor,
    baseCarabiner: item.baseCarabiner,
    extraCharms: item.extraCharms,
    extraCarabiner: item.extraCarabiner,
    stringPremium: item.stringPremium,
    stringClassic: item.stringClassic,
    stringGlow: item.stringGlow,
    dogNeck: item.dogNeck,
    stoppers: item.stoppers,
    dialCodeInfo: item.dialCodeInfo,
    beadNecklaceColors: item.beadNecklaceColors,
    rogalikMounting: item.rogalikMounting,
    rogalikCordColor: item.rogalikCordColor,
    rogalikBeads: item.rogalikBeads,
    rogalikCharms: item.rogalikCharms,
    rogalikBaseUnitPln: item.baseUnitPrice,
  }
  const revenueSum = sumRevenueParts(rogalikItemRevenueParts(priced, charmPrices, ctx))
  scenarios++
  if (Math.abs(expected - revenueSum) > 0.001) {
    mismatches.push({ scenario, expected, revenueSum })
  }
}

const ringColors = ["złoty", "srebrny", "kwiat"] as const

for (const productSlug of [CLASSIC_TAG_PRODUCT.slug, GLOW_TAG_PRODUCT.slug]) {
  const isGlow = productSlug === GLOW_TAG_PRODUCT.slug
  const models = isGlow ? [undefined] : [...TAG_MODEL_IDS, BEAD_NECKLACE_TAG_MODEL_ID]

  for (const tagModel of models) {
    for (const ringColor of isGlow ? (["glow"] as const) : ringColors) {
      for (const neck of ["20", "30", "40", "50"]) {
        const karabinerRing = ringColor === "srebrny" ? "srebrny" : "złoty"
        const allPaid = tagModelKarabinersAllUnitsPaid(tagModel)
        const kq = allPaid
          ? { koralikowy23g: 3 }
          : { klasyczny20g: 1, serce25g: 2 }
        const { baseCarabiner, extraCarabiner } = orderKarabinersFromQuantities(kq, karabinerRing)
        checkJewelry(`${productSlug} ${tagModel ?? "glow"} ${ringColor} ${neck}`, {
          productSlug,
          quantity: 1,
          tagModel: tagModel ?? null,
          ringColor: isGlow ? "glow" : ringColor,
          baseCarabiner,
          extraCharms: ["stal_serce"],
          extraCarabiner,
          stringPremium: tagModel === "sznurek-bez-karabinier" ? ["Cappuccino"] : [],
          stringClassic: tagModel === "sznurek-karabinier" ? ["Beż"] : [],
          stringGlow: isGlow ? ["Neon"] : [],
          dogNeck: `${neck} cm`,
          stoppers: tagModel === "sama-karabinier" ? null : "1",
          sticker: isGlow || ringColor === "kwiat" ? null : "1",
          dialCodeInfo: true,
          beadNecklaceColors:
            tagModel === BEAD_NECKLACE_TAG_MODEL_ID ? ["cappuccino", "vanilla"] : [],
        })
      }
    }
  }
}

for (const mounting of ROGALIK_MOUNTING_IDS) {
  for (const neck of ["20", "30", "40"]) {
    const kq = { klasyczny20g: 2 }
    const { baseCarabiner, extraCarabiner } = orderKarabinersFromQuantities(kq, "złoty")
    checkRogalik(`rogalik ${mounting} ${neck}`, {
      productSlug: ROGALIK_TAG_PRODUCT.slug,
      quantity: 1,
      ringColor: ROGALIK_ORDER_RING_COLOR,
      tagModel: null,
      baseCarabiner,
      extraCharms: ["stal_serce"],
      extraCarabiner,
      stringPremium: mounting === "karabinczyk" ? [] : ["Cappuccino"],
      stringClassic: [],
      stringGlow: [],
      dogNeck: `${neck} cm`,
      stoppers: mounting === "karabinczyk" ? null : "1",
      sticker: null,
      dialCodeInfo: true,
      beadNecklaceColors: mounting === "koraliki" ? ["cappuccino"] : [],
      rogalikMounting: mounting,
      baseUnitPrice: DEFAULT_ROGALIK_MOUNTING_BASE_PRICES[mounting],
    })
  }
}

checkRogalik("rogalik legacy sznurek", {
  productSlug: ROGALIK_TAG_PRODUCT.slug,
  quantity: 1,
  ringColor: ROGALIK_ORDER_RING_COLOR,
  tagModel: null,
  baseCarabiner: "-",
  extraCharms: [],
  extraCarabiner: [],
  stringPremium: [],
  stringClassic: [],
  stringGlow: [],
  dogNeck: "25 cm",
  stoppers: null,
  sticker: null,
  dialCodeInfo: true,
  rogalikMounting: "sznurek",
  rogalikCordColor: "czarny",
  rogalikBeads: "cappuccino",
  rogalikCharms: ["charm-1"],
  baseUnitPrice: DEFAULT_ROGALIK_MOUNTING_BASE_PRICES.sznurek,
})

if (mismatches.length === 0) {
  console.log(`OK — ${scenarios} scenariuszy: cena zamówienia = suma przychodów (pozycja).`)
} else {
  console.error(`Niespójności (${mismatches.length}/${scenarios}):`)
  for (const m of mismatches) {
    console.error(`  ${m.scenario}: expected=${m.expected} revenue=${m.revenueSum}`)
  }
  process.exit(1)
}
