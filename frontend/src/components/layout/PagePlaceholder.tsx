interface PagePlaceholderProps {
  title: string
  description?: string
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-foreground">{title}</h1>
      {description && <p className="mt-2 text-muted-foreground">{description}</p>}
    </div>
  )
}
