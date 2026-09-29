import type { Metadata, Viewport } from 'next'
import { Orbitron, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'], variable: '--font-orbitron' })
const grotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-grotesk' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Tiffany — Software Engineer',
  description:
    'Tiffany is a senior software engineer with 6+ years building products: frontend architecture, design systems, scientific data visualization, mobile and full-stack.',
  openGraph: {
    title: 'Tiffany — Software Engineer',
    description: 'Frontend architecture, design systems, data viz at 250k points, and electric motorcycles.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#05010d',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-motion="on" suppressHydrationWarning className={`${orbitron.variable} ${grotesk.variable} ${mono.variable}`}>
      <head>
        {/* Skip the boot overlay before paint for returning visitors / reduced motion */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var m=localStorage.getItem('tiffxt:motion');var r=matchMedia('(prefers-reduced-motion: reduce)').matches;if(sessionStorage.getItem('tiffxt:booted')==='1'||m==='off'||(!m&&r))document.documentElement.classList.add('booted')}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  )
}
