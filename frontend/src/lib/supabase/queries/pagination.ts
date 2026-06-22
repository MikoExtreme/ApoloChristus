// O Supabase/PostgREST limita cada pedido a 1000 linhas por omissão. Para
// tabelas maiores que isso (verses, biblical_places, interlinear_words em
// capítulos longos), é preciso paginar explicitamente para não truncar
// resultados silenciosamente.
const PAGE_SIZE = 1000

export async function fetchAllRows<T>(
  queryPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const allRows: T[] = []
  let from = 0
  for (;;) {
    const { data, error } = await queryPage(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return allRows
}
