import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthSessionProvider } from "@/components/providers/session-provider"
import { SocketProvider } from "@/components/providers/socket-provider"
import { ReactQueryProvider } from "@/components/providers/react-query-provider"
import { AppHeader } from "@/components/app-header"
import { Toaster } from "react-hot-toast"
import { Analytics } from "@vercel/analytics/next"
import ErrorBoundary from "@/components/error-boundary"



export const metadata: Metadata = {
  title: "StudyHi - Welcome to Learning",
  description:
    "Your ultimate study companion. Welcome to Learning - track subjects, syllabus, test marks, and study sessions with our comprehensive study planner.",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PDF.js will be loaded dynamically when needed */}
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ErrorBoundary>
          <AuthSessionProvider>
            <ReactQueryProvider>
              <SocketProvider>
                <ThemeProvider defaultTheme="light">
                  <AppHeader />
                  {children}
                  <Toaster position="top-right" />
                  <Analytics />
                </ThemeProvider>
              </SocketProvider>
            </ReactQueryProvider>
          </AuthSessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
