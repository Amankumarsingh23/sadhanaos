export const APP_NAME = 'SadhanaOS'
export const APP_DESCRIPTION = 'Your spiritual practice operating system'

export const NAV_ITEMS = [
  { label: 'Gurukulam',          labelHi: 'गुरुकुलम्',        href: '/dashboard',    icon: 'Home',          description: 'Dashboard'             },
  { label: 'Sadhana Log',        labelHi: 'साधना लॉग',        href: '/log',          icon: 'ClipboardList', description: 'Daily Logger'           },
  { label: 'Urge Shield',        labelHi: 'उर्ज शील्ड',       href: '/urge-shield',  icon: 'Shield',        description: 'Urge Journal'           },
  { label: 'Dhyana & Pranayama', labelHi: 'ध्यान',            href: '/dhyana',       icon: 'Wind',          description: 'Meditation & Breathing' },
  { label: 'Granthalaya',        labelHi: 'ग्रन्थालय',        href: '/granthalaya',  icon: 'BookOpen',      description: 'Scripture Library'      },
  { label: 'Prarthana',          labelHi: 'प्रार्थना',         href: '/prarthana',    icon: 'Heart',         description: 'Prayer & Gratitude'     },
  { label: 'Roop Sadhana',       labelHi: 'रूप साधना',        href: '/skincare',     icon: 'Sparkles',      description: 'Skincare Rituals'       },
  { label: 'Chintan',            labelHi: 'चिन्तन',           href: '/chintan',      icon: 'Pen',           description: 'Reflections & Journal'  },
  { label: 'Darpan',             labelHi: 'दर्पण',            href: '/analytics',    icon: 'BarChart3',     description: 'Analytics'              },
  { label: 'Rishi Margdarshan',  labelHi: 'ऋषि मार्गदर्शन',  href: '/rishi',        icon: 'Bot',           description: 'AI Guide'               },
  { label: 'Lakshya',            labelHi: 'लक्ष्य',           href: '/goals',        icon: 'Target',        description: 'Goals & Milestones'     },
  { label: 'Vidhi',              labelHi: 'विधि',             href: '/settings',     icon: 'Settings',      description: 'Settings'               },
] as const

export type NavItem = (typeof NAV_ITEMS)[number]

export const BOTTOM_TAB_ITEMS = [
  { label: 'Home',    labelHi: 'घर',        href: '/dashboard',   icon: 'Home'          },
  { label: 'Log',     labelHi: 'लॉग',       href: '/log',          icon: 'ClipboardList' },
  { label: 'Shield',  labelHi: 'शील्ड',     href: '/urge-shield',  icon: 'Shield'        },
  { label: 'Dhyana',  labelHi: 'ध्यान',     href: '/dhyana',       icon: 'Wind'          },
  { label: 'Rishi',   labelHi: 'ऋषि',       href: '/rishi',        icon: 'Bot'           },
] as const

export const PAGE_TITLES: Record<string, { title: string; titleHi: string; subtitle: string }> = {
  '/dashboard':   { title: 'Gurukulam',          titleHi: 'गुरुकुलम्',        subtitle: 'Your practice at a glance'      },
  '/log':         { title: 'Sadhana Log',         titleHi: 'साधना लॉग',        subtitle: "Record today's practice"        },
  '/urge-shield': { title: 'Urge Shield',          titleHi: 'उर्ज शील्ड',       subtitle: 'Observe without acting'         },
  '/dhyana':      { title: 'Dhyana & Pranayama',   titleHi: 'ध्यान',            subtitle: 'Meditation & breathing practice' },
  '/granthalaya': { title: 'Granthalaya',           titleHi: 'ग्रन्थालय',        subtitle: 'Sacred scripture library'       },
  '/prarthana':   { title: 'Prarthana',             titleHi: 'प्रार्थना',         subtitle: 'Prayer & gratitude practice'    },
  '/skincare':    { title: 'Roop Sadhana',          titleHi: 'रूप साधना',        subtitle: 'Body as temple'                 },
  '/chintan':     { title: 'Chintan',               titleHi: 'चिन्तन',           subtitle: 'Reflections & journaling'       },
  '/analytics':   { title: 'Darpan',                titleHi: 'दर्पण',            subtitle: 'Analytics & progress'           },
  '/rishi':       { title: 'Rishi Margdarshan',     titleHi: 'ऋषि मार्गदर्शन',  subtitle: 'AI-powered spiritual guidance'  },
  '/goals':       { title: 'Lakshya',               titleHi: 'लक्ष्य',           subtitle: 'Goals & milestones'             },
  '/settings':    { title: 'Vidhi',                 titleHi: 'विधि',             subtitle: 'Settings & preferences'         },
}

/* Legacy — kept for backwards compat */
export const PRAKASH_COLORS = {
  saffron:     '#E8913A',
  gold:        '#D4A847',
  deepRed:     '#8B0000',
  ivory:       '#FFF9F0',
  forestGreen: '#7A9E7A',
} as const
