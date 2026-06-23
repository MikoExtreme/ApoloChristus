import { createBrowserRouter } from "react-router-dom"

import { RootLayout } from "@/routes/RootLayout"
import { HomePage } from "@/routes/HomePage"
import { NotFoundPage } from "@/routes/NotFoundPage"

import { BibleLandingPage } from "@/routes/bible/BibleLandingPage"
import { BibleBookPage } from "@/routes/bible/BibleBookPage"
import { BibleChapterPage } from "@/routes/bible/BibleChapterPage"
import { BibleJumpPage } from "@/routes/bible/BibleJumpPage"
import { FavoritesPage } from "@/routes/bible/FavoritesPage"

import { PatristicsLandingPage } from "@/routes/patristics/PatristicsLandingPage"
import { PatristicsAuthorPage } from "@/routes/patristics/PatristicsAuthorPage"
import { PatristicsWorkPage } from "@/routes/patristics/PatristicsWorkPage"
import { PatristicsSectionPage } from "@/routes/patristics/PatristicsSectionPage"

import { ApocryphaLandingPage } from "@/routes/apocrypha/ApocryphaLandingPage"
import { ApocryphaWorkPage } from "@/routes/apocrypha/ApocryphaWorkPage"
import { ApocryphaSectionPage } from "@/routes/apocrypha/ApocryphaSectionPage"

import { CreedsLandingPage } from "@/routes/creeds/CreedsLandingPage"
import { CreedsSectionPage } from "@/routes/creeds/CreedsSectionPage"

import { GlossaryLandingPage } from "@/routes/glossary/GlossaryLandingPage"
import { GlossaryTermPage } from "@/routes/glossary/GlossaryTermPage"

import { LexiconLandingPage } from "@/routes/lexicon/LexiconLandingPage"
import { LexiconEntryPage } from "@/routes/lexicon/LexiconEntryPage"

import { GeographyLandingPage } from "@/routes/geography/GeographyLandingPage"
import { GeographyMapPage } from "@/routes/geography/GeographyMapPage"
import { GeographyPlacePage } from "@/routes/geography/GeographyPlacePage"

import { SearchResultsPage } from "@/routes/search/SearchResultsPage"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },

      { path: "bible", element: <BibleLandingPage /> },
      { path: "bible/go", element: <BibleJumpPage /> },
      { path: "bible/:versionId", element: <BibleBookPage /> },
      { path: "bible/:versionId/:book/:chapter", element: <BibleChapterPage /> },
      { path: "favorites", element: <FavoritesPage /> },

      { path: "patristics", element: <PatristicsLandingPage /> },
      { path: "patristics/:period", element: <PatristicsAuthorPage /> },
      { path: "patristics/:period/:authorId", element: <PatristicsWorkPage /> },
      { path: "patristics/:period/:authorId/:workId", element: <PatristicsSectionPage /> },

      { path: "apocrypha", element: <ApocryphaLandingPage /> },
      { path: "apocrypha/:category", element: <ApocryphaWorkPage /> },
      { path: "apocrypha/:category/:workId", element: <ApocryphaSectionPage /> },

      { path: "creeds", element: <CreedsLandingPage /> },
      { path: "creeds/:workId", element: <CreedsSectionPage /> },

      { path: "glossary", element: <GlossaryLandingPage /> },
      { path: "glossary/:term", element: <GlossaryTermPage /> },

      { path: "lexicon", element: <LexiconLandingPage /> },
      { path: "lexicon/:dStrong", element: <LexiconEntryPage /> },

      { path: "geography", element: <GeographyLandingPage /> },
      { path: "geography/map", element: <GeographyMapPage /> },
      { path: "geography/:name", element: <GeographyPlacePage /> },

      { path: "search", element: <SearchResultsPage /> },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
