/**
 * DAWN ASHRAM — SadhanaOS Design Tokens
 *
 * Tailwind v4 note: CSS `@theme` in globals.css is the canonical config for
 * Tailwind utilities. This file exports the same tokens as JS constants for
 * use in dynamic contexts: Recharts, Framer Motion inline styles, canvas, etc.
 */

export const colors = {
  /* Backgrounds */
  dawnWhite:      '#FFF9F0',
  parchment:      '#F5EDE0',
  sandstone:      '#E8D5BE',

  /* Saffron — primary accent */
  sacredSaffron:  '#E8913A',
  saffronLight:   '#F2B366',
  saffronDeep:    '#C47420',

  /* Secondary accents */
  lotusPink:      '#D4838A',
  templeGold:     '#D4A847',

  /* Indigo — text & depth */
  indigoDeep:     '#2B2D5B',
  indigoMid:      '#4A4C7A',
  twilight:       '#6B6D9E',

  /* Semantic */
  sageGreen:      '#7A9E7A',
  skyBlue:        '#7AAEC4',
  warmClay:       '#C47C5A',
  roseRed:        '#B85454',
} as const

export type ColorKey = keyof typeof colors

export const fonts = {
  display:    '"Cormorant Garamond", Georgia, serif',
  body:       '"Source Serif 4", Georgia, serif',
  devanagari: '"Noto Serif Devanagari", serif',
} as const

export const shadows = {
  warmSm:       '0 1px 3px rgba(196,116,32,0.10), 0 1px 2px rgba(196,116,32,0.06)',
  warmMd:       '0 4px 6px rgba(196,116,32,0.10), 0 2px 4px rgba(196,116,32,0.06)',
  warmLg:       '0 10px 15px rgba(196,116,32,0.10), 0 4px 6px rgba(196,116,32,0.06)',
  saffronGlow:  '0 0 20px rgba(232,145,58,0.40), 0 0 40px rgba(232,145,58,0.20)',
  goldGlow:     '0 0 20px rgba(212,168,71,0.40), 0 0 40px rgba(212,168,71,0.20)',
} as const
