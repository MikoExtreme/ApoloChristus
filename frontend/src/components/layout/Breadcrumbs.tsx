import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

// Trilho de navegação reutilizável para páginas com vários níveis de
// profundidade (período/autor/obra, categoria/obra, etc.) — o último item
// é sempre a página atual, sem link.
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0" />}
            {isLast || !item.to ? (
              <span className={isLast ? "text-foreground" : ""}>{item.label}</span>
            ) : (
              <Link to={item.to} className="hover:underline">
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
