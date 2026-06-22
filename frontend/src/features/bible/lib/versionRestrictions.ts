import type { Testament } from "@/types/database.types"

// Algumas versões só cobrem um testamento (ver VERSIONS em
// bible_fetcher.py: grc-grctr tem testament_only="NT", hbo-wlc tem
// testament_only="OT"). Não está guardado no schema, por isso fica aqui,
// usado para filtrar o seletor de comparação (não faz sentido oferecer o
// hebraico original ao comparar um livro do Novo Testamento, e vice-versa).
const TESTAMENT_ONLY: Partial<Record<string, Testament>> = {
  "grc-grctr": "NT",
  "hbo-wlc": "OT",
}

export function isVersionCompatibleWithTestament(versionId: string, testament: Testament): boolean {
  const restriction = TESTAMENT_ONLY[versionId]
  return !restriction || restriction === testament
}
