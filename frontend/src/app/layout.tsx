import 'reflect-metadata'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Suspense } from 'react'
import LoadingBar from '../components/LoadingBar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'eRankUp - Smart Exam Preparation',
    description: 'AI-Driven Online Examination Platform for Government Exams',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Suspense fallback={null}>
                    <LoadingBar />
                </Suspense>
                {children}
            </body>
        </html>
    )
}
