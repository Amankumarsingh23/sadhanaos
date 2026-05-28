export interface DeityTheme {
  dark:      string
  primary:   string
  gold:      string
  goldLight: string
  goldDark:  string
  bg:        string
  mantra:    string
  deityHi:   string
  blessing:  string
}

export const DEITY_THEMES: Record<string, DeityTheme> = {
  krishna: {
    dark:      '#0D1440',
    primary:   '#1B2A6B',
    gold:      '#D4AF37',
    goldLight: '#F0D060',
    goldDark:  '#8B7300',
    bg:        '#FDFAF3',
    mantra:    'ॐ नमो भगवते वासुदेवाय',
    deityHi:   'श्री कृष्ण',
    blessing:  'राधे राधे · जय श्री कृष्ण',
  },
  ram: {
    dark:      '#3A0A0A',
    primary:   '#7B1A1A',
    gold:      '#D4AF37',
    goldLight: '#F0D060',
    goldDark:  '#8B7300',
    bg:        '#FDF8F0',
    mantra:    'ॐ श्री रामाय नमः',
    deityHi:   'श्री राम',
    blessing:  'जय श्री राम · राम राम',
  },
  shiva: {
    dark:      '#080818',
    primary:   '#1A1A40',
    gold:      '#B8A880',
    goldLight: '#D8C8A0',
    goldDark:  '#706050',
    bg:        '#F5F5F8',
    mantra:    'ॐ नमः शिवाय',
    deityHi:   'श्री शिव',
    blessing:  'हर हर महादेव',
  },
  durga: {
    dark:      '#3A0000',
    primary:   '#8B0000',
    gold:      '#D4AF37',
    goldLight: '#F0D060',
    goldDark:  '#8B7300',
    bg:        '#FDF5F5',
    mantra:    'ॐ दुं दुर्गायै नमः',
    deityHi:   'श्री दुर्गा',
    blessing:  'जय माता दी',
  },
  hanuman: {
    dark:      '#3A1200',
    primary:   '#B5451B',
    gold:      '#D4AF37',
    goldLight: '#F0D060',
    goldDark:  '#8B7300',
    bg:        '#FDF8F0',
    mantra:    'ॐ हनुमते नमः',
    deityHi:   'श्री हनुमान',
    blessing:  'जय बजरंगबली',
  },
  ganesh: {
    dark:      '#2A0A00',
    primary:   '#8B3500',
    gold:      '#D4AF37',
    goldLight: '#F0D060',
    goldDark:  '#8B7300',
    bg:        '#FDF9F0',
    mantra:    'ॐ गं गणपतये नमः',
    deityHi:   'श्री गणेश',
    blessing:  'गणपति बाप्पा मोरया',
  },
  saraswati: {
    dark:      '#0A1A40',
    primary:   '#1A3A7B',
    gold:      '#D4AF37',
    goldLight: '#F0D060',
    goldDark:  '#8B7300',
    bg:        '#F5F8FF',
    mantra:    'ॐ ऐं सरस्वत्यै नमः',
    deityHi:   'श्री सरस्वती',
    blessing:  'जय माँ सरस्वती',
  },
  vishnu: {
    dark:      '#0A0020',
    primary:   '#2A0A5A',
    gold:      '#D4AF37',
    goldLight: '#F0D060',
    goldDark:  '#8B7300',
    bg:        '#F8F5FF',
    mantra:    'ॐ नमो नारायणाय',
    deityHi:   'श्री विष्णु',
    blessing:  'ॐ नमो नारायणाय',
  },
  default: {
    dark:      '#1A0F3A',
    primary:   '#3D2C8D',
    gold:      '#D4AF37',
    goldLight: '#F0D060',
    goldDark:  '#8B7300',
    bg:        '#FDF9F0',
    mantra:    'ॐ तत् सत्',
    deityHi:   'परमात्मन्',
    blessing:  'ॐ शान्तिः शान्तिः शान्तिः',
  },
}

export function getTheme(deity: string | null | undefined): DeityTheme {
  if (!deity) return DEITY_THEMES.default
  const key = deity.toLowerCase().replace(/[^a-z]/g, '')
  return DEITY_THEMES[key] ?? DEITY_THEMES.default
}
