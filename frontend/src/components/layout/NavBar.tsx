import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Menu, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SearchBar } from "@/features/search/components/SearchBar"
import { ThemeSwitcher } from "@/features/theme/components/ThemeSwitcher"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"
import { BookmarksPanel } from "@/components/layout/BookmarksPanel"
import { ThemeMark } from "@/components/layout/ThemeMark"
import { ModeToggle } from "@/features/theme/components/ModeToggle"
import { useThemeStore } from "@/features/theme/store/useThemeStore"

const NAV_LINKS = [
  { path: "/bible", key: "nav.bible" },
  { path: "/patristics", key: "nav.patristics" },
  { path: "/apocrypha", key: "nav.apocrypha" },
  { path: "/creeds", key: "nav.creeds" },
  { path: "/councils", key: "nav.councils" },
  { path: "/glossary", key: "nav.glossary" },
  { path: "/lexicon", key: "nav.lexicon" },
  { path: "/geography", key: "nav.geography" },
  { path: "/timeline", key: "nav.timeline" },
  { path: "/apologetics", key: "nav.apologetics" },
] as const

// 12 collapsible items: 10 nav links + language + theme
// Priority: index 0 (Bible) = highest (last to hide), index 11 (Theme) = lowest (first to hide)
const TOTAL_COLLAPSIBLE = 12

export function NavBar() {
  const { t } = useTranslation(["common", "bible"])
  const theme = useThemeStore((s) => s.theme)
  const [visibleCount, setVisibleCount] = useState(TOTAL_COLLAPSIBLE)

  const containerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLElement | null)[]>(Array(TOTAL_COLLAPSIBLE).fill(null))
  const measuredWidths = useRef<number[]>([])

  const compute = useCallback(() => {
    if (!containerRef.current || !logoRef.current || !rightRef.current) return
    if (!measuredWidths.current.length) return

    const GAP = 16     // gap-4
    const PADDING = 32 // px-4 each side
    const HAMBURGER = 40

    // Space available for collapsible items (hamburger always reserves space)
    const available =
      containerRef.current.offsetWidth
      - PADDING
      - logoRef.current.offsetWidth
      - rightRef.current.offsetWidth
      - HAMBURGER
      - GAP * 3

    let used = 0
    let count = 0
    for (let i = 0; i < measuredWidths.current.length; i++) {
      const w = measuredWidths.current[i] + GAP
      if (used + w <= available) {
        used += w
        count = i + 1
      } else break
    }
    setVisibleCount(count)
  }, [])

  // Measure item widths on first paint (all items visible at that point)
  useEffect(() => {
    requestAnimationFrame(() => {
      measuredWidths.current = itemRefs.current.map((el) => el?.offsetWidth ?? 0)
      compute()
    })
  }, [compute])

  // Re-compute whenever the container resizes
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [compute])

  const showHamburger = visibleCount < TOTAL_COLLAPSIBLE
  const hiddenLinks = NAV_LINKS.slice(visibleCount)
  const languageHidden = visibleCount < 11
  const themeHidden = visibleCount < 12

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/85">
      {/* Faixa de identidade denominacional */}
      <div className="h-[3px]" style={{ background: "var(--theme-strip)" }} aria-hidden="true" />
      <div ref={containerRef} className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">

        {/* Logo — always visible */}
        <div ref={logoRef} className="shrink-0">
          <Link to="/" className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
            <ThemeMark theme={theme} className="text-primary" />
            {t("appName")}
          </Link>
        </div>

        {/* Collapsible items — overflow hidden prevents layout bleed */}
        <nav className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden">
          {NAV_LINKS.map(({ path, key }, i) => (
            <Link
              key={path}
              to={path}
              ref={(el) => { itemRefs.current[i] = el }}
              className={`shrink-0 whitespace-nowrap text-sm text-muted-foreground hover:text-foreground${i >= visibleCount ? " hidden" : ""}`}
            >
              {t(key)}
            </Link>
          ))}
          <div
            ref={(el) => { itemRefs.current[10] = el }}
            className={languageHidden ? "hidden" : "shrink-0"}
          >
            <LanguageSwitcher />
          </div>
          <div
            ref={(el) => { itemRefs.current[11] = el }}
            className={themeHidden ? "hidden" : "shrink-0"}
          >
            <ThemeSwitcher />
          </div>
        </nav>

        {/* Fixed right: search + favorites + bookmarks — always visible */}
        <div ref={rightRef} className="flex shrink-0 items-center gap-2">
          <div className="w-60">
            <SearchBar />
          </div>
          <Link to="/favorites" aria-label={t("bible:favorites.title")}>
            <Button variant="ghost" size="icon">
              <Star className="size-4" />
            </Button>
          </Link>
          <BookmarksPanel />
          <ModeToggle />
        </div>

        {/* Overflow hamburger — invisible (not hidden) when unneeded so layout stays stable */}
        <div className={showHamburger ? "shrink-0" : "invisible shrink-0"}>
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon">
                  <Menu />
                </Button>
              }
            />
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{t("appName")}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4">
                {hiddenLinks.length > 0 && (
                  <nav className="flex flex-col gap-3">
                    {hiddenLinks.map(({ path, key }) => (
                      <Link key={path} to={path} className="text-sm text-foreground hover:underline">
                        {t(key)}
                      </Link>
                    ))}
                  </nav>
                )}
                {(languageHidden || themeHidden) && (
                  <div className="flex items-center gap-2">
                    {languageHidden && <LanguageSwitcher />}
                    {themeHidden && <ThemeSwitcher />}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  )
}
