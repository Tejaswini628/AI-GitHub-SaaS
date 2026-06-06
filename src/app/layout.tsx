import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/frontend/components/Providers'
import { ErrorBoundary } from '@/frontend/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'AI GitHub Developer',
  description: 'Your AI junior developer that understands code and ships features',
  icons: { icon: '/favicon.svg' },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ErrorBoundary>{children}</ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
