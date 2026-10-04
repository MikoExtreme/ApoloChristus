// Obras cuja única tradução disponível é moderna e com direitos de autor
// (ou com aviso de copyright explícito na fonte). Os dados continuam na base
// de dados, mas a aplicação não os lista, pesquisa nem mostra.
//
// Para voltar a mostrar uma obra, depois de obter autorização ou uma
// tradução livre, basta retirá-la desta lista.
//   gospel_thomas     — Patterson/Meyer, Polebridge Press 1992/1994
//   gospel_thomas_pt  — tradução portuguesa de Huberto Rohden
//   gospel_truth      — Robert M. Grant, tradução moderna
export const RESTRICTED_APOCRYPHA: readonly string[] = [
  "gospel_thomas",
  "gospel_thomas_pt",
  "gospel_truth",
]

export function isRestrictedApocryphon(workId: string | null | undefined): boolean {
  return !!workId && RESTRICTED_APOCRYPHA.includes(workId)
}
