import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SearchBar } from "@/features/search/components/SearchBar"
import { ThemeSwitcher } from "@/features/theme/components/ThemeSwitcher"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"

const SECTIONS = [
  { path: "/bible", key: "nav.bible" },
  { path: "/patristics", key: "nav.patristics" },
  { path: "/apocrypha", key: "nav.apocrypha" },
  { path: "/creeds", key: "nav.creeds" },
  { path: "/glossary", key: "nav.glossary" },
  { path: "/lexicon", key: "nav.lexicon" },
  { path: "/geography", key: "nav.geography" },
] as const

export function NavBar() {
  const { t } = useTranslation("common")

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="font-serif text-lg font-medium text-foreground">
          {t("appName")}
        </Link>

        <nav className="hidden shrink-0 items-center gap-4 md:flex">
          {SECTIONS.map(({ path, key }) => (
            <Link
              key={path}
              to={path}
              className="whitespace-nowrap text-sm text-muted-foreground hover:text-foreground"
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="hidden min-w-[220px] flex-1 md:block">
          <SearchBar />
        </div>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>

        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu />
              </Button>
            }
          />
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>{t("appName")}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-4">
              <SearchBar />
              <nav className="flex flex-col gap-3">
                {SECTIONS.map(({ path, key }) => (
                  <Link key={path} to={path} className="text-sm text-foreground hover:underline">
                    {t(key)}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeSwitcher />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
