import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import ptCommon from "./locales/pt/common.json"
import ptBible from "./locales/pt/bible.json"
import ptPatristics from "./locales/pt/patristics.json"
import ptApocrypha from "./locales/pt/apocrypha.json"
import ptCreeds from "./locales/pt/creeds.json"
import ptCouncils from "./locales/pt/councils.json"
import ptGlossary from "./locales/pt/glossary.json"
import ptLexicon from "./locales/pt/lexicon.json"
import ptGeography from "./locales/pt/geography.json"
import ptSearch from "./locales/pt/search.json"
import ptTimeline from "./locales/pt/timeline.json"
import ptApologetics from "./locales/pt/apologetics.json"

import enCommon from "./locales/en/common.json"
import enBible from "./locales/en/bible.json"
import enPatristics from "./locales/en/patristics.json"
import enApocrypha from "./locales/en/apocrypha.json"
import enCreeds from "./locales/en/creeds.json"
import enCouncils from "./locales/en/councils.json"
import enGlossary from "./locales/en/glossary.json"
import enLexicon from "./locales/en/lexicon.json"
import enGeography from "./locales/en/geography.json"
import enSearch from "./locales/en/search.json"
import enTimeline from "./locales/en/timeline.json"
import enApologetics from "./locales/en/apologetics.json"

export const defaultNS = "common"

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "pt",
    supportedLngs: ["pt", "en"],
    defaultNS,
    ns: [
      "common",
      "bible",
      "patristics",
      "apocrypha",
      "creeds",
      "councils",
      "glossary",
      "lexicon",
      "geography",
      "search",
      "timeline",
      "apologetics",
    ],
    resources: {
      pt: {
        common: ptCommon,
        bible: ptBible,
        patristics: ptPatristics,
        apocrypha: ptApocrypha,
        creeds: ptCreeds,
        councils: ptCouncils,
        glossary: ptGlossary,
        lexicon: ptLexicon,
        geography: ptGeography,
        search: ptSearch,
        timeline: ptTimeline,
        apologetics: ptApologetics,
      },
      en: {
        common: enCommon,
        bible: enBible,
        patristics: enPatristics,
        apocrypha: enApocrypha,
        creeds: enCreeds,
        councils: enCouncils,
        glossary: enGlossary,
        lexicon: enLexicon,
        geography: enGeography,
        search: enSearch,
        timeline: enTimeline,
        apologetics: enApologetics,
      },
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
