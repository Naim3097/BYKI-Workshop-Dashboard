import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MNA Dynamic Torque',
  description:
    'Vehicle spare parts commerce, bulk supply, and workshop service booking.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Same type system as the storefront (assets/shop.css) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Saira:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
