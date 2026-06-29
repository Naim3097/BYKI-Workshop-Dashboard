// Front-of-site contact constants (storefront placeholders — edit before going live).
export const WA = '60123456789'
export const PHONE_DISPLAY = '+60 12-345 6789'

export function waLink(text: string): string {
  return `https://wa.me/${WA}?text=${encodeURIComponent(text)}`
}
