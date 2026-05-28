import gitaRaw       from '@/data/bhagavad-gita.json'
import ashtavakraRaw from '@/data/ashtavakra-gita.json'
import yogaSutrasRaw from '@/data/yoga-sutras.json'
import ramRaw        from '@/data/ramcharitmanas.json'
import upanishadsRaw from '@/data/upanishads.json'
import wisdomRaw     from '@/data/wisdom-others.json'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScriptureKey =
  | 'bhagavad-gita'
  | 'ashtavakra-gita'
  | 'yoga-sutras'
  | 'ramcharitmanas'
  | 'upanishads'
  | 'wisdom-others'

export const SCRIPTURE_KEYS: ScriptureKey[] = [
  'bhagavad-gita', 'ashtavakra-gita', 'yoga-sutras',
  'ramcharitmanas', 'upanishads', 'wisdom-others',
]

export interface UniversalVerse {
  id:                     string
  scriptureKey:           ScriptureKey
  chapter:                number       // numeric — DB storage key
  verse:                  number       // numeric — DB storage key
  groupKey:               string       // e.g. "2", "Balkanda", "Brihadaranyaka Upanishad"
  groupLabel:             string       // display label
  verseLabel:             string       // e.g. "2.14", "Sutra 1.2", "1.3.28"
  sanskrit:               string
  transliteration?:       string
  hindi_meaning:          string
  english_meaning:        string
  context?:               string
  practical_application?: string
  lesson?:                string
  related_theme?:         string[]
  difficulty?:            'beginner' | 'intermediate' | 'advanced'
  speaker?:               string
  type?:                  string
  author?:                string
}

export interface ScriptureMeta {
  key:         ScriptureKey
  title:       string
  titleHi:     string
  description: string
  icon:        string
  accentClass: string
  totalVerses: number
  translator:  string
  groups:      { key: string; label: string; chapterNum: number }[]
}

// ─── Static metadata (no verse data) ─────────────────────────────────────────

export const SCRIPTURE_META: Record<ScriptureKey, Omit<ScriptureMeta, 'totalVerses' | 'groups'>> = {
  'bhagavad-gita': {
    key: 'bhagavad-gita',
    title: 'Bhagavad Gita',
    titleHi: 'भगवद्गीता',
    description: 'Divine dialogue between Krishna & Arjuna on dharma, yoga, and liberation.',
    icon: '🪷',
    accentClass: 'border-sacred-saffron/40',
    translator: 'Swami Chinmayananda',
  },
  'ashtavakra-gita': {
    key: 'ashtavakra-gita',
    title: 'Ashtavakra Gita',
    titleHi: 'अष्टावक्र गीता',
    description: 'Radical non-dual dialogue between sage Ashtavakra and King Janaka on the Self.',
    icon: '🔱',
    accentClass: 'border-indigo-deep/40',
    translator: 'Swami Nityaswarupananda',
  },
  'yoga-sutras': {
    key: 'yoga-sutras',
    title: 'Yoga Sutras',
    titleHi: 'योगसूत्र',
    description: 'Patanjali\'s 196 sutras — the foundational science of mind and eight-limbed yoga.',
    icon: '🧘',
    accentClass: 'border-sky-blue/40',
    translator: 'Patanjali',
  },
  'ramcharitmanas': {
    key: 'ramcharitmanas',
    title: 'Ramcharitmanas',
    titleHi: 'रामचरितमानस',
    description: 'Tulsidas\'s Awadhi Ramayana — the most recited devotional scripture of North India.',
    icon: '🏹',
    accentClass: 'border-rose-red/40',
    translator: 'Tulsidas (Gita Press)',
  },
  'upanishads': {
    key: 'upanishads',
    title: 'Upanishads',
    titleHi: 'उपनिषद्',
    description: 'The philosophical crown of the Vedas — direct inquiry into Atman and Brahman.',
    icon: '🕉️',
    accentClass: 'border-sacred-saffron/40',
    translator: 'Various (Advaita Ashrama)',
  },
  'wisdom-others': {
    key: 'wisdom-others',
    title: 'Sacred Wisdom',
    titleHi: 'अन्य ग्रंथ',
    description: 'Vivekachudamani, Narada Bhakti Sutras, Chanakya Neeti, Vidur Neeti.',
    icon: '📿',
    accentClass: 'border-twilight/40',
    translator: 'Various Acharyas',
  },
}

// ─── Normalizers ─────────────────────────────────────────────────────────────

function normalizeGita(): UniversalVerse[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (gitaRaw.verses as any[]).map((v) => ({
    id:                    v.id,
    scriptureKey:          'bhagavad-gita' as ScriptureKey,
    chapter:               v.chapter,
    verse:                 v.verse,
    groupKey:              String(v.chapter),
    groupLabel:            `Chapter ${v.chapter}`,
    verseLabel:            `${v.chapter}.${v.verse}`,
    sanskrit:              v.sanskrit,
    transliteration:       v.transliteration,
    hindi_meaning:         v.hindi_meaning,
    english_meaning:       v.english_meaning,
    context:               v.context,
    practical_application: v.practical_application,
    related_theme:         v.related_theme,
    difficulty:            v.difficulty,
  }))
}

function normalizeAshtavakra(): UniversalVerse[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (ashtavakraRaw as any[]).map((v) => ({
    id:                    v.id,
    scriptureKey:          'ashtavakra-gita' as ScriptureKey,
    chapter:               v.chapter,
    verse:                 v.verse,
    groupKey:              String(v.chapter),
    groupLabel:            `Chapter ${v.chapter}`,
    verseLabel:            `${v.chapter}.${v.verse}`,
    sanskrit:              v.sanskrit,
    transliteration:       v.transliteration,
    hindi_meaning:         v.hindi_meaning,
    english_meaning:       v.english_meaning,
    context:               v.context,
    practical_application: v.practical_application,
    related_theme:         v.related_theme,
    difficulty:            v.difficulty,
    speaker:               v.speaker,
  }))
}

const YS_BOOK_NAMES: Record<number, string> = {
  1: 'Samadhi Pada',
  2: 'Sadhana Pada',
  3: 'Vibhuti Pada',
  4: 'Kaivalya Pada',
}

function normalizeYogaSutras(): UniversalVerse[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (yogaSutrasRaw as any[]).map((v) => ({
    id:                    v.id,
    scriptureKey:          'yoga-sutras' as ScriptureKey,
    chapter:               v.book,
    verse:                 v.sutra,
    groupKey:              String(v.book),
    groupLabel:            YS_BOOK_NAMES[v.book] ?? `Book ${v.book}`,
    verseLabel:            `${v.book}.${v.sutra}`,
    sanskrit:              v.sanskrit,
    transliteration:       v.transliteration,
    hindi_meaning:         v.hindi_meaning,
    english_meaning:       v.english_meaning,
    context:               v.context,
    practical_application: v.practical_application,
    related_theme:         v.related_theme,
    difficulty:            v.difficulty,
  }))
}

const KANDA_ORDER = ['Balkanda', 'Ayodhyakanda', 'Aranya', 'Kishkindha', 'Sundara', 'Lanka', 'Uttara']

function normalizeRamcharitmanas(): UniversalVerse[] {
  const kandasSeen: string[] = []
  const kandaCounters: Record<string, number> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (ramRaw as any[]).map((v) => {
    const kanda: string = v.kanda
    if (!kandasSeen.includes(kanda)) kandasSeen.push(kanda)
    kandaCounters[kanda] = (kandaCounters[kanda] ?? 0) + 1
    const verseIdx  = kandaCounters[kanda]
    const knownIdx  = KANDA_ORDER.indexOf(kanda)
    const chapterNum = knownIdx !== -1 ? knownIdx + 1 : kandasSeen.indexOf(kanda) + 1
    return {
      id:             v.id,
      scriptureKey:   'ramcharitmanas' as ScriptureKey,
      chapter:        chapterNum,
      verse:          verseIdx,
      groupKey:       kanda,
      groupLabel:     kanda,
      verseLabel:     `${v.type ?? 'verse'} ${verseIdx}`,
      sanskrit:       v.awadhi_text,
      hindi_meaning:  v.hindi_meaning,
      english_meaning: v.english_meaning,
      lesson:         v.lesson,
      related_theme:  v.related_theme,
      type:           v.type,
    }
  })
}

function normalizeUpanishads(): UniversalVerse[] {
  const upanishadsSeen: string[] = []
  const upanishadCounters: Record<string, number> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (upanishadsRaw as any[]).map((v) => {
    const up: string = v.upanishad
    if (!upanishadsSeen.includes(up)) upanishadsSeen.push(up)
    upanishadCounters[up] = (upanishadCounters[up] ?? 0) + 1
    const verseIdx   = upanishadCounters[up]
    const chapterNum = upanishadsSeen.indexOf(up) + 1
    return {
      id:                    v.id,
      scriptureKey:          'upanishads' as ScriptureKey,
      chapter:               chapterNum,
      verse:                 verseIdx,
      groupKey:              up,
      groupLabel:            up,
      verseLabel:            v.adhyaya,
      sanskrit:              v.sanskrit,
      transliteration:       v.transliteration,
      hindi_meaning:         v.hindi_meaning,
      english_meaning:       v.english_meaning,
      context:               v.context,
      practical_application: v.practical_application,
      related_theme:         v.related_theme,
      difficulty:            v.difficulty,
    }
  })
}

function normalizeWisdom(): UniversalVerse[] {
  const sourcesSeen: string[] = []
  const sourceCounters: Record<string, number> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (wisdomRaw as any[]).map((v) => {
    const src: string = v.source
    if (!sourcesSeen.includes(src)) sourcesSeen.push(src)
    sourceCounters[src] = (sourceCounters[src] ?? 0) + 1
    const verseIdx   = sourceCounters[src]
    const chapterNum = sourcesSeen.indexOf(src) + 1
    return {
      id:             v.id,
      scriptureKey:   'wisdom-others' as ScriptureKey,
      chapter:        chapterNum,
      verse:          verseIdx,
      groupKey:       src,
      groupLabel:     src,
      verseLabel:     `v.${v.verse_ref}`,
      sanskrit:       v.sanskrit,
      transliteration: v.transliteration,
      hindi_meaning:  v.hindi_meaning,
      english_meaning: v.english_meaning,
      context:        v.context,
      lesson:         v.lesson,
      related_theme:  v.related_theme,
      difficulty:     v.difficulty,
      author:         v.author,
    }
  })
}

// ─── Memoized verse store ─────────────────────────────────────────────────────

let _allVerses: UniversalVerse[] | null = null

export function getAllVerses(): UniversalVerse[] {
  if (_allVerses) return _allVerses
  _allVerses = [
    ...normalizeGita(),
    ...normalizeAshtavakra(),
    ...normalizeYogaSutras(),
    ...normalizeRamcharitmanas(),
    ...normalizeUpanishads(),
    ...normalizeWisdom(),
  ]
  return _allVerses
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function isValidScriptureKey(key: string): key is ScriptureKey {
  return SCRIPTURE_KEYS.includes(key as ScriptureKey)
}

export function getScriptureVerses(key: ScriptureKey): UniversalVerse[] {
  return getAllVerses().filter((v) => v.scriptureKey === key)
}

export function getScriptureMeta(key: ScriptureKey): ScriptureMeta {
  const verses = getScriptureVerses(key)
  const groups = [...new Map(
    verses.map((v) => [v.groupKey, { key: v.groupKey, label: v.groupLabel, chapterNum: v.chapter }])
  ).values()].sort((a, b) => a.chapterNum - b.chapterNum)
  return { ...SCRIPTURE_META[key], totalVerses: verses.length, groups }
}

export function getGroupVerses(key: ScriptureKey, groupKey: string): UniversalVerse[] {
  return getScriptureVerses(key).filter((v) => v.groupKey === groupKey)
}

export function findVerse(key: ScriptureKey, chapter: number, verse: number): UniversalVerse | undefined {
  return getScriptureVerses(key).find((v) => v.chapter === chapter && v.verse === verse)
}

export function getDailyShlokas(_userId?: string): UniversalVerse[] {
  const day    = Math.floor(Date.now() / 86_400_000)
  const keyIdx = day % SCRIPTURE_KEYS.length
  const verses = getScriptureVerses(SCRIPTURE_KEYS[keyIdx])
  const verseIdx = Math.floor(day / SCRIPTURE_KEYS.length) % verses.length
  return [verses[verseIdx]]
}

// ─── ShlokCard prop adapter ────────────────────────────────────────────────────

export function getShlokCardProps(v: UniversalVerse) {
  let source:  string
  let chapter: string | number | undefined
  let verse:   string | number | undefined

  switch (v.scriptureKey) {
    case 'upanishads':
      source  = `${v.groupLabel} ${v.verseLabel}`
      chapter = undefined
      verse   = undefined
      break
    case 'wisdom-others':
      source  = v.groupLabel
      chapter = undefined
      verse   = undefined
      break
    case 'ramcharitmanas':
      source  = SCRIPTURE_META[v.scriptureKey].title
      chapter = v.groupLabel
      verse   = v.verse
      break
    default:
      source  = SCRIPTURE_META[v.scriptureKey].title
      chapter = v.chapter
      verse   = v.verse
  }

  return {
    id:                    v.id,
    source,
    chapter,
    verse,
    sanskrit:              v.sanskrit,
    transliteration:       v.transliteration,
    hindi_meaning:         v.hindi_meaning,
    english_meaning:       v.english_meaning,
    context:               v.context,
    practical_application: v.practical_application ?? v.lesson,
    difficulty:            v.difficulty,
    related_theme:         v.related_theme,
  }
}
