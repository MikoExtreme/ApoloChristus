// Letra capitular, ao estilo dos manuscritos iluminados — usada no início
// do primeiro capítulo de cada livro bíblico e na primeira secção de obras
// patrísticas/credos. Separa a primeira letra visível do resto do texto
// (não usa ::first-letter porque o texto vem misturado com badges/botões).
interface DropCapProps {
  text: string
  className?: string
}

export function DropCap({ text, className = "" }: DropCapProps) {
  const trimmed = text.trimStart()
  const first = trimmed.slice(0, 1)
  const rest = trimmed.slice(1)
  if (!first) return <>{text}</>
  return (
    <span className={className}>
      <span
        aria-hidden="true"
        className="float-left mr-2 mt-1 font-serif text-6xl leading-[0.8] text-primary"
        style={{ fontVariantLigatures: "none" }}
      >
        {first}
      </span>
      <span className="sr-only">{first}</span>
      {rest}
    </span>
  )
}
