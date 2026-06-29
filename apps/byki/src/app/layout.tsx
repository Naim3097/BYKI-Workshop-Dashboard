import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const satoshi = localFont({
  src: [
    { path: './fonts/Satoshi-Light.otf', weight: '300', style: 'normal' },
    { path: './fonts/Satoshi-Regular.otf', weight: '400', style: 'normal' },
    { path: './fonts/Satoshi-Medium.otf', weight: '500', style: 'normal' },
    { path: './fonts/Satoshi-Bold.otf', weight: '700', style: 'normal' },
    { path: './fonts/Satoshi-Black.otf', weight: '900', style: 'normal' },
  ],
  variable: '--font-satoshi',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BYKI Admin',
  description: 'BYKI master-admin dashboard',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={satoshi.variable}>
      <body>{children}</body>
    </html>
  )
}
