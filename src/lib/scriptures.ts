import shlokas from '@/data/shlokas.json'
import dohas from '@/data/dohas.json'
import sutras from '@/data/sutras.json'

export type Scripture = {
  id: string
  source: string
  chapter?: string
  verse?: string
  sanskrit?: string
  transliteration?: string
  hindi?: string
  english: string
  tags?: string[]
}

export function getDailyScripture(): Scripture {
  const all = [...shlokas, ...dohas, ...sutras]
  const dayIndex = new Date().getDate() % all.length
  return all[dayIndex]
}

export { shlokas, dohas, sutras }
