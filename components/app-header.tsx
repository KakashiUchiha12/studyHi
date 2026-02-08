"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { StudyHiLogoCompact } from "@/components/ui/studyhi-logo"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export function AppHeader() {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Define routes where the global header should be hidden
  const isSocialRoute = pathname?.startsWith("/feed") ||
    pathname?.startsWith("/community") ||
    pathname?.startsWith("/messages") ||
    pathname?.startsWith("/profile")

  // Only show header if user is logged in and not on a social route
  if (!session || isSocialRoute) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <StudyHiLogoCompact />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              <span className="sr-only">Dashboard</span>
            </Link>
          </Button>
          <NotificationCenter />
        </div>
      </div>
    </header>
  )
}
