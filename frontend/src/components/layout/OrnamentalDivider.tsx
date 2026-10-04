import { useThemeStore } from "@/features/theme/store/useThemeStore"
import { ThemeMark } from "@/components/layout/ThemeMark"

export function OrnamentalDivider({ className = "" }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme)

  return (
    <div
      className={`flex items-center justify-center gap-3 py-2 text-primary/50 ${className}`}
      aria-hidden="true"
    >
      <span className="h-px w-16 bg-current opacity-40" />
      <ThemeMark theme={theme} />
      <span className="h-px w-16 bg-current opacity-40" />
    </div>
  )
}
