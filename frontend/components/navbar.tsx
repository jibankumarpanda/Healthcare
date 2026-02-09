"use client"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AppNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, logout } = useAuth()

  const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up"

  if (isAuthPage) {
    return null
  }

  const navItems = [
    { name: "Home", link: "/" },
    { name: "Dashboard", link: "/dashboard" },
    { name: "Upload PDF", link: "/upload" },
    { name: "Predictions", link: "/predictions" },
    { name: "Resources", link: "/resources" },
  ]

  const handleLogout = () => {
    logout()
    router.push("/sign-in")
  }

  return (
    <Navbar>
      <NavBody>
        <NavbarLogo />
        <NavItems items={navItems} pathname={pathname} />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {!isAuthenticated ? (
            <NavbarButton 
              href="/sign-in" 
              className="relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <span className="relative z-10">Sign In</span>
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
            </NavbarButton>
          ) : (
            <NavbarButton 
              onClick={handleLogout}
              className="relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <span className="relative z-10">Logout</span>
            </NavbarButton>
          )}
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <MobileNavToggle isOpen={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        </MobileNavHeader>

        <MobileNavMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
          {navItems.map((item, idx) => (
            <a
              key={`mobile-link-${idx}`}
              href={item.link}
              onClick={() => setIsMobileMenuOpen(false)}
              className="relative text-neutral-600 dark:text-neutral-300"
            >
              <span className="block">{item.name}</span>
            </a>
          ))}
          <div className="flex w-full flex-col gap-4">
            {!isAuthenticated ? (
              <>
                <NavbarButton href="/sign-in" variant="secondary" className="w-full">
                  Sign In
                </NavbarButton>
                <NavbarButton href="/sign-up" variant="primary" className="w-full">
                  Sign Up
                </NavbarButton>
              </>
            ) : (
              <NavbarButton 
                onClick={handleLogout}
                variant="destructive" 
                className="w-full"
              >
                Logout
              </NavbarButton>
            )}
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  )
}
