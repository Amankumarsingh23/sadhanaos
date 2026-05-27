import { type Scripture } from '@/lib/scriptures'
import { Card, CardContent } from '@/components/ui/Card'

interface ShlokCardProps {
  scripture: Scripture
}

export function ShlokCard({ scripture }: ShlokCardProps) {
  return (
    <Card className="border-orange-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardContent className="pt-6">
        {scripture.sanskrit && (
          <p className="font-serif text-amber-900 text-base leading-relaxed mb-3">
            {scripture.sanskrit}
          </p>
        )}
        {scripture.transliteration && (
          <p className="text-sm text-amber-600 italic mb-3">{scripture.transliteration}</p>
        )}
        <p className="text-sm text-gray-700 leading-relaxed">{scripture.english}</p>
        <p className="mt-3 text-xs text-orange-500 font-medium">
          — {scripture.source}
          {scripture.chapter && `, ${scripture.chapter}.${scripture.verse}`}
        </p>
      </CardContent>
    </Card>
  )
}
