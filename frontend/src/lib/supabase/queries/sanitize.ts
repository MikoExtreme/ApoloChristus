// As funções de pesquisa/concordância no Postgres usam to_tsquery(), que
// rebenta com erro de sintaxe em input livre (pontuação, várias palavras
// mal formadas). Sanitiza aqui, uma vez, em vez de em cada chamador.
export function toTsQueryInput(raw: string): string {
  const terms = raw
    .normalize("NFKC")
    .split(/\s+/)
    .map((term) => term.replace(/[&|!():*'"]/g, "").trim())
    .filter(Boolean)
  return terms.join(" & ")
}
