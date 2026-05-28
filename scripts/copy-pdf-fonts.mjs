import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = resolve(__dirname, '..')
const DEST      = resolve(ROOT, 'public/fonts')

if (!existsSync(DEST)) mkdirSync(DEST, { recursive: true })

const FONTS = [
  ['@fontsource/cinzel/files/cinzel-latin-400-normal.woff',                                    'cinzel-400.woff'],
  ['@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff',            'cormorant-400.woff'],
  ['@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff',            'cormorant-400i.woff'],
  ['@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff',            'cormorant-600.woff'],
  ['@fontsource/cormorant-garamond/files/cormorant-garamond-latin-700-normal.woff',            'cormorant-700.woff'],
  ['@fontsource/noto-serif-devanagari/files/noto-serif-devanagari-devanagari-400-normal.woff', 'devanagari-400.woff'],
  ['@fontsource/noto-serif-devanagari/files/noto-serif-devanagari-devanagari-600-normal.woff', 'devanagari-600.woff'],
]

let ok = 0
for (const [pkg, dest] of FONTS) {
  const src = resolve(ROOT, 'node_modules', pkg)
  if (existsSync(src)) {
    copyFileSync(src, resolve(DEST, dest))
    console.log(`✓ ${dest}`)
    ok++
  } else {
    console.warn(`✗ Missing: ${pkg}`)
  }
}
console.log(`\nCopied ${ok}/${FONTS.length} PDF fonts to public/fonts/`)
