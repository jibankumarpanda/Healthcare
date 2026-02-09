"use client"

import React, { ReactNode } from "react"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import AppNavbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/next"

interface ClientLayoutProps {
  children: ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AppNavbar />
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        <Footer />
        <Toaster />
        <Analytics />
      </ThemeProvider>
    </AuthProvider>
  )
}
