import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"
import { router } from "@/routes/router"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // app de leitura/conteúdo público — não vale a pena martelar a API
      // do Supabase em retries agressivos nem refetch a cada focus de janela.
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App
