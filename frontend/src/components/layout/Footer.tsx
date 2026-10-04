import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useThemeStore } from "@/features/theme/store/useThemeStore"
import { ThemeMark } from "@/components/layout/ThemeMark"

const TRADITION_LINKS = [
  { path: "/bible", key: "nav.bible" },
  { path: "/patristics", key: "nav.patristics" },
  { path: "/apocrypha", key: "nav.apocrypha" },
  { path: "/creeds", key: "nav.creeds" },
  { path: "/councils", key: "nav.councils" },
] as const

const STUDY_LINKS = [
  { path: "/glossary", key: "nav.glossary" },
  { path: "/lexicon", key: "nav.lexicon" },
  { path: "/geography", key: "nav.geography" },
  { path: "/timeline", key: "nav.timeline" },
  { path: "/apologetics", key: "nav.apologetics" },
] as const

export function Footer() {
  const { t } = useTranslation("common")
  const theme = useThemeStore((s) => s.theme)

  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
            <ThemeMark theme={theme} className="text-primary" />
            {t("appName")}
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t("tagline")}
          </p>
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-muted-foreground/80">
            {t("footer.licenseNote")}
          </p>
        </div>

        <nav aria-label={t("footer.scripturesTradition")}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("footer.scripturesTradition")}
          </h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {TRADITION_LINKS.map(({ path, key }) => (
              <li key={path}>
                <Link
                  to={path}
                  className="text-sm text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
                >
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("footer.study")}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("footer.study")}
          </h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {STUDY_LINKS.map(({ path, key }) => (
              <li key={path}>
                <Link
                  to={path}
                  className="text-sm text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
                >
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-border/60">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-muted-foreground">
          {t("footer.rights")}
        </p>
      </div>
    </footer>
  )
}
