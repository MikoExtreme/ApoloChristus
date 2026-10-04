import type { Theme } from "@/features/theme/store/useThemeStore"

// Marca visual de cada tradição — usada no logo da NavBar, no divisor
// ornamental e no rodapé, para que a identidade denominacional seja
// consistente em toda a interface.
export function ThemeMark({ theme, className }: { theme: Theme; className?: string }) {
  switch (theme) {
    case "catholic":
      return (
        // Cruz pattée — braços alargam nas pontas (motivo heráldico católico)
        <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor" className={className} aria-hidden="true">
          <rect x="6" y="0" width="2" height="16" rx="0.3" />
          <rect x="0" y="5.5" width="14" height="2" rx="0.3" />
          <rect x="4.5" y="0" width="5" height="1.8" rx="0.9" />
          <rect x="4.5" y="14.2" width="5" height="1.8" rx="0.9" />
          <rect x="0" y="4.5" width="1.8" height="4.5" rx="0.9" />
          <rect x="12.2" y="4.5" width="1.8" height="4.5" rx="0.9" />
        </svg>
      )
    case "orthodox":
      return (
        // Cruz de 3 barras com suppedaneum diagonal — cruz ortodoxa eslava
        <svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor" className={className} aria-hidden="true">
          <rect x="6.2" y="0" width="1.6" height="18" rx="0.3" />
          <rect x="3.5" y="2" width="7" height="1.5" rx="0.3" />
          <rect x="0" y="7" width="14" height="1.5" rx="0.3" />
          <path d="M2.5 15.5L11.5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      )
    case "agnostic":
      return (
        // Três traços horizontais decrescentes — secular, sem símbolo religioso
        <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor" className={className} aria-hidden="true">
          <rect x="0" y="0" width="16" height="1.5" rx="0.75" />
          <rect x="2" y="4.25" width="12" height="1.5" rx="0.75" />
          <rect x="4.5" y="8.5" width="7" height="1.5" rx="0.75" />
        </svg>
      )
    default:
      return (
        // Cruz latina simples — protestante (sola scriptura, sem ornamento)
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" className={className} aria-hidden="true">
          <rect x="4" y="0" width="2" height="14" rx="1" />
          <rect x="0" y="4" width="10" height="2" rx="1" />
        </svg>
      )
  }
}
