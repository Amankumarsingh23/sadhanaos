'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { WeeklyReportPDF, type WeeklyReportPDFProps } from './WeeklyReportPDF'
import { getTheme } from './themes'
import { Download } from 'lucide-react'

export default function PDFDownloadButton(props: WeeklyReportPDFProps) {
  const theme   = getTheme(props.profile.deity)
  const filename = `sadhana-week-${props.weekNumber}-${props.profile.name?.replace(/\s+/g, '-') ?? 'report'}.pdf`

  return (
    <PDFDownloadLink
      document={<WeeklyReportPDF {...props} />}
      fileName={filename}
    >
      {({ loading, error }) => (
        <button
          disabled={loading || !!error}
          style={{
            background: `linear-gradient(135deg, ${theme.dark} 0%, ${theme.primary} 100%)`,
            border: `1.5px solid ${theme.gold}`,
            borderRadius: 8,
            color: theme.gold,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontFamily: 'inherit',
            fontSize: 13,
            letterSpacing: 1.5,
            transition: 'all 0.2s',
          }}
        >
          <Download size={14} />
          {loading ? 'Preparing Sacred Letter…' : error ? 'Error — try again' : 'Download Sacred Report'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
