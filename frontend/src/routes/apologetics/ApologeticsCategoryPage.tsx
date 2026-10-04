import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getArgumentsByCategory } from "@/lib/supabase/queries/apologetics"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/layout/EmptyState"
import type { ApologeticsCategory } from "@/types/database.types"

export function ApologeticsCategoryPage() {
  const { category } = useParams<{ category: string }>()
  const { t, i18n } = useTranslation(["apologetics", "common"])

  const { data: args, isLoading } = useQuery({
    queryKey: ["apologetics", category],
    queryFn: () => getArgumentsByCategory(category as ApologeticsCategory),
    enabled: !!category,
  })

  const categoryLabel = t(`apologetics:categories.${category}`)

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Breadcrumbs
        items={[
          { label: t("apologetics:title"), to: "/apologetics" },
          { label: categoryLabel },
        ]}
      />

      <h1 className="font-serif text-3xl text-foreground">{categoryLabel}</h1>
      <p className="mt-2 text-muted-foreground">
        {t(`apologetics:categorySubtitles.${category}`)}
      </p>

      <div className="mt-10 flex flex-col gap-10">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ))
          : args?.map((arg) => {
              const title = i18n.language === "pt" ? (arg.title_pt ?? arg.title_en) : arg.title_en
              const subtitle = i18n.language === "pt" ? (arg.subtitle_pt ?? arg.subtitle_en) : arg.subtitle_en
              const explanation = i18n.language === "pt" ? (arg.explanation_pt ?? arg.explanation_en) : arg.explanation_en
              const logicalForm = i18n.language === "pt" ? (arg.logical_form_pt ?? arg.logical_form_en) : arg.logical_form_en

              return (
                <article key={arg.id} className="border-t border-border pt-8 first:border-t-0 first:pt-0">
                  <h2 className="font-serif text-xl font-semibold text-foreground">{title}</h2>
                  {subtitle && (
                    <p className="mt-1 text-sm text-muted-foreground italic">{subtitle}</p>
                  )}

                  {logicalForm && (
                    <div className="mt-5 rounded-lg border border-border bg-muted/30 px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                        {t("apologetics:premises")}
                      </p>
                      <ol className="flex flex-col gap-2 list-none">
                        {logicalForm.premises.map((p, i) => (
                          <li key={i} className="flex gap-3 text-sm text-foreground">
                            <span className="shrink-0 font-semibold text-primary">P{i + 1}.</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ol>
                      <div className="mt-4 pt-3 border-t border-border flex gap-3">
                        <span className="shrink-0 text-sm font-semibold text-primary">
                          ∴
                        </span>
                        <p className="text-sm font-medium text-foreground">{logicalForm.conclusion}</p>
                      </div>
                    </div>
                  )}

                  <p className="mt-5 font-serif text-base leading-relaxed text-foreground/90">
                    {explanation}
                  </p>

                  {arg.historical_origin && (
                    <p className="mt-4 text-xs text-muted-foreground border-l-2 border-border pl-3">
                      <span className="font-medium">{t("apologetics:historicalOrigin")}:</span>{" "}
                      {arg.historical_origin}
                    </p>
                  )}
                </article>
              )
            })}
      </div>

      {!isLoading && args?.length === 0 && (
        <EmptyState title={t("common:common.notFound")} />
      )}
    </div>
  )
}
