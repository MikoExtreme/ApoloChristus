import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { SearchBar } from "@/features/search/components/SearchBar"
import { OrnamentalDivider } from "@/components/layout/OrnamentalDivider"
import { bookDisplayName } from "@/features/bible/lib/bookNames"
import { useReadingHistoryStore } from "@/features/bible/store/useReadingHistoryStore"
import {
  ArrowRight,
  BookA,
  BookOpen,
  ChevronRight,
  FileText,
  History,
  Landmark,
  Languages,
  Map,
  Scroll,
  ScrollText,
  Shield,
} from "lucide-react"

// Apologética não entra aqui — tem uma banda de destaque própria no fim.
const SECTIONS = [
  { path: "/bible",      key: "nav.bible",      descKey: "home.desc.bible",      icon: BookOpen   },
  { path: "/patristics", key: "nav.patristics", descKey: "home.desc.patristics", icon: ScrollText },
  { path: "/apocrypha",  key: "nav.apocrypha",  descKey: "home.desc.apocrypha",  icon: Scroll     },
  { path: "/creeds",     key: "nav.creeds",     descKey: "home.desc.creeds",     icon: FileText   },
  { path: "/councils",   key: "nav.councils",   descKey: "home.desc.councils",   icon: Landmark   },
  { path: "/glossary",   key: "nav.glossary",   descKey: "home.desc.glossary",   icon: BookA      },
  { path: "/lexicon",    key: "nav.lexicon",    descKey: "home.desc.lexicon",    icon: Languages  },
  { path: "/geography",  key: "nav.geography",  descKey: "home.desc.geography",  icon: Map        },
  { path: "/timeline",   key: "nav.timeline",   descKey: "home.desc.timeline",   icon: History    },
] as const

// Números reais da base de dados (ver ESTADO_PROJETO_COMPLETO) — dão escala
// e credibilidade à primeira vista. Atualizar quando o conteúdo crescer.
const STATS = [
  { value: 161281, labelKey: "home.stats.verses" },
  { value: 341,    labelKey: "home.stats.patristicWorks" },
  { value: 22710,  labelKey: "home.stats.lexiconEntries" },
  { value: 1232,   labelKey: "home.stats.places" },
] as const

export function HomePage() {
  const { t, i18n } = useTranslation(["common", "bible"])
  const lastRead = useReadingHistoryStore((s) => s.lastRead)
  const numberFormat = new Intl.NumberFormat(i18n.language === "pt" ? "pt-PT" : "en-GB")

  return (
    <div>
      {/* Hero */}
      <section className="relative border-b border-border/60 bg-gradient-to-b from-primary/5 via-transparent to-transparent">
        <div className="mx-auto max-w-3xl px-4 pb-14 pt-20 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {t("home.eyebrow")}
          </p>
          <h1 className="mt-4 font-serif text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
            {t("appName")}
          </h1>
          <OrnamentalDivider className="mt-5" />
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
            {t("tagline")}
          </p>

          <div className="mx-auto mt-8 max-w-md">
            <SearchBar />
          </div>

          {lastRead && (
            <Link
              to={`/bible/${lastRead.versionId}/${lastRead.book}/${lastRead.chapter}`}
              className="mx-auto mt-4 block max-w-md"
            >
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between px-5 py-3 text-left">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("bible:continueReading.title")}</p>
                    <p className="font-serif text-lg leading-snug">
                      {bookDisplayName(lastRead.book, i18n.language)} {lastRead.chapter}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </section>

      {/* Banda de estatísticas */}
      <section className="border-b border-border/60 bg-card/50">
        <dl className="mx-auto grid max-w-4xl grid-cols-2 sm:grid-cols-4 sm:divide-x sm:divide-border/60">
          {STATS.map(({ value, labelKey }) => (
            <div key={labelKey} className="flex flex-col items-center gap-1 px-4 py-6">
              <dd className="order-1 font-serif text-3xl font-semibold text-primary">
                {numberFormat.format(value)}
              </dd>
              <dt className="order-2 text-xs uppercase tracking-wider text-muted-foreground">
                {t(labelKey)}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Grelha de secções */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {t("home.explore")}
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map(({ path, key, descKey, icon: Icon }) => (
            <Link key={path} to={path} className="group">
              <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-primary/30">
                <CardContent className="flex gap-4 px-5 py-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      {t(key)}
                      <ChevronRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </span>
                    <p className="text-xs leading-snug text-muted-foreground">{t(descKey)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Apologética em destaque — é a secção que dá nome ao site */}
        <Link to="/apologetics" className="group mt-6 block">
          <Card className="ring-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-primary/40">
            <CardContent className="flex flex-col gap-5 px-6 py-8 text-left sm:flex-row sm:items-center sm:gap-6">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Shield className="size-6" strokeWidth={1.75} />
              </span>
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary/70">
                  {t("home.featured.label")}
                </p>
                <h3 className="mt-1 font-serif text-2xl font-semibold text-foreground">
                  {t("nav.apologetics")}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t("home.desc.apologetics")}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary">
                {t("home.featured.cta")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </CardContent>
          </Card>
        </Link>
      </section>
    </div>
  )
}
