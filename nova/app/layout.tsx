import type { Metadata } from 'next'
import { Outfit, Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import AiChat from '@/components/ai-chat'
import { AuthProvider } from '@/lib/auth-context'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Smart Spend - Banking Solutions',
  description: 'Manage your finances with Smart Spend'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
          <AiChat />
        </AuthProvider>
      </body>
    </html>
  )
}
