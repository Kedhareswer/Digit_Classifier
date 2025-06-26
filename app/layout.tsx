import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Digit Classifier Deep Learning',
  description: 'A sophisticated deep learning-powered web application for real-time handwritten digit recognition',
  keywords: ['machine learning', 'deep learning', 'digit recognition', 'neural network', 'tensorflow'],
  authors: [{ name: 'Digit Classifier Team' }],
  creator: 'Digit Classifier Team',
  publisher: 'Digit Classifier Team',
  openGraph: {
    title: 'Digit Classifier Deep Learning',
    description: 'Real-time handwritten digit recognition using deep learning',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digit Classifier Deep Learning',
    description: 'Real-time handwritten digit recognition using deep learning',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <main className="min-h-screen bg-black">
          {children}
        </main>
      </body>
    </html>
  )
} 