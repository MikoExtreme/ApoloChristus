import { create } from "zustand"

// Estado dos toggles do leitor bíblico. NÃO persiste em localStorage de
// propósito — os toggles começam sempre desligados por sessão para evitar
// confusão visual; o que É partilhável/bookmark-ável vive nos query params
// da rota (ver BibleChapterPage), que inicializam este store ao montar.
export type ConcordanceMode = "text" | "original"

interface ReaderState {
  interlinear: boolean
  crossReferences: boolean
  patristicCitations: boolean
  concordanceActive: boolean
  concordanceMode: ConcordanceMode
  // grc-grctr/hbo-wlc (texto original) são bible_versions normais no schema,
  // por isso "comparação com o original" é só escolher esse version_id aqui.
  parallelVersions: string[]
  setInterlinear: (value: boolean) => void
  setCrossReferences: (value: boolean) => void
  setPatristicCitations: (value: boolean) => void
  setConcordanceActive: (value: boolean) => void
  setConcordanceMode: (mode: ConcordanceMode) => void
  setParallelVersions: (versions: string[]) => void
  reset: () => void
}

const initialState = {
  interlinear: false,
  crossReferences: false,
  patristicCitations: false,
  concordanceActive: false,
  concordanceMode: "text" as ConcordanceMode,
  parallelVersions: [] as string[],
}

export const useReaderStore = create<ReaderState>()((set) => ({
  ...initialState,
  setInterlinear: (value) => set({ interlinear: value }),
  setCrossReferences: (value) => set({ crossReferences: value }),
  setPatristicCitations: (value) => set({ patristicCitations: value }),
  setConcordanceActive: (value) => set({ concordanceActive: value }),
  setConcordanceMode: (mode) => set({ concordanceMode: mode }),
  // máx. 2 colunas (original+tradução ou 2 traduções), per decisão do utilizador
  setParallelVersions: (versions) => set({ parallelVersions: versions.slice(0, 2) }),
  reset: () => set(initialState),
}))
