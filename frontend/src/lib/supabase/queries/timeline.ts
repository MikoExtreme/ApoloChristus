import { supabase } from "@/lib/supabase/client"
import { isRestrictedApocryphon } from "@/lib/content/restrictedWorks"

export type TimelineCategory = "council" | "creed" | "father" | "apocrypha"

export type TimelineItem = {
  id: string
  year: number
  yearDisplay: string
  titleEn: string
  titlePt: string
  category: TimelineCategory
  href: string
}

function parseFirstYear(raw: string | null | undefined): number | null {
  if (!raw?.trim()) return null
  const cleaned = raw.replace(/\bc\.?\s*a?\.?\s*/gi, "").trim()
  const m = cleaned.match(/(\d{1,4})/)
  return m ? parseInt(m[1]) : null
}

export async function getTimelineItems(): Promise<TimelineItem[]> {
  const [councilsRes, creedsRes, authorsRes, apocryphaRes] = await Promise.all([
    supabase.from("councils").select("id, name, name_pt, year"),
    supabase.from("creeds_confessions").select("id, title, year"),
    supabase.from("patristic_authors").select("id, name_en, name_pt, dates, period"),
    supabase.from("apocryphal_works").select("id, title_en, title_pt, category, date_estimate"),
  ])

  const items: TimelineItem[] = []

  for (const c of councilsRes.data ?? []) {
    const year = parseFirstYear(c.year)
    if (year == null) continue
    items.push({
      id: `council-${c.id}`,
      year,
      yearDisplay: c.year ?? "",
      titleEn: c.name,
      titlePt: c.name_pt ?? c.name,
      category: "council",
      href: `/councils/${c.id}`,
    })
  }

  for (const cr of creedsRes.data ?? []) {
    const year = parseFirstYear(cr.year)
    if (year == null) continue
    items.push({
      id: `creed-${cr.id}`,
      year,
      yearDisplay: cr.year ?? "",
      titleEn: cr.title,
      titlePt: cr.title,
      category: "creed",
      href: `/creeds/${cr.id}`,
    })
  }

  for (const a of authorsRes.data ?? []) {
    const year = parseFirstYear(a.dates)
    if (year == null) continue
    items.push({
      id: `father-${a.id}`,
      year,
      yearDisplay: a.dates ?? "",
      titleEn: a.name_en,
      titlePt: a.name_pt ?? a.name_en,
      category: "father",
      href: `/patristics/${a.period}/${a.id}`,
    })
  }

  for (const ap of apocryphaRes.data ?? []) {
    if (isRestrictedApocryphon(ap.id)) continue
    if (!ap.date_estimate?.trim()) continue
    const year = parseFirstYear(ap.date_estimate)
    if (year == null) continue
    items.push({
      id: `apocrypha-${ap.id}`,
      year,
      yearDisplay: ap.date_estimate,
      titleEn: ap.title_en,
      titlePt: ap.title_pt ?? ap.title_en,
      category: "apocrypha",
      href: `/apocrypha/${ap.category}/${ap.id}`,
    })
  }

  return items.sort((a, b) => a.year - b.year)
}
