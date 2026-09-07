const LANDLINE_ONLY_PREFIXES = new Set([
  "10", "11", "12", "13", "14", "15", "16", "17", "18",
  "22", "23", "24", "25", "29",
  "32", "33", "34",
  "41", "42", "43", "44", "46", "47", "48",
  "61", "62", "63", "65", "68",
  "71", "74",
  "91", "94", "95",
])

const POLISH_MOBILE_PREFIX =
  /^(45[0-9]|50[0-9]|51[0-9]|53[0-9]|57[0-9]|60[0-9]|66[0-9]|69[0-9]|72[0-9]|73[0-9]|78[0-9]|79[0-9]|83[0-9]|88[0-9]|52[0-9]|54[0-9]|56[0-9]|58[0-9]|59[0-9]|67[0-9]|75[0-9]|76[0-9]|77[0-9]|80[0-9]|81[0-9]|82[0-9]|84[0-9]|85[0-9]|86[0-9]|87[0-9]|89[0-9])\d{6}$/

export const normalizePolishPhone = (value: string) => {
  let digits = value.replace(/\D/g, "")
  if (digits.startsWith("00")) digits = digits.slice(2)
  if (digits.startsWith("48") && digits.length >= 11) digits = digits.slice(-9)
  if (digits.startsWith("0") && digits.length === 10) digits = digits.slice(1)
  return digits
}

export const formatPolishMobile = (value: string) => {
  const digits = normalizePolishPhone(value)
  if (digits.length !== 9) return value.trim()
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
}

export const isPolishMobilePhone = (value: string) => {
  const phone = normalizePolishPhone(value)
  if (!/^\d{9}$/.test(phone)) return false
  if (LANDLINE_ONLY_PREFIXES.has(phone.slice(0, 2))) return false
  return POLISH_MOBILE_PREFIX.test(phone)
}

/** 9-cyfrowy numer komórkowy bez prefiksu +48 — format wymagany przez Furgonetkę/InPost. */
export const toFurgonetkaPhone = (value: string) => normalizePolishPhone(value)

export const formatClientPhoneStorage = (value: string) => {
  const digits = normalizePolishPhone(value)
  if (!/^\d{9}$/.test(digits)) return value.trim()
  return `+48 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
}
