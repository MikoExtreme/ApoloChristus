import { useTranslation } from "react-i18next"
import { PagePlaceholder } from "@/components/layout/PagePlaceholder"

export function NotFoundPage() {
  const { t } = useTranslation("common")
  return <PagePlaceholder title="404" description={t("common.notFound")} />
}
