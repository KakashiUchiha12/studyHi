import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthSessionProvider } from "@/components/providers/session-provider"
import { Toaster } from "react-hot-toast"
import Script from "next/script"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

export const metadata: Metadata = {
  title: "StudyPlanner - Organize Your Academic Success",
  description:
    "A comprehensive study planner app for students to track subjects, syllabus, test marks, and study sessions.",
  generator: "v0.app",
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={dmSans.variable} suppressHydrationWarning>
      <head>
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
          strategy="beforeInteractive"
        />
        <Script id="pdfjs-config" strategy="afterInteractive">
          {`
            // Make PDF.js available globally
            window.pdfjsLib = window.pdfjsLib || {};
            window.pdfjsLib.GlobalWorkerOptions = window.pdfjsLib.GlobalWorkerOptions || {};
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
          `}
        </Script>
      </head>
      <body className="font-sans antialiased">
        <AuthSessionProvider>
          <ThemeProvider defaultTheme="system">
            {children}
            <Toaster position="top-right" />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
